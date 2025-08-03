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
          <el-button type="primary" @click="selectFiles" :icon="UploadFilled">选择图片</el-button>
          <div class="file-list-scroll">
            <div v-for="file in fileList" :key="file.path" class="file-list-item">
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">大小: {{ (file.size / 1024).toFixed(2) }} KB</span>
                  <div v-if="file.status === 'processing'">
                    <el-progress :percentage="100" status="success" :indeterminate="true" :duration="2" />
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
          <el-tab-pane label="图片压缩" name="compress">
            <el-form label-position="top">
              <el-form-item label="压缩质量 (JPEG)">
                <el-slider v-model="compressionQuality" :min="0.1" :max="1" :step="0.1" show-input />
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
          <el-tab-pane label="格式转换" name="convert">
            <el-form label-position="top">
              <el-form-item label="目标格式">
                <el-select v-model="convertFormat" placeholder="请选择格式" style="width: 100%;">
                  <el-option label="PNG" value="png" />
                  <el-option label="JPEG" value="jpeg" />
                  <el-option label="WebP" value="webp" />
                  <el-option label="TIFF" value="tiff" />
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
          <el-tab-pane label="添加水印" name="watermark">
            <el-form label-position="top">
              <el-form-item label="水印图片">
                <el-button type="primary" @click="selectWatermarkFile">选择水印</el-button>
                <span v-if="watermarkFile" class="watermark-name">{{ watermarkFile.name }}</span>
              </el-form-item>
              <el-form-item label="水印位置">
                 <el-radio-group v-model="watermarkPosition" size="small">
                    <el-radio-button label="northwest">左上</el-radio-button>
                    <el-radio-button label="north">中上</el-radio-button>
                    <el-radio-button label="northeast">右上</el-radio-button>
                    <el-radio-button label="west">左中</el-radio-button>
                    <el-radio-button label="center">居中</el-radio-button>
                    <el-radio-button label="east">右中</el-radio-button>
                    <el-radio-button label="southwest">左下</el-radio-button>
                    <el-radio-button label="south">中下</el-radio-button>
                    <el-radio-button label="southeast">右下</el-radio-button>
                  </el-radio-group>
              </el-form-item>
              <el-form-item label="水印不透明度">
                <el-slider v-model="watermarkOpacity" :min="0.1" :max="1" :step="0.1" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="startProcessing" 
                  :disabled="fileList.length === 0 || !watermarkFile || isProcessing" 
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
import { ref } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const activeTool = ref('compress');
const compressionQuality = ref(0.7);
const convertFormat = ref('png');
const watermarkFile = ref(null);
const watermarkPosition = ref('southeast');
const watermarkOpacity = ref(0.8);
const fileList = ref([]);
const isProcessing = ref(false);

const taskMap = {
  compress: '图片压缩',
  convert: '格式转换',
  watermark: '添加水印',
};

const clearFiles = () => {
  fileList.value = [];
};

const selectFiles = async () => {
  const files = await window.electronAPI.openFile({
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'] },
    ]
  });
  if (files.length > 0) {
    fileList.value = [...fileList.value, ...files];
  }
};

const selectWatermarkFile = async () => {
  const files = await window.electronAPI.openFile({
    filters: [
      { name: 'Images', extensions: ['png'] },
    ]
  });
  if (files.length > 0) {
    watermarkFile.value = files[0];
  }
};

const startProcessing = async () => {
  isProcessing.value = true;

  const options = {
    compress: { quality: compressionQuality.value },
    convert: { format: convertFormat.value },
    watermark: { 
      watermarkPath: watermarkFile.value ? watermarkFile.value.path : null,
      options: {
        position: watermarkPosition.value,
        opacity: watermarkOpacity.value,
      }
    },
  };

  const result = await window.electronAPI.processImages({
    files: JSON.parse(JSON.stringify(fileList.value)),
    task: activeTool.value,
    options: options[activeTool.value],
  });

  fileList.value = result.files;
  isProcessing.value = false;
  
  ElMessage.success(`${taskMap[activeTool.value]}完成！成功 ${result.successCount} 个，失败 ${result.errorCount} 个。`);
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
.watermark-name {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
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
  padding: 5px;
  width: 100%;
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
