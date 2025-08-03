<template>
  <el-row :gutter="24">
    <el-col :span="16">
      <el-card class="file-list-panel">
        <template #header>
          <div class="card-header">
            <span>文件列表</span>
            <el-button type="danger" plain size="small" @click="clearFiles">清空列表</el-button>
          </div>
        </template>
        <div class="file-upload-container">
          <el-button type="primary" @click="selectFiles" :icon="UploadFilled">选择视频</el-button>
          <div class="file-list-scroll">
            <div v-for="file in fileList" :key="file.path" class="file-list-item">
                <div class="file-icon"><el-icon><Film /></el-icon></div>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">大小: {{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
                  <div v-if="file.status === 'processing'">
                    <el-progress :percentage="file.progress || 0" :text-inside="true" :stroke-width="16" />
                  </div>
                  <div v-if="file.outputPath">
                    <span class="processed-path">输出: {{ file.outputPath }}</span>
                  </div>
                  <div v-if="file.error">
                    <el-tag type="danger">{{ file.error }}</el-tag>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card class="control-panel">
        <el-tabs v-model="activeTool" class="tool-tabs">
          <el-tab-pane label="格式转换" name="convert">
            <el-form label-position="top">
              <el-form-item label="目标格式">
                <el-select v-model="convertFormat" placeholder="请选择格式" style="width: 100%;">
                  <el-option label="MP4" value="mp4" />
                  <el-option label="MOV" value="mov" />
                  <el-option label="AVI" value="avi" />
                  <el-option label="WebM" value="webm" />
                  <el-option label="MKV" value="mkv" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="startProcessing" 
                  :disabled="fileList.length === 0 || isProcessing" 
                  :loading="isProcessing"
                  style="width: 100%;"
                >
                  {{ isProcessing ? '处理中...' : `开始 ${taskMap[activeTool]}` }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="音频提取" name="extract">
            <el-form label-position="top">
               <el-form-item label="目标格式">
                <el-select v-model="extractFormat" placeholder="请选择格式" style="width: 100%;">
                  <el-option label="MP3" value="mp3" />
                  <el-option label="WAV" value="wav" />
                  <el-option label="AAC" value="aac" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="startProcessing" 
                  :disabled="fileList.length === 0 || isProcessing" 
                  :loading="isProcessing"
                  style="width: 100%;"
                >
                  {{ isProcessing ? '处理中...' : `开始 ${taskMap[activeTool]}` }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="智能压缩" name="compress">
            <el-form label-position="top">
               <el-form-item label="目标清晰度">
                <el-select v-model="compressResolution" placeholder="请选择清晰度" style="width: 100%;">
                  <el-option label="1080p (全高清)" value="1920x1080" />
                  <el-option label="720p (高清)" value="1280x720" />
                  <el-option label="480p (标清)" value="854x480" />
                  <el-option label="360p (流畅)" value="640x360" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="startProcessing" 
                  :disabled="fileList.length === 0 || isProcessing" 
                  :loading="isProcessing"
                  style="width: 100%;"
                >
                  {{ isProcessing ? '处理中...' : `开始 ${taskMap[activeTool]}` }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { UploadFilled, Film } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const activeTool = ref('convert');
const convertFormat = ref('mp4');
const extractFormat = ref('mp3');
const compressResolution = ref('1280x720');
const fileList = ref([]);
const isProcessing = ref(false);

const taskMap = {
  convert: '格式转换',
  extract: '音频提取',
  compress: '智能压缩',
};

const clearFiles = () => {
  fileList.value = [];
};

const selectFiles = async () => {
  const files = await window.electronAPI.openFile({
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
    ]
  });
  if (files.length > 0) {
    // Add a UID to each file for progress tracking
    const newFiles = files.map(f => ({ 
      ...f, 
      uid: Date.now() + Math.random(),
      status: 'ready',
      progress: 0,
      error: null,
      outputPath: null
    }));
    fileList.value = [...fileList.value, ...newFiles];
  }
};

const setupProgressListener = () => {
  window.electronAPI.onVideoProgress(({ fileId, progress }) => {
    const file = fileList.value.find(f => f.uid === fileId);
    if (file) {
      file.progress = progress;
    }
  });
};

onMounted(() => {
  setupProgressListener();
});

onBeforeUnmount(() => {
  window.electronAPI.removeVideoProgressListener();
});

const startProcessing = async () => {
  isProcessing.value = true;

  // 为每个文件设置初始状态
  fileList.value.forEach(file => {
    file.status = 'processing';
    file.progress = 0;
    file.error = null;
    file.outputPath = null;
  });

  const options = {
    convert: { format: convertFormat.value },
    extract: { format: extractFormat.value },
    compress: { resolution: compressResolution.value },
  };

  try {
    const result = await window.electronAPI.processVideos({
      files: JSON.parse(JSON.stringify(fileList.value)),
      task: activeTool.value,
      options: options[activeTool.value],
    });

    fileList.value = result.files;
    
    if (result.errorCount > 0) {
      ElMessage.warning(`${taskMap[activeTool.value]}完成！成功 ${result.successCount} 个，失败 ${result.errorCount} 个。`);
    } else {
      ElMessage.success(`${taskMap[activeTool.value]}完成！所有文件处理成功。`);
    }
  } catch (error) {
    ElMessage.error(`处理失败：${error.message}`);
    fileList.value.forEach(file => {
      file.status = 'error';
      file.error = error.message;
    });
  } finally {
    isProcessing.value = false;
  }
};

</script>

<style scoped>
.control-panel, .file-list-panel {
  height: calc(100vh - 108px);
}
.file-upload-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.file-list-scroll {
  flex-grow: 1;
  overflow-y: auto;
  margin-top: 16px;
}
.tool-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tool-tabs .el-tabs__content {
  flex-grow: 1;
}
.file-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  width: 100%;
  border-bottom: 1px solid #eee;
}
.file-icon {
  font-size: 24px;
  color: #606266;
}
.file-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
}
.file-name {
  font-weight: bold;
}
.file-size, .processed-path {
  font-size: 12px;
  color: #909399;
}
.processed-path {
  color: #67c23a;
  cursor: pointer;
}
.processed-path:hover {
  text-decoration: underline;
}
</style>
