<template>
  <div class="cache-manager">
    <el-card class="cache-card">
      <template #header>
        <div class="card-header">
          <span>🚀 性能优化中心</span>
          <div class="header-actions">
            <el-button type="primary" @click="optimizeAll" :loading="optimizing">
              <el-icon><MagicStick /></el-icon>
              一键优化
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="cache-content">
        <!-- 系统状态概览 -->
        <div class="system-overview">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Monitor /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ systemStats.cpuUsage }}%</div>
                  <div class="stat-label">CPU使用率</div>
                  <div :class="['stat-status', systemStats.cpuUsage > 80 ? 'warning' : 'normal']">
                    {{ systemStats.cpuUsage > 80 ? '偏高' : '正常' }}
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Coin /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ systemStats.memoryUsage }}%</div>
                  <div class="stat-label">内存使用</div>
                  <div :class="['stat-status', systemStats.memoryUsage > 70 ? 'warning' : 'normal']">
                    {{ systemStats.memoryUsage > 70 ? '偏高' : '正常' }}
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ formatBytes(systemStats.cacheSize) }}</div>
                  <div class="stat-label">缓存大小</div>
                  <div :class="['stat-status', systemStats.cacheSize > 500 * 1024 * 1024 ? 'warning' : 'normal']">
                    {{ systemStats.cacheSize > 500 * 1024 * 1024 ? '过大' : '正常' }}
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Lightning /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ systemStats.responseTime }}ms</div>
                  <div class="stat-label">响应时间</div>
                  <div :class="['stat-status', systemStats.responseTime > 1000 ? 'warning' : 'normal']">
                    {{ systemStats.responseTime > 1000 ? '较慢' : '正常' }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 缓存管理 -->
        <div class="cache-management">
          <h4>📦 缓存管理</h4>
          <div class="cache-types">
            <div 
              v-for="cache in cacheTypes" 
              :key="cache.type"
              class="cache-item"
            >
              <div class="cache-info">
                <div class="cache-name">
                  <el-icon :size="16"><component :is="cache.icon" /></el-icon>
                  <span>{{ cache.name }}</span>
                </div>
                <div class="cache-size">{{ formatBytes(cache.size) }}</div>
                <div class="cache-description">{{ cache.description }}</div>
              </div>
              <div class="cache-actions">
                <el-progress 
                  :percentage="cache.usage" 
                  :color="getProgressColor(cache.usage)"
                  style="width: 100px; margin-right: 12px"
                />
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="clearCache(cache.type)"
                  :loading="cache.clearing"
                >
                  清理
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据同步 -->
        <div class="data-sync">
          <h4>🔄 数据同步</h4>
          <div class="sync-status">
            <div class="sync-item">
              <div class="sync-info">
                <span class="sync-name">云端数据</span>
                <span class="sync-time">上次同步: {{ lastSyncTime }}</span>
              </div>
              <div class="sync-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="syncData"
                  :loading="syncing"
                >
                  立即同步
                </el-button>
                <el-switch 
                  v-model="autoSync" 
                  active-text="自动同步"
                  @change="toggleAutoSync"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 性能优化建议 -->
        <div class="optimization-suggestions">
          <h4>💡 优化建议</h4>
          <div class="suggestions-list">
            <div 
              v-for="suggestion in optimizationSuggestions" 
              :key="suggestion.id"
              :class="['suggestion-card', suggestion.priority]"
            >
              <div class="suggestion-icon">
                <el-icon :size="20"><component :is="getSuggestionIcon(suggestion.type)" /></el-icon>
              </div>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div class="suggestion-description">{{ suggestion.description }}</div>
                <div class="suggestion-impact">
                  <el-tag :type="suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'success'" size="small">
                    {{ suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级' }}
                  </el-tag>
                  <span class="impact-value">预计提升: {{ suggestion.improvement }}%</span>
                </div>
              </div>
              <div class="suggestion-action">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="applyOptimization(suggestion)"
                >
                  立即优化
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="history-section">
          <h4>📈 优化历史</h4>
          <div class="history-list">
            <div 
              v-for="record in optimizationHistory" 
              :key="record.id"
              class="history-item"
            >
              <div class="history-time">{{ record.time }}</div>
              <div class="history-action">{{ record.action }}</div>
              <div class="history-result">
                <el-tag :type="record.success ? 'success' : 'danger'" size="small">
                  {{ record.success ? '成功' : '失败' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Refresh, 
  MagicStick, 
  Monitor, 
  Coin, 
  Folder, 
  Lightning, 
  Delete, 
  Upload, 
  TrendCharts, 
  Clock,
  Warning,
  SuccessFilled,
  InfoFilled
} from '@element-plus/icons-vue'

const systemStats = ref({
  cpuUsage: 45,
  memoryUsage: 62,
  cacheSize: 256 * 1024 * 1024, // 256MB
  responseTime: 450
})

const cacheTypes = ref([
  {
    type: 'image',
    name: '图片缓存',
    icon: 'Picture',
    size: 128 * 1024 * 1024,
    usage: 75,
    description: 'AI生成图片和缩略图缓存',
    clearing: false
  },
  {
    type: 'video',
    name: '视频缓存',
    icon: 'VideoPlay',
    size: 64 * 1024 * 1024,
    usage: 45,
    description: '视频处理和预览缓存',
    clearing: false
  },
  {
    type: 'data',
    name: '数据缓存',
    icon: 'Document',
    size: 48 * 1024 * 1024,
    usage: 60,
    description: '热点数据和用户设置缓存',
    clearing: false
  },
  {
    type: 'ai',
    name: 'AI模型缓存',
    icon: 'Cpu',
    size: 16 * 1024 * 1024,
    usage: 80,
    description: 'AI模型和预测结果缓存',
    clearing: false
  }
])

const lastSyncTime = ref('2分钟前')
const autoSync = ref(true)
const syncing = ref(false)
const optimizing = ref(false)

const optimizationSuggestions = ref([
  {
    id: 1,
    type: 'cache',
    title: '清理图片缓存',
    description: '图片缓存占用过高，清理后可释放约100MB空间',
    priority: 'high',
    improvement: 25
  },
  {
    id: 2,
    type: 'memory',
    title: '优化内存使用',
    description: '关闭不必要的后台进程，减少内存占用',
    priority: 'medium',
    improvement: 15
  },
  {
    id: 3,
    type: 'response',
    title: '提升响应速度',
    description: '启用数据预加载，减少等待时间',
    priority: 'low',
    improvement: 10
  }
])

const optimizationHistory = ref([
  { id: 1, time: '10分钟前', action: '清理图片缓存', success: true },
  { id: 2, time: '1小时前', action: '同步云端数据', success: true },
  { id: 3, time: '3小时前', action: '优化内存使用', success: true }
])

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getProgressColor = (percentage) => {
  if (percentage > 80) return '#F56C6C'
  if (percentage > 60) return '#E6A23C'
  return '#67C23A'
}

const getSuggestionIcon = (type) => {
  const iconMap = {
    cache: 'Delete',
    memory: 'Monitor',
    response: 'Lightning'
  }
  return iconMap[type] || 'InfoFilled'
}

const clearCache = async (type) => {
  const cache = cacheTypes.value.find(c => c.type === type)
  if (cache) {
    cache.clearing = true
    
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    cache.size = 0
    cache.usage = 0
    cache.clearing = false
    
    // 更新系统状态
    systemStats.value.cacheSize = cacheTypes.value.reduce((total, c) => total + c.size, 0)
    
    ElMessage.success(`${cache.name}清理完成`)
    
    // 添加到历史记录
    optimizationHistory.value.unshift({
      id: Date.now(),
      time: '刚刚',
      action: `清理${cache.name}`,
      success: true
    })
  }
}

const syncData = async () => {
  syncing.value = true
  
  // 模拟同步过程
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  syncing.value = false
  lastSyncTime.value = '刚刚'
  
  ElMessage.success('数据同步完成')
  
  optimizationHistory.value.unshift({
    id: Date.now(),
    time: '刚刚',
    action: '同步云端数据',
    success: true
  })
}

const toggleAutoSync = (enabled) => {
  if (enabled) {
    ElMessage.success('已启用自动同步')
  } else {
    ElMessage.info('已关闭自动同步')
  }
}

const optimizeAll = async () => {
  optimizing.value = true
  
  // 模拟优化过程
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 更新系统状态
  systemStats.value = {
    cpuUsage: Math.max(20, systemStats.value.cpuUsage - 15),
    memoryUsage: Math.max(30, systemStats.value.memoryUsage - 20),
    cacheSize: Math.max(50 * 1024 * 1024, systemStats.value.cacheSize - 100 * 1024 * 1024),
    responseTime: Math.max(200, systemStats.value.responseTime - 150)
  }
  
  optimizing.value = false
  
  ElMessage.success('系统优化完成')
  
  optimizationHistory.value.unshift({
    id: Date.now(),
    time: '刚刚',
    action: '一键系统优化',
    success: true
  })
}

const applyOptimization = async (suggestion) => {
  // 根据建议类型执行相应优化
  switch (suggestion.type) {
    case 'cache':
      const imageCache = cacheTypes.value.find(c => c.type === 'image')
      if (imageCache) {
        await clearCache('image')
      }
      break
    case 'memory':
      // 模拟内存优化
      systemStats.value.memoryUsage = Math.max(30, systemStats.value.memoryUsage - 10)
      ElMessage.success('内存优化完成')
      break
    case 'response':
      // 模拟响应优化
      systemStats.value.responseTime = Math.max(200, systemStats.value.responseTime - 100)
      ElMessage.success('响应速度优化完成')
      break
  }
}

// 实时性能监控
let performanceInterval

const startPerformanceMonitoring = () => {
  performanceInterval = setInterval(() => {
    // 模拟性能波动
    systemStats.value.cpuUsage = Math.max(20, Math.min(90, systemStats.value.cpuUsage + (Math.random() - 0.5) * 5))
    systemStats.value.memoryUsage = Math.max(40, Math.min(85, systemStats.value.memoryUsage + (Math.random() - 0.5) * 3))
    systemStats.value.responseTime = Math.max(200, Math.min(800, systemStats.value.responseTime + (Math.random() - 0.5) * 50))
  }, 5000)
}

// 自动缓存清理
let autoCleanupInterval

const startAutoCleanup = () => {
  autoCleanupInterval = setInterval(() => {
    if (systemStats.value.cacheSize > 400 * 1024 * 1024) {
      // 自动清理部分缓存
      cacheTypes.value.forEach(cache => {
        if (cache.usage > 70) {
          cache.size = Math.max(0, cache.size * 0.8)
          cache.usage = Math.min(100, cache.usage * 0.8)
        }
      })
      
      systemStats.value.cacheSize = cacheTypes.value.reduce((total, c) => total + c.size, 0)
      
      optimizationHistory.value.unshift({
        id: Date.now(),
        time: '刚刚',
        action: '自动缓存清理',
        success: true
      })
    }
  }, 60000) // 每分钟检查一次
}

onMounted(() => {
  startPerformanceMonitoring()
  startAutoCleanup()
})

onUnmounted(() => {
  if (performanceInterval) clearInterval(performanceInterval)
  if (autoCleanupInterval) clearInterval(autoCleanupInterval)
})
</script>

<style scoped>
.cache-manager {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.system-overview {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f9ff;
  color: #409eff;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-status {
  font-size: 12px;
  font-weight: 500;
}

.stat-status.normal {
  color: #67C23A;
}

.stat-status.warning {
  color: #F56C6C;
}

.cache-management {
  margin-bottom: 24px;
}

.cache-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cache-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 6px;
  transition: all 0.3s;
}

.cache-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.cache-info {
  flex: 1;
}

.cache-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  margin-bottom: 4px;
}

.cache-size {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.cache-description {
  font-size: 12px;
  color: #999;
}

.cache-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-sync {
  margin-bottom: 24px;
}

.sync-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.sync-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sync-name {
  font-weight: 500;
}

.sync-time {
  font-size: 12px;
  color: #666;
}

.sync-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.optimization-suggestions {
  margin-bottom: 24px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 6px;
  transition: all 0.3s;
}

.suggestion-card.high {
  border-left: 3px solid #F56C6C;
}

.suggestion-card.medium {
  border-left: 3px solid #E6A23C;
}

.suggestion-card.low {
  border-left: 3px solid #67C23A;
}

.suggestion-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestion-icon {
  margin-top: 2px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.suggestion-description {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.suggestion-impact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.impact-value {
  font-size: 12px;
  color: #666;
}

.suggestion-action {
  margin-left: auto;
}

.history-section {
  margin-bottom: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.history-time {
  font-size: 12px;
  color: #666;
}

.history-action {
  font-size: 13px;
}

.history-result {
  font-size: 12px;
}
</style>