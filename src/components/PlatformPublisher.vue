<template>
  <div class="platform-publisher">
    <div class="publisher-layout">
      <!-- 左侧平台选择 -->
      <div class="platform-panel">
        <h3>发布平台</h3>
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
              <p>{{ platform.description }}</p>
              <el-tag :type="platform.connected ? 'success' : 'danger'" size="small">
                {{ platform.connected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
            <el-switch 
              v-model="platform.enabled" 
              :disabled="!platform.connected"
              @change="togglePlatform(platform.id)"
            />
          </div>
        </div>
      </div>

      <!-- 中间内容管理 -->
      <div class="content-panel">
        <h3>发布内容</h3>
        
        <!-- 作品选择 -->
        <div class="content-section">
          <h4>选择作品</h4>
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :on-change="handleFileSelect"
            :accept="acceptFileTypes"
            multiple
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              <h3>拖拽文件到此处或点击上传</h3>
              <p>支持 MP4、MOV、AVI、MKV 等视频格式</p>
            </div>
          </el-upload>

          <div class="selected-files" v-if="selectedFiles.length > 0">
            <h5>已选择文件</h5>
            <div class="file-list">
              <div 
                v-for="(file, index) in selectedFiles" 
                :key="index"
                class="file-item"
              >
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <el-button 
                  type="text" 
                  @click="removeFile(index)"
                  :icon="Delete"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 发布设置 -->
        <div class="settings-section">
          <h4>发布设置</h4>
          <el-form :model="publishSettings" label-width="100px">
            <el-form-item label="标题">
              <el-input 
                v-model="publishSettings.title" 
                placeholder="请输入视频标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="描述">
              <el-input 
                v-model="publishSettings.description" 
                type="textarea" 
                :rows="4"
                placeholder="请输入视频描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="话题标签">
              <el-select
                v-model="publishSettings.tags"
                multiple
                filterable
                allow-create
                placeholder="输入话题标签"
                :max="10"
              >
                <el-option
                  v-for="tag in presetTags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="发布时间">
              <el-radio-group v-model="publishSettings.scheduleType">
                <el-radio label="immediate">立即发布</el-radio>
                <el-radio label="scheduled">定时发布</el-radio>
              </el-radio-group>
              <el-date-picker
                v-if="publishSettings.scheduleType === 'scheduled'"
                v-model="publishSettings.scheduleTime"
                type="datetime"
                placeholder="选择发布时间"
                :disabled-date="disabledDate"
              />
            </el-form-item>
            
            <el-form-item label="可见范围">
              <el-select v-model="publishSettings.visibility">
                <el-option label="公开" value="public" />
                <el-option label="仅粉丝" value="fans" />
                <el-option label="私密" value="private" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 右侧发布管理 -->
      <div class="publish-panel">
        <h3>发布管理</h3>
        
        <!-- 平台配置 -->
        <div class="platform-config">
          <h4>平台配置</h4>
          <div class="config-tabs">
            <el-tabs v-model="activePlatform" type="card">
              <el-tab-pane 
                v-for="platform in selectedPlatformConfigs" 
                :key="platform.id"
                :label="platform.name" 
                :name="platform.id"
              >
                <div class="platform-form">
                  <el-form :model="platform.config" label-width="80px" size="small">
                    <el-form-item 
                      v-for="field in platform.fields" 
                      :key="field.key"
                      :label="field.label"
                    >
                      <el-input 
                        v-if="field.type === 'input'"
                        v-model="platform.config[field.key]"
                        :placeholder="field.placeholder"
                      />
                      <el-select 
                        v-else-if="field.type === 'select'"
                        v-model="platform.config[field.key]"
                      >
                        <el-option 
                          v-for="option in field.options" 
                          :key="option.value" 
                          :label="option.label" 
                          :value="option.value"
                        />
                      </el-select>
                      <el-switch 
                        v-else-if="field.type === 'switch'"
                        v-model="platform.config[field.key]"
                      />
                    </el-form-item>
                  </el-form>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 发布进度 -->
        <div class="publish-progress" v-if="isPublishing">
          <h4>发布进度</h4>
          <div class="progress-list">
            <div 
              v-for="task in publishTasks" 
              :key="task.id"
              class="task-item"
            >
              <div class="task-info">
                <span class="platform-name">{{ task.platform }}</span>
                <span class="file-name">{{ task.fileName }}</span>
              </div>
              <el-progress 
                :percentage="task.progress" 
                :status="task.status"
                :stroke-width="6"
              />
              <div class="task-status">
                <el-tag :type="getStatusType(task.status)" size="small">
                  {{ getStatusText(task.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            @click="startPublish"
            :loading="isPublishing"
            :disabled="selectedFiles.length === 0 || selectedPlatforms.length === 0"
          >
            <el-icon><UploadFilled /></el-icon>
            {{ isPublishing ? '发布中...' : '开始发布' }}
          </el-button>
          
          <el-button 
            @click="saveAsTemplate"
            :disabled="isPublishing"
          >
            <el-icon><DocumentCopy /></el-icon>
            保存为模板
          </el-button>
        </div>

        <!-- 发布历史 -->
        <div class="publish-history">
          <h4>发布历史</h4>
          <el-scrollbar height="200px">
            <div 
              v-for="(record, index) in publishHistory" 
              :key="index"
              class="history-item"
            >
              <div class="history-info">
                <div class="history-title">{{ record.title }}</div>
                <div class="history-platforms">
                  <el-tag 
                    v-for="platform in record.platforms" 
                    :key="platform"
                    size="small"
                  >
                    {{ platform }}
                  </el-tag>
                </div>
                <div class="history-time">{{ record.publishTime }}</div>
              </div>
              <el-button 
                size="small" 
                type="text"
                @click="viewDetails(record)"
              >
                查看详情
              </el-button>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <!-- 平台连接对话框 -->
    <el-dialog
      v-model="connectionDialog.visible"
      :title="`连接${connectionDialog.platform.name}`"
      width="500px"
    >
      <el-form :model="connectionDialog.form" label-width="100px">
        <el-form-item label="账号">
          <el-input v-model="connectionDialog.form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input 
            v-model="connectionDialog.form.password" 
            type="password" 
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="API密钥">
          <el-input 
            v-model="connectionDialog.form.apiKey" 
            placeholder="请输入API密钥"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="connectionDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmConnection">确认连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { UploadFilled, Delete, DocumentCopy } from '@element-plus/icons-vue'

// 平台数据
const platforms = ref([
  {
    id: 'douyin',
    name: '抖音',
    description: '字节跳动旗下短视频平台',
    logo: '/logos/douyin.png',
    connected: false,
    enabled: false,
    fields: [
      { key: 'category', label: '分类', type: 'select', options: [
        { label: '生活', value: 'life' },
        { label: '教育', value: 'education' },
        { label: '娱乐', value: 'entertainment' }
      ]},
      { key: 'syncToToutiao', label: '同步头条', type: 'switch' }
    ]
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    description: '年轻人聚集的视频社区',
    logo: '/logos/bilibili.png',
    connected: false,
    enabled: false,
    fields: [
      { key: 'category', label: '分区', type: 'select', options: [
        { label: '生活', value: 'life' },
        { label: '知识', value: 'knowledge' },
        { label: '数码', value: 'digital' }
      ]},
      { key: 'tags', label: '标签', type: 'input', placeholder: '多个标签用逗号分隔' }
    ]
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    description: '生活方式分享平台',
    logo: '/logos/xiaohongshu.png',
    connected: false,
    enabled: false,
    fields: [
      { key: 'topic', label: '话题', type: 'input', placeholder: '#话题名称' },
      { key: 'location', label: '位置', type: 'input', placeholder: '添加位置信息' }
    ]
  },
  {
    id: 'weibo',
    name: '微博',
    description: '社交媒体平台',
    logo: '/logos/weibo.png',
    connected: false,
    enabled: false,
    fields: [
      { key: 'syncToStory', label: '同步故事', type: 'switch' },
      { key: 'allowComment', label: '允许评论', type: 'switch' }
    ]
  }
])

// 状态管理
const selectedPlatforms = ref([])
const selectedFiles = ref([])
const activePlatform = ref('')
const isPublishing = ref(false)
const publishTasks = ref([])
const publishHistory = ref([])

const publishSettings = reactive({
  title: '',
  description: '',
  tags: [],
  scheduleType: 'immediate',
  scheduleTime: null,
  visibility: 'public'
})

const connectionDialog = reactive({
  visible: false,
  platform: {},
  form: {
    username: '',
    password: '',
    apiKey: ''
  }
})

// 预设标签
const presetTags = ref([
  '生活分享', '知识科普', '技术教程', '创意内容', '日常记录',
  '美食探店', '旅行日记', '学习笔记', '工作日常', '娱乐搞笑'
])

// 计算属性
const selectedPlatformConfigs = computed(() => {
  return platforms.value.filter(p => selectedPlatforms.value.includes(p.id))
})

const acceptFileTypes = '.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv'

// 方法
const togglePlatform = (platformId) => {
  const platform = platforms.value.find(p => p.id === platformId)
  if (!platform.connected) {
    connectionDialog.visible = true
    connectionDialog.platform = platform
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const disabledDate = (date) => {
  return date < new Date()
}

const startPublish = async () => {
  if (selectedFiles.value.length === 0 || selectedPlatforms.value.length === 0) {
    ElMessage.warning('请选择文件和发布平台')
    return
  }

  isPublishing.value = true
  publishTasks.value = []

  // 创建发布任务
  selectedFiles.value.forEach(file => {
    selectedPlatforms.value.forEach(platformId => {
      publishTasks.value.push({
        id: `${platformId}_${file.name}_${Date.now()}`,
        platform: platforms.value.find(p => p.id === platformId).name,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      })
    })
  })

  // 模拟发布过程
  for (let task of publishTasks.value) {
    task.status = 'uploading'
    
    // 模拟上传进度
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      task.progress = progress
    }
    
    task.status = 'processing'
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    task.status = 'success'
    task.progress = 100
  }

  // 添加到历史记录
  publishHistory.value.unshift({
    title: publishSettings.title || selectedFiles.value[0].name,
    platforms: selectedPlatforms.value.map(id => 
      platforms.value.find(p => p.id === id).name
    ),
    publishTime: new Date().toLocaleString(),
    files: selectedFiles.value.map(f => f.name)
  })

  isPublishing.value = false
  ElMessage.success('发布完成！')
  
  // 清空选择
  selectedFiles.value = []
  selectedPlatforms.value = []
}

const saveAsTemplate = () => {
  const template = {
    name: `模板_${new Date().toLocaleString()}`,
    settings: { ...publishSettings },
    platforms: [...selectedPlatforms.value]
  }
  localStorage.setItem('publishTemplate', JSON.stringify(template))
  ElMessage.success('模板保存成功！')
}

const confirmConnection = () => {
  const platform = platforms.value.find(p => p.id === connectionDialog.platform.id)
  platform.connected = true
  connectionDialog.visible = false
  ElMessage.success(`${platform.name}连接成功！`)
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    uploading: 'primary',
    processing: 'warning',
    success: 'success',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '等待中',
    uploading: '上传中',
    processing: '处理中',
    success: '成功',
    error: '失败'
  }
  return texts[status] || '未知'
}

const viewDetails = (record) => {
  ElMessage.info(`查看详情功能开发中...`)
}

onMounted(() => {
  // 加载历史记录
  const savedHistory = localStorage.getItem('publishHistory')
  if (savedHistory) {
    publishHistory.value = JSON.parse(savedHistory)
  }
})
</script>

<style scoped>
.platform-publisher {
  height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.publisher-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.platform-panel,
.content-panel,
.publish-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.platform-panel {
  width: 300px;
}

.content-panel {
  flex: 1;
  min-width: 400px;
}

.publish-panel {
  width: 350px;
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
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.platform-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 159, 255, 0.2);
}

.platform-item.active {
  border-color: #409eff;
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
  font-size: 16px;
}

.platform-info p {
  margin: 0 0 5px 0;
  font-size: 12px;
  color: #666;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
}

.upload-text h3 {
  margin: 10px 0 5px 0;
  color: #333;
}

.upload-text p {
  margin: 0;
  color: #666;
}

.selected-files {
  margin-bottom: 20px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: bold;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.settings-section {
  margin-bottom: 20px;
}

.config-tabs {
  margin-bottom: 20px;
}

.platform-form {
  padding: 10px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.platform-name {
  font-weight: bold;
  color: #333;
}

.file-name {
  font-size: 12px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.publish-history {
  margin-top: 20px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
}

.history-info {
  flex: 1;
}

.history-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.history-platforms {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}

.history-time {
  font-size: 12px;
  color: #666;
}
</style>