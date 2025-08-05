<template>
  <div class="auto-editor-container">
    <el-row :gutter="24" class="full-height">
      <!-- 左侧控制面板 -->
      <el-col :span="8" class="control-panel">
        <el-card class="control-card">
          <template #header>
            <div class="card-header">
              <span>🎬 自动混剪配置</span>
            </div>
          </template>

          <!-- 步骤1：选择主播 -->
          <div class="config-section">
            <h3>1️⃣ 选择主播</h3>
            <el-select v-model="selectedAnchor" placeholder="请选择主播" style="width: 100%">
              <el-option v-for="anchor in anchorOptions" :key="anchor" :label="anchor" :value="anchor" />
            </el-select>
          </div>

          <!-- 步骤2：设置速度 -->
          <div class="config-section">
            <h3>2️⃣ 调整速度</h3>
            <el-slider v-model="playbackSpeed" :min="0.5" :max="2" :step="0.1" show-input />
          </div>

          <!-- 步骤3：选择背景音乐 -->
          <div class="config-section">
            <h3>3️⃣ 背景音乐</h3>
            <el-button @click="selectBgMusicFolder" type="primary" plain style="width: 100%">
              {{ bgMusicPath || '选择背景音乐文件夹' }}
            </el-button>
            <el-tag v-if="bgMusicCount" type="info" style="margin-top: 8px">
              找到 {{ bgMusicCount }} 首音乐
            </el-tag>
          </div>

          <!-- 步骤4：选择素材文件夹 -->
          <div class="config-section">
            <h3>4️⃣ 素材文件夹</h3>
            <el-button @click="selectMaterialFolder" type="primary" plain style="width: 100%">
              {{ materialPath || '选择素材主文件夹' }}
            </el-button>
          </div>

          <!-- 步骤5：镜头时长设置 -->
          <div class="config-section">
            <h3>5️⃣ 镜头时长设置</h3>
            <div v-for="(folder, key) in folderConfigs" :key="key" class="folder-config">
              <div class="folder-label">{{ key.toUpperCase() }}文件夹:</div>
              <el-input-number v-model="folder.duration" :min="1" :max="30" :step="1" style="width: 120px" />
              <span>秒</span>
            </div>
          </div>

          <!-- 步骤6：话术文件夹 -->
          <div class="config-section">
            <h3>6️⃣ 话术文件夹</h3>
            <el-button @click="selectScriptFolder" type="primary" plain style="width: 100%">
              {{ scriptPath || '选择话术文件夹' }}
            </el-button>
          </div>

          <!-- 步骤7：原音控制 -->
          <div class="config-section">
            <h3>7️⃣ 原音控制</h3>
            <el-switch v-model="keepOriginalAudio" active-text="保留原音" inactive-text="关闭原音" />
          </div>

          <!-- 步骤8：保存模板 -->
          <div class="config-section">
            <h3>8️⃣ 保存模板</h3>
            <el-button @click="saveTemplate" type="warning" plain style="width: 100%">
              <el-icon><Document /></el-icon>
              保存当前配置为模板
            </el-button>
            <el-select 
              v-if="templates.length > 0" 
              v-model="selectedTemplate" 
              placeholder="选择已保存模板"
              style="width: 100%; margin-top: 8px"
              @change="loadTemplate"
            >
              <el-option v-for="template in templates" :key="template.name" :label="template.name" :value="template.name" />
            </el-select>
          </div>

          <!-- 开始处理按钮 -->
          <div class="config-section">
            <el-button 
              type="success" 
              @click="startAutoEditing"
              :disabled="!canStartProcessing"
              :loading="isProcessing"
              style="width: 100%; height: 50px; font-size: 16px"
            >
              {{ isProcessing ? '处理中...' : '开始自动混剪' }}
            </el-button>
          </div>

          <!-- 进度显示 -->
          <div v-if="isProcessing" class="progress-section">
            <el-progress 
              :percentage="processingProgress" 
              :text-inside="true" 
              :stroke-width="20"
              status="success"
            />
            <div class="progress-info">
              <span>{{ currentStep }}</span>
              <span>{{ processedCount }}/{{ totalCount }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧预览区域 -->
      <el-col :span="16">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>📊 素材预览</span>
              <el-button @click="refreshPreview" :icon="Refresh" circle size="small" />
            </div>
          </template>

          <!-- 素材统计 -->
          <div class="material-stats">
            <el-row :gutter="16">
              <el-col :span="6" v-for="(count, folder) in materialStats" :key="folder">
                <el-statistic :title="`${folder.toUpperCase()}文件夹`" :value="count" />
              </el-col>
            </el-row>
          </div>

          <!-- 文件列表 -->
          <div class="file-lists">
            <div v-for="(files, folder) in materialFiles" :key="folder" class="folder-section">
              <h4>{{ folder.toUpperCase() }}文件夹 ({{ files.length }}个文件)</h4>
              <div class="file-grid">
                <div v-for="file in files.slice(0, 6)" :key="file.path" class="file-item">
                  <video v-if="file.type === 'video'" :src="file.path" controls muted />
                  <div class="file-info">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-duration">{{ file.duration }}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 话术预览 -->
          <div v-if="scriptContent" class="script-preview">
            <h4>话术预览</h4>
            <el-collapse>
              <el-collapse-item v-for="(content, key) in scriptContent" :key="key" :title="`${key.toUpperCase()}话术`">
                <div class="script-content">{{ content }}</div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Refresh, VideoPlay, Folder, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 基础配置
const selectedAnchor = ref('');
const playbackSpeed = ref(1.0);
const bgMusicPath = ref('');
const materialPath = ref('');
const scriptPath = ref('');
const keepOriginalAudio = ref(false);
const isProcessing = ref(false);
const processingProgress = ref(0);
const currentStep = ref('');
const processedCount = ref(0);
const totalCount = ref(0);

// 主播选项
const anchorOptions = ['主播A', '主播B', '主播C', '主播D'];

// 文件夹配置
const folderConfigs = ref({
  a: { duration: 5 },
  b: { duration: 3 },
  c: { duration: 6 },
  d: { duration: 4 },
  e: { duration: 5 },
  f: { duration: 4 }
});

// 素材统计
const materialStats = ref({});
const materialFiles = ref({});
const scriptContent = ref({});
const bgMusicCount = ref(0);
const templates = ref([]);
const selectedTemplate = ref('');

// 计算属性
const canStartProcessing = computed(() => {
  return selectedAnchor.value && 
         materialPath.value && 
         scriptPath.value && 
         !isProcessing.value;
});

// 选择文件夹函数
const selectBgMusicFolder = async () => {
  const result = await window.electronAPI.selectDirectory();
  if (result) {
    bgMusicPath.value = result;
    await scanBgMusic();
  }
};

const selectMaterialFolder = async () => {
  const result = await window.electronAPI.selectDirectory();
  if (result) {
    materialPath.value = result;
    await scanMaterials();
  }
};

const selectScriptFolder = async () => {
  const result = await window.electronAPI.selectDirectory();
  if (result) {
    scriptPath.value = result;
    await scanScripts();
  }
};

// 扫描素材
const scanMaterials = async () => {
  if (!materialPath.value) return;
  
  try {
    const result = await window.electronAPI.scanMaterials({
      path: materialPath.value,
      folders: Object.keys(folderConfigs.value)
    });
    
    materialStats.value = result.stats;
    materialFiles.value = result.files;
  } catch (error) {
    ElMessage.error('扫描素材失败：' + error.message);
  }
};

const scanBgMusic = async () => {
  if (!bgMusicPath.value) return;
  
  try {
    const result = await window.electronAPI.scanBgMusic({
      path: bgMusicPath.value
    });
    
    bgMusicCount.value = result.count;
  } catch (error) {
    ElMessage.error('扫描背景音乐失败：' + error.message);
  }
};

const scanScripts = async () => {
  if (!scriptPath.value) return;
  
  try {
    const result = await window.electronAPI.scanScripts({
      path: scriptPath.value,
      folders: Object.keys(folderConfigs.value)
    });
    
    scriptContent.value = result.content;
  } catch (error) {
    ElMessage.error('扫描话术失败：' + error.message);
  }
};

// 开始自动混剪
const startAutoEditing = async () => {
  if (!canStartProcessing.value) return;
  
  isProcessing.value = true;
  processingProgress.value = 0;
  currentStep.value = '准备素材...';
  
  try {
    const config = {
      anchor: selectedAnchor.value,
      speed: playbackSpeed.value,
      bgMusic: bgMusicPath.value,
      materialPath: materialPath.value,
      scriptPath: scriptPath.value,
      keepOriginalAudio: keepOriginalAudio.value,
      folderConfigs: folderConfigs.value
    };
    
    const result = await window.electronAPI.startAutoEditing(config);
    
    if (result.success) {
      ElMessage.success('自动混剪完成！');
      ElMessage.info(`输出文件：${result.outputPath}`);
    } else {
      ElMessage.error('混剪失败：' + result.error);
    }
  } catch (error) {
    ElMessage.error('处理失败：' + error.message);
  } finally {
    isProcessing.value = false;
  }
};

const refreshPreview = () => {
  if (materialPath.value) scanMaterials();
  if (bgMusicPath.value) scanBgMusic();
  if (scriptPath.value) scanScripts();
};

const saveTemplate = () => {
  const templateName = prompt('请输入模板名称:', `模板_${new Date().toLocaleDateString()}`);
  if (!templateName) return;

  const template = {
    name: templateName,
    selectedAnchor: selectedAnchor.value,
    playbackSpeed: playbackSpeed.value,
    folderConfigs: folderConfigs.value,
    keepOriginalAudio: keepOriginalAudio.value,
    timestamp: new Date().toISOString()
  };

  const existingTemplates = JSON.parse(localStorage.getItem('autoEditorTemplates') || '[]');
  existingTemplates.unshift(template);
  
  // 最多保存10个模板
  if (existingTemplates.length > 10) {
    existingTemplates.splice(10);
  }

  localStorage.setItem('autoEditorTemplates', JSON.stringify(existingTemplates));
  templates.value = existingTemplates;
  ElMessage.success('模板保存成功！');
};

const loadTemplate = (templateName) => {
  const existingTemplates = JSON.parse(localStorage.getItem('autoEditorTemplates') || '[]');
  const template = existingTemplates.find(t => t.name === templateName);
  
  if (template) {
    selectedAnchor.value = template.selectedAnchor;
    playbackSpeed.value = template.playbackSpeed;
    folderConfigs.value = template.folderConfigs;
    keepOriginalAudio.value = template.keepOriginalAudio;
    ElMessage.success(`已加载模板: ${templateName}`);
  }
};

const setupAutoProgress = () => {
  window.electronAPI.onAutoProgress(({ progress, step }) => {
    processingProgress.value = progress;
    currentStep.value = step;
  });
};

onMounted(() => {
  setupAutoProgress();
  
  // 加载保存的模板
  const savedTemplates = JSON.parse(localStorage.getItem('autoEditorTemplates') || '[]');
  templates.value = savedTemplates;
});

onBeforeUnmount(() => {
  window.electronAPI.removeAutoProgressListener();
});
</script>

<style scoped>
.auto-editor-container {
  height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
}

.full-height {
  height: 100%;
}

.control-panel, .preview-card {
  height: calc(100vh - 40px);
}

.control-card, .preview-card {
  height: 100%;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafc;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.config-section h3 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.folder-config {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.folder-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.material-stats {
  margin-bottom: 24px;
}

.file-lists {
  max-height: 400px;
  overflow-y: auto;
}

.folder-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafc;
  border-radius: 8px;
}

.folder-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.file-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.file-item video {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.file-info {
  padding: 8px;
  background: white;
}

.file-name {
  display: block;
  font-size: 12px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-duration {
  font-size: 11px;
  color: #909399;
}

.script-preview {
  margin-top: 24px;
}

.script-content {
  padding: 12px;
  background: #f9fafc;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.progress-section {
  margin-top: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>