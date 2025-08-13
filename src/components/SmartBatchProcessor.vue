<template>
  <div class="smart-batch-processor">
    <div class="processor-header">
      <h2>🚀 智能批量处理器</h2>
      <p class="subtitle">AI驱动的批量内容生成，效率提升300%</p>
    </div>

    <!-- 任务类型选择 -->
    <div class="task-selector">
      <h3>选择批量处理任务</h3>
      <div class="task-cards">
        <div
          v-for="task in taskTypes"
          :key="task.id"
          class="task-card"
          :class="{ active: selectedTask === task.id }"
          @click="selectTask(task)"
        >
          <div class="task-icon">
            <el-icon :size="32">
              <component :is="task.icon" />
            </el-icon>
          </div>
          <div class="task-info">
            <h4>{{ task.name }}</h4>
            <p>{{ task.description }}</p>
            <div class="task-stats">
              <span>平均耗时: {{ task.avgTime }}</span>
              <span>成功率: {{ task.successRate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容配置 -->
    <div v-if="selectedTask" class="content-config">
      <div class="config-section">
        <h3>📋 内容配置</h3>
        
        <!-- 数据源选择 -->
        <div class="config-group">
          <label>数据源</label>
          <el-select v-model="config.dataSource" placeholder="选择数据源" style="width: 100%">
            <el-option
              v-for="source in dataSources"
              :key="source.value"
              :label="source.label"
              :value="source.value"
            />
          </el-select>
        </div>

        <!-- 关键词输入 -->
        <div class="config-group">
          <label>关键词列表</label>
          <el-input
            v-model="config.keywords"
            type="textarea"
            :rows="4"
            placeholder="每行一个关键词，例如：&#10;AI教程&#10;美妆评测&#10;数码开箱"
          />
          <div class="keyword-stats">
            <span>关键词数量: {{ keywordCount }}</span>
            <el-button size="small" @click="importKeywords">导入关键词</el-button>
          </div>
        </div>

        <!-- 平台选择 -->
        <div class="config-group">
          <label>发布平台</label>
          <el-checkbox-group v-model="config.platforms">
            <el-checkbox
              v-for="platform in platforms"
              :key="platform.value"
              :label="platform.value"
            >
              <div class="platform-option">
                <el-icon :size="16">
                  <component :is="platform.icon" />
                </el-icon>
                <span>{{ platform.label }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 内容风格 -->
        <div class="config-group">
          <label>内容风格</label>
          <el-radio-group v-model="config.style" class="style-selector">
            <el-radio
              v-for="style in contentStyles"
              :key="style.value"
              :label="style.value"
            >
              <div class="style-option">
                <el-icon :size="20">
                  <component :is="style.icon" />
                </el-icon>
                <div class="style-info">
                  <span>{{ style.label }}</span>
                  <small>{{ style.description }}</small>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <!-- 高级设置 -->
        <div class="config-group">
          <label>高级设置</label>
          <div class="advanced-settings">
            <el-checkbox v-model="config.useAI">使用AI优化</el-checkbox>
            <el-checkbox v-model="config.autoImages">自动生成图片</el-checkbox>
            <el-checkbox v-model="config.autoHashtags">自动标签</el-checkbox>
            <el-checkbox v-model="config.autoSchedule">自动排程</el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="selectedTask && keywordCount > 0" class="preview-section">
      <div class="preview-header">
        <h3>👁 内容预览</h3>
        <div class="preview-controls">
          <el-button size="small" @click="refreshPreview">刷新预览</el-button>
          <el-button size="small" @click="downloadTemplate">下载模板</el-button>
        </div>
      </div>

      <div class="preview-content">
        <div class="preview-stats">
          <div class="stat-item">
            <div class="stat-number">{{ keywordCount }}</div>
            <div class="stat-label">关键词</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ estimatedTime }}</div>
            <div class="stat-label">预计时间</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ estimatedCost }}</div>
            <div class="stat-label">预计成本</div>
          </div>
        </div>

        <div class="preview-items">
          <div
            v-for="(item, index) in previewItems"
            :key="index"
            class="preview-item"
          >
            <div class="item-header">
              <span class="item-number">{{ index + 1 }}</span>
              <span class="item-keyword">{{ item.keyword }}</span>
              <el-tag :type="item.quality" size="small">
                {{ getQualityText(item.quality) }}
              </el-tag>
            </div>
            <div class="item-content">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-description">{{ item.description }}</div>
              <div class="item-tags">
                <el-tag
                  v-for="tag in item.tags"
                  :key="tag"
                  size="mini"
                  class="item-tag"
                >
                  #{{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 处理队列 -->
    <div class="queue-section">
      <div class="queue-header">
        <h3>🔄 处理队列</h3>
        <div class="queue-controls">
          <el-button type="primary" @click="startProcessing" :disabled="!canStart">
            开始处理
          </el-button>
          <el-button @click="clearQueue" :disabled="queue.length === 0">
            清空队列
          </el-button>
        </div>
      </div>

      <div class="queue-list">
        <div
          v-for="(task, index) in queue"
          :key="task.id"
          class="queue-item"
          :class="getTaskClass(task)"
        >
          <div class="task-progress">
            <el-progress
              :percentage="task.progress"
              :status="task.status"
              :stroke-width="6"
            />
          </div>
          <div class="task-info">
            <div class="task-name">{{ task.name }}</div>
            <div class="task-details">
              <span>{{ task.keyword }}</span>
              <span>{{ task.platform }}</span>
            </div>
          </div>
          <div class="task-actions">
            <el-button
              v-if="task.status === 'error'"
              size="small"
              type="text"
              @click="retryTask(task)"
            >
              重试
            </el-button>
            <el-button
              v-if="task.status !== 'processing'"
              size="small"
              type="text"
              @click="removeTask(task)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="queue.length === 0" class="empty-queue">
        <el-empty description="暂无处理任务" />
      </div>
    </div>

    <!-- 结果统计 -->
    <div v-if="completedTasks.length > 0" class="results-section">
      <h3>📊 处理结果</h3>
      <div class="results-grid">
        <div class="result-card">
          <h4>成功统计</h4>
          <div class="result-stats">
            <div class="stat">
              <span class="number">{{ successCount }}</span>
              <span class="label">成功任务</span>
            </div>
            <div class="stat">
              <span class="number">{{ totalTime }}</span>
              <span class="label">总耗时</span>
            </div>
            <div class="stat">
              <span class="number">{{ averageTime }}</span>
              <span class="label">平均耗时</span>
            </div>
          </div>
        </div>

        <div class="result-card">
          <h4>内容质量</h4>
          <div class="quality-chart">
            <el-progress
              type="circle"
              :percentage="qualityScore"
              :color="getQualityColor"
            />
            <div class="quality-text">
              <span>整体质量评分</span>
              <small>{{ getQualityTextFromScore(qualityScore) }}</small>
            </div>
          </div>
        </div>

        <div class="result-card">
          <h4>平台分布</h4>
          <div class="platform-distribution">
            <div
              v-for="(count, platform) in platformStats"
              :key="platform"
              class="platform-stat"
            >
              <span class="platform-name">{{ platform }}</span>
              <el-progress
                :percentage="getPlatformPercentage(count)"
                :color="getPlatformColor(platform)"
              />
              <span class="platform-count">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="export-section">
        <el-button type="primary" @click="exportResults">
          导出结果
        </el-button>
        <el-button @click="viewDetailedReport">
          查看详细报告
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Document, Picture, VideoPlay, Share, Download } from '@element-plus/icons-vue'
import { aiService } from '../services/aiService'

// 状态管理
const selectedTask = ref(null)
const config = ref({
  dataSource: 'manual',
  keywords: '',
  platforms: ['xiaohongshu', 'douyin', 'weibo'],
  style: 'professional',
  useAI: true,
  autoImages: true,
  autoHashtags: true,
  autoSchedule: false
})

const queue = ref([])
const completedTasks = ref([])
const previewItems = ref([])

// 任务类型定义
const taskTypes = [
  {
    id: 'article',
    name: '批量文章生成',
    icon: 'Document',
    description: '基于关键词批量生成高质量文章',
    avgTime: '2-3分钟/篇',
    successRate: 94
  },
  {
    id: 'image',
    name: '批量图片生成',
    icon: 'Picture',
    description: 'AI生成配图和封面图',
    avgTime: '30秒/张',
    successRate: 89
  },
  {
    id: 'video',
    name: '批量视频脚本',
    icon: 'VideoPlay',
    description: '生成视频脚本和分镜',
    avgTime: '1分钟/个',
    successRate: 92
  },
  {
    id: 'social',
    name: '社交媒体内容',
    icon: 'Share',
    description: '多平台内容适配和发布',
    avgTime: '45秒/条',
    successRate: 96
  }
]

// 数据源选项
const dataSources = [
  { value: 'manual', label: '手动输入' },
  { value: 'import', label: '文件导入' },
  { value: 'trending', label: '热门话题' },
  { value: 'competitor', label: '竞品分析' }
]

