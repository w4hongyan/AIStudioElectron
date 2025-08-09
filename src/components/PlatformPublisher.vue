<template>
  <div class="page-container">
    <h1 class="page-title">一键发布</h1>
    <p class="page-subtitle">管理您的发布内容，一键同步到多个主流自媒体平台。</p>

    <el-row :gutter="24">
      <!-- 左侧：平台选择 -->
      <el-col :span="7">
        <el-card class="control-panel">
          <template #header>
            <div class="card-header">
              <span>选择平台</span>
            </div>
          </template>
          <div class="platform-list">
            <div 
              v-for="platform in platforms" 
              :key="platform.id"
              class="platform-item"
              :class="{ active: selectedPlatforms.includes(platform.id) }"
              @click="togglePlatform(platform.id)"
            >
              <img :src="platform.logo" :alt="platform.name" class="platform-logo" />
              <div class="platform-info">
                <h4>{{ platform.name }}</h4>
                <el-tag :type="platform.connected ? 'success' : 'danger'" size="small">
                  {{ platform.connected ? '已连接' : '未连接' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：内容与发布 -->
      <el-col :span="17">
        <el-card class="result-panel">
          <template #header>
            <div class="card-header">
              <span>内容与设置</span>
            </div>
          </template>
          
          <el-tabs v-model="activeTab">
            <el-tab-pane label="发布内容" name="content">
              <el-upload
                class="upload-area"
                drag
                :auto-upload="false"
                :on-change="handleFileSelect"
                multiple
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
              </el-upload>

              <div class="selected-files" v-if="selectedFiles.length > 0">
                <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                  <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                  <el-button type="danger" :icon="Delete" circle plain @click="removeFile(index)" />
                </div>
              </div>

              <el-form :model="publishSettings" label-position="top" style="margin-top: 20px;">
                <el-form-item label="标题">
                  <el-input v-model="publishSettings.title" placeholder="请输入视频标题" />
                </el-form-item>
                <el-form-item label="描述">
                  <el-input v-model="publishSettings.description" type="textarea" :rows="4" placeholder="请输入视频描述" />
                </el-form-item>
                <el-form-item label="话题标签">
                  <el-select v-model="publishSettings.tags" multiple filterable allow-create default-first-option placeholder="输入或选择标签" style="width: 100%;" />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="发布管理" name="publish">
              <div class="publish-progress" v-if="publishTasks.length > 0">
                <div v-for="task in publishTasks" :key="task.id" class="task-item">
                  <div class="task-info">
                    <span class="platform-name">{{ task.platform }}</span>
                    <span class="file-name">{{ task.fileName }}</span>
                  </div>
                  <el-progress :percentage="task.progress" :status="task.status" style="flex-grow: 1;" />
                </div>
              </div>
              <el-button 
                type="primary" 
                size="large" 
                @click="startPublish"
                :loading="isPublishing"
                :disabled="selectedFiles.length === 0 || selectedPlatforms.length === 0"
                style="width: 100%; margin-top: 20px;"
              >
                <el-icon><UploadFilled /></el-icon>
                {{ isPublishing ? `发布中... (${publishProgress}%)` : `发布到 ${selectedPlatforms.length} 个平台` }}
              </el-button>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Delete } from '@element-plus/icons-vue'

const platforms = ref([
  { id: 'douyin', name: '抖音', logo: 'https://via.placeholder.com/40/000000/FFFFFF?text=D', connected: true },
  { id: 'bilibili', name: '哔哩哔哩', logo: 'https://via.placeholder.com/40/00A1D6/FFFFFF?text=B', connected: true },
  { id: 'xiaohongshu', name: '小红书', logo: 'https://via.placeholder.com/40/FF2442/FFFFFF?text=X', connected: false },
  { id: 'weibo', name: '微博', logo: 'https://via.placeholder.com/40/E6162D/FFFFFF?text=W', connected: true },
])

const activeTab = ref('content')
const selectedPlatforms = ref([])
const selectedFiles = ref([])
const isPublishing = ref(false)
const publishTasks = ref([])
const publishProgress = ref(0)

const publishSettings = reactive({
  title: '',
  description: '',
  tags: [],
})

const togglePlatform = (platformId) => {
  const platform = platforms.value.find(p => p.id === platformId)
  if (!platform.connected) {
    ElMessage.warning(`请先连接 ${platform.name} 平台`)
    return
  }
  const index = selectedPlatforms.value.indexOf(platformId)
  if (index > -1) {
    selectedPlatforms.value.splice(index, 1)
  } else {
    selectedPlatforms.value.push(platformId)
  }
}

const handleFileSelect = (file) => {
  selectedFiles.value.push(file.raw)
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const startPublish = async () => {
  isPublishing.value = true
  publishTasks.value = []
  publishProgress.value = 0
  activeTab.value = 'publish'

  selectedPlatforms.value.forEach(platformId => {
    selectedFiles.value.forEach(file => {
      publishTasks.value.push({
        id: `${platformId}_${file.name}`,
        platform: platforms.value.find(p => p.id === platformId).name,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      })
    })
  })

  for (const task of publishTasks.value) {
    task.status = 'uploading'
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 50))
      task.progress = i
      const totalProgress = publishTasks.value.reduce((sum, t) => sum + t.progress, 0)
      publishProgress.value = Math.round(totalProgress / publishTasks.value.length)
    }
    task.status = 'success'
  }

  isPublishing.value = false
  ElMessage.success('全部发布完成！')
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.page-subtitle {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 20px;
}
.control-panel, .result-panel {
  height: calc(100vh - 160px);
  overflow-y: auto;
}
.card-header {
  font-size: 16px;
  font-weight: 600;
}
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.platform-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.platform-item:hover {
  border-color: var(--accent-color);
}
.platform-item.active {
  border-color: var(--accent-color);
  background-color: #ecf5ff;
}
.platform-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}
.platform-info {
  flex: 1;
}
.platform-info h4 {
  margin: 0 0 5px 0;
}
.upload-area {
  margin-bottom: 20px;
}
.selected-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.publish-progress {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 15px;
}
.task-info {
  width: 150px;
}
.platform-name {
  font-weight: bold;
}
.file-name {
  font-size: 12px;
  color: #909399;
}
</style>