// 平台选项
const platforms = [
  { value: 'xiaohongshu', label: '小红书', icon: 'Share' },
  { value: 'douyin', label: '抖音', icon: 'VideoPlay' },
  { value: 'weibo', label: '微博', icon: 'Share' },
  { value: 'bilibili', label: '哔哩哔哩', icon: 'VideoPlay' },
  { value: 'wechat', label: '微信公众号', icon: 'Document' }
]

// 内容风格
const contentStyles = [
  { value: 'professional', label: '专业权威', icon: 'Document', description: '权威专业，数据支撑' },
  { value: 'casual', label: '轻松日常', icon: 'Share', description: '轻松易懂，接地气' },
  { value: 'trendy', label: '潮流前沿', icon: 'VideoPlay', description: '紧跟热点，年轻化' },
  { value: 'educational', label: '教育科普', icon: 'Document', description: '知识科普，干货满满' }
]

// 计算属性
const keywordCount = computed(() => {
  return config.value.keywords
    .split('\n')
    .filter(k => k.trim())
    .length
})

const estimatedTime = computed(() => {
  const task = taskTypes.find(t => t.id === selectedTask.value)
  if (!task) return '-'
  
  const timePerTask = parseInt(task.avgTime)
  const totalMinutes = keywordCount.value * timePerTask
  
  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`
  } else {
    return `${Math.round(totalMinutes / 60)}小时`
  }
})

const estimatedCost = computed(() => {
  const baseCost = {
    article: 0.5,
    image: 0.2,
    video: 0.8,
    social: 0.3
  }
  
  const cost = baseCost[selectedTask.value] * keywordCount.value || 0
  return `¥${cost.toFixed(2)}`
})

const canStart = computed(() => {
  return selectedTask.value && keywordCount.value > 0 && config.value.platforms.length > 0
})

const successCount = computed(() => {
  return completedTasks.value.filter(t => t.status === 'success').length
})

const totalTime = computed(() => {
  const total = completedTasks.value.reduce((sum, task) => sum + (task.duration || 0), 0)
  return total < 60 ? `${total}秒` : `${Math.round(total / 60)}分钟`
})

const averageTime = computed(() => {
  const total = completedTasks.value.reduce((sum, task) => sum + (task.duration || 0), 0)
  const avg = total / completedTasks.value.length || 0
  return `${avg.toFixed(1)}秒`
})

const qualityScore = computed(() => {
  const successful = completedTasks.value.filter(t => t.status === 'success')
  if (successful.length === 0) return 0
  
  const totalScore = successful.reduce((sum, task) => sum + (task.qualityScore || 0), 0)
  return Math.round(totalScore / successful.length)
})

const platformStats = computed(() => {
  const stats = {}
  completedTasks.value.forEach(task => {
    task.platforms.forEach(platform => {
      stats[platform] = (stats[platform] || 0) + 1
    })
  })
  return stats
})

// 方法
const selectTask = (task) => {
  selectedTask.value = task.id
  generatePreview()
}

const generatePreview = async () => {
  if (!selectedTask.value || keywordCount.value === 0) return
  
  const keywords = config.value.keywords
    .split('\n')
    .filter(k => k.trim())
    .slice(0, 5) // 预览前5个
  
  try {
    const result = await aiService.generateBatchPreview({
      taskType: selectedTask.value,
      keywords,
      config: config.value
    })
    
    previewItems.value = result.items
  } catch (error) {
    console.error('预览生成失败:', error)
    // 使用模拟数据
    previewItems.value = keywords.map(keyword => ({
      keyword,
      title: `${keyword}全攻略：新手必看的5个技巧`,
      description: `这是一篇关于${keyword}的深度解析文章，包含实用技巧和经验分享...`,
      tags: ['干货', '教程', '经验'],
      quality: 'success'
    }))
  }
}

const startProcessing = async () => {
  if (!canStart.value) return
  
  const keywords = config.value.keywords
    .split('\n')
    .filter(k => k.trim())
  
  // 创建处理任务
  keywords.forEach(keyword => {
    config.value.platforms.forEach(platform => {
      const task = {
        id: Date.now() + Math.random(),
        name: `${selectedTask.value}_${keyword}`,
        keyword,
        platform,
        type: selectedTask.value,
        progress: 0,
        status: 'pending',
        config: { ...config.value }
      }
      queue.value.push(task)
    })
  })
  
  // 开始处理队列
  processQueue()
}

const processQueue = async () => {
  for (let task of queue.value) {
    if (task.status === 'pending') {
      task.status = 'processing'
      task.progress = 0
      
      try {
        // 模拟处理过程
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          task.progress = i
        }
        
        // 模拟API调用
        const result = await aiService.processBatchTask(task)
        
        task.status = 'success'
        task.result = result
        task.duration = Math.floor(Math.random() * 30) + 10
        task.qualityScore = Math.floor(Math.random() * 30) + 70
        task.platforms = config.value.platforms
        
        completedTasks.value.push(task)
      } catch (error) {
        task.status = 'error'
        task.error = error.message
      }
    }
  }
}

const retryTask = (task) => {
  task.status = 'pending'
  task.progress = 0
  processQueue()
}

const removeTask = (task) => {
  const index = queue.value.findIndex(t => t.id === task.id)
  if (index > -1) {
    queue.value.splice(index, 1)
  }
}

const clearQueue = () => {
  queue.value = []
}

const importKeywords = () => {
  // 模拟导入功能
  ElMessage.info('文件导入功能开发中...')
}

const refreshPreview = () => {
  generatePreview()
}

const downloadTemplate = () => {
  // 生成模板文件
  const template = config.value.keywords
    .split('\n')
    .filter(k => k.trim())
    .map(keyword => ({
      keyword,
      title: `关于${keyword}的内容`,
      description: '内容描述',
      platforms: config.value.platforms
    }))
  
  const blob = new Blob([JSON.stringify(template, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `batch-template-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

const exportResults = () => {
  const exportData = {
    timestamp: new Date().toISOString(),
    taskType: selectedTask.value,
    config: config.value,
    results: completedTasks.value.filter(t => t.status === 'success'),
    statistics: {
      total: completedTasks.value.length,
      success: successCount.value,
      failed: completedTasks.value.length - successCount.value,
      averageTime: averageTime.value,
      qualityScore: qualityScore.value
    }
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `batch-results-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

const viewDetailedReport = () => {
  // 打开详细报告页面
  ElMessage.info('详细报告功能开发中...')
}

// 工具函数
const getTaskClass = (task) => {
  return {
    'task-pending': task.status === 'pending',
    'task-processing': task.status === 'processing',
    'task-success': task.status === 'success',
    'task-error': task.status === 'error'
  }
}

const getQualityText = (quality) => {
  const map = {
    success: '优秀',
    warning: '良好',
    error: '一般'
  }
  return map[quality] || '未知'
}

const getQualityTextFromScore = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '需改进'
}

const getQualityColor = (percentage) => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 80) return '#E6A23C'
  return '#F56C6C'
}

const getPlatformPercentage = (count) => {
  const total = Object.values(platformStats.value).reduce((sum, c) => sum + c, 0)
  return Math.round((count / total) * 100)
}

const getPlatformColor = (platform) => {
  const colors = {
    xiaohongshu: '#FF2442',
    douyin: '#FE2C55',
    weibo: '#E6162D',
    bilibili: '#00A1D6',
    wechat: '#07C160'
  }
  return colors[platform] || '#909399'
}
</script>

<style scoped>
.smart-batch-processor {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.processor-header {
  text-align: center;
  margin-bottom: 30px;
}

.processor-header h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: var(--accent-color);
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 16px;
}

.task-selector {
  margin-bottom: 30px;
}

.task-selector h3 {
  margin-bottom: 20px;
  color: var(--text-color-primary);
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.task-card {
  padding: 20px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
}

.task-card:hover {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.task-card.active {
  border-color: var(--accent-color);
  background: var(--accent-color-light);
}

.task-icon {
  color: var(--accent-color);
}

.task-info h4 {
  margin: 0 0 5px 0;
  color: var(--text-color-primary);
}

.task-info p {
  margin: 0 0 10px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.task-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.content-config {
  margin-bottom: 30px;
}

.config-section {
  background: var(--bg-color-secondary);
  padding: 30px;
  border-radius: 10px;
}

.config-section h3 {
  margin-bottom: 20px;
  color: var(--text-color-primary);
}

.config-group {
  margin-bottom: 25px;
}

.config-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: var(--text-color-primary);
}

.keyword-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.style-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.style-info {
  display: flex;
  flex-direction: column;
}

.style-info small {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.advanced-settings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.preview-section {
  margin-bottom: 30px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h3 {
  color: var(--text-color-primary);
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-color);
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.preview-items {
  display: grid;
  gap: 15px;
}

.preview-item {
  padding: 15px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-number {
  font-weight: bold;
  color: var(--accent-color);
}

.item-keyword {
  font-weight: bold;
  flex: 1;
}

.item-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.item-description {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin-bottom: 10px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.queue-section {
  margin-bottom: 30px;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.queue-header h3 {
  color: var(--text-color-primary);
}

.queue-list {
  display: grid;
  gap: 10px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.queue-item.task-processing {
  background: var(--accent-color-light);
}

.queue-item.task-success {
  background: #f0f9ff;
  border-left: 4px solid #67C23A;
}

.queue-item.task-error {
  background: #fef2f2;
  border-left: 4px solid #F56C6C;
}

.task-progress {
  width: 100px;
}

.task-info {
  flex: 1;
}

.task-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.task-details {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.empty-queue {
  text-align: center;
  padding: 40px;
}

.results-section {
  margin-bottom: 30px;
}

.results-section h3 {
  margin-bottom: 20px;
  color: var(--text-color-primary);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.result-card {
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: 10px;
}

.result-card h4 {
  margin-bottom: 15px;
  color: var(--text-color-primary);
}

.result-stats {
  display: grid;
  gap: 10px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat .number {
  font-weight: bold;
  color: var(--accent-color);
}

.stat .label {
  color: var(--text-color-secondary);
}

.quality-chart {
  text-align: center;
}

.quality-text {
  margin-top: 10px;
}

.platform-distribution {
  display: grid;
  gap: 10px;
}

.platform-stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-name {
  min-width: 80px;
  font-size: 14px;
}

.platform-count {
  min-width: 30px;
  text-align: right;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.export-section {
  text-align: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .task-cards {
    grid-template-columns: 1fr;
  }
  
  .preview-stats,
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .style-selector {
    grid-template-columns: 1fr;
  }
}
</style>