<template>
  <div class="hot-predictor">
    <div class="predictor-header">
      <h2>🔥 AI热点预测器</h2>
      <p class="subtitle">基于AI算法预测未来7天热点趋势，提前布局内容</p>
    </div>

    <!-- 关键词输入 -->
    <div class="input-section">
      <el-input
        v-model="keywords"
        placeholder="输入您的内容主题关键词，如：AI教程、美妆评测..."
        class="keyword-input"
        @keyup.enter="predictHotTopics"
      >
        <template #prepend>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button type="primary" @click="predictHotTopics" :loading="isPredicting">
            预测热点
          </el-button>
        </template>
      </el-input>

      <div class="quick-keywords">
        <el-tag
          v-for="tag in quickKeywords"
          :key="tag"
          class="keyword-tag"
          @click="keywords = tag"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 预测结果 -->
    <div v-if="predictionResult" class="prediction-results">
      <!-- 置信度指标 -->
      <div class="confidence-indicator">
        <el-progress
          type="circle"
          :percentage="predictionResult.confidence"
          :color="getConfidenceColor"
          :width="80"
        />
        <div class="confidence-text">
          <span>预测置信度</span>
          <small>{{ getConfidenceText }}</small>
        </div>
      </div>

      <!-- 7天趋势图 -->
      <div class="trend-chart">
        <h3>📈 7天热点趋势预测</h3>
        <div class="chart-container">
          <div
            v-for="(day, index) in predictionResult.data"
            :key="index"
            class="day-trend"
            :class="getTrendClass(day)"
          >
            <div class="day-info">
              <div class="day-name">{{ formatDay(day.date) }}</div>
              <div class="trend-score" :style="{ height: day.score + '%' }">
                <span class="score-value">{{ Math.round(day.score) }}</span>
              </div>
            </div>
            <div class="day-details">
              <div class="volume">👁 {{ formatNumber(day.volume) }} 浏览</div>
              <div class="platforms">
                <el-tag
                  v-for="platform in day.platforms"
                  :key="platform"
                  size="small"
                  class="platform-tag"
                >
                  {{ platform }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最佳发布时机 -->
      <div class="optimal-timing">
        <h3>🎯 最佳发布时机</h3>
        <div class="timing-cards">
          <div class="timing-card best">
            <div class="timing-header">
              <el-icon><StarFilled /></el-icon>
              <span>黄金时段</span>
            </div>
            <div class="timing-content">
              <div class="day">{{ getBestDay().day }}</div>
              <div class="time">{{ getBestDay().time }}</div>
              <div class="score">热度: {{ getBestDay().score }}分</div>
            </div>
          </div>

          <div class="timing-card good">
            <div class="timing-header">
              <el-icon><Sunny /></el-icon>
              <span>推荐时段</span>
            </div>
            <div class="timing-content">
              <div class="day">{{ getGoodDay().day }}</div>
              <div class="time">{{ getGoodDay().time }}</div>
              <div class="score">热度: {{ getGoodDay().score }}分</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容建议 -->
      <div class="content-suggestions">
        <h3>💡 AI内容建议</h3>
        <div class="suggestions-grid">
          <div class="suggestion-card">
            <h4>标题建议</h4>
            <el-tag
              v-for="title in getTitleSuggestions()"
              :key="title"
              class="title-suggestion"
              closable
              @close="removeTitle(title)"
            >
              {{ title }}
            </el-tag>
            <el-button size="small" @click="generateMoreTitles">
              生成更多
            </el-button>
          </div>

          <div class="suggestion-card">
            <h4>标签建议</h4>
            <div class="tags-container">
              <el-tag
                v-for="tag in getTagSuggestions()"
                :key="tag"
                class="tag-suggestion"
                effect="light"
              >
                #{{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 竞品分析 -->
      <div class="competitor-analysis">
        <h3>🕵️ 竞品分析</h3>
        <el-alert
          title="基于当前关键词的竞品内容分析"
          type="info"
          :closable="false"
          class="analysis-alert"
        />
        <div class="competitor-stats">
          <div class="stat-item">
            <div class="stat-number">{{ competitorStats.totalContent }}</div>
            <div class="stat-label">相关内容数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ competitorStats.avgEngagement }}</div>
            <div class="stat-label">平均互动</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ competitorStats.topCreatorCount }}</div>
            <div class="stat-label">头部创作者</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="isPredicting" class="loading-state">
      <el-skeleton :rows="5" animated />
      <div class="loading-text">
        <el-icon class="loading-icon"><Loading /></el-icon>
        AI正在分析全网数据，预测热点趋势...
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="输入关键词开始热点预测" />
    </div>

    <!-- 历史记录 -->
    <div class="history-section" v-if="history.length > 0">
      <h3>🕐 历史预测</h3>
      <div class="history-list">
        <div
          v-for="item in history.slice(0, 5)"
          :key="item.id"
          class="history-item"
          @click="restoreHistory(item)"
        >
          <div class="history-keywords">{{ item.keywords }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          <div class="history-score">{{ item.maxScore }}分</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, StarFilled, Sunny, Loading } from '@element-plus/icons-vue'
import { aiService } from '../services/aiService'

// 状态管理
const keywords = ref('')
const isPredicting = ref(false)
const predictionResult = ref(null)
const history = ref([])

// 快速关键词
const quickKeywords = [
  'AI教程',
  '美妆评测',
  '数码开箱',
  '美食探店',
  '旅行攻略',
  '健身打卡',
  '职场干货',
  '情感故事'
]

// 竞品模拟数据
const competitorStats = ref({
  totalContent: 1284,
  avgEngagement: '2.3k',
  topCreatorCount: 45
})

// 方法
const predictHotTopics = async () => {
  if (!keywords.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  
  isPredicting.value = true
  
  try {
    const result = await aiService.predictHotTopics(keywords.value.trim())
    
    if (result.success) {
      predictionResult.value = result
      
      // 添加到历史记录
      history.value.unshift({
        id: Date.now(),
        keywords: keywords.value,
        timestamp: Date.now(),
        maxScore: Math.max(...result.data.map(d => d.score)),
        data: result.data
      })
      
      // 限制历史记录数量
      if (history.value.length > 10) {
        history.value = history.value.slice(0, 10)
      }
      
      // 更新竞品数据（模拟）
      updateCompetitorStats()
    } else {
      ElMessage.error('预测失败: ' + result.error)
    }
  } catch (error) {
    console.error('热点预测错误:', error)
    ElMessage.error('预测服务暂时不可用')
  } finally {
    isPredicting.value = false
  }
}

const updateCompetitorStats = () => {
  // 模拟基于关键词的竞品数据更新
  const baseStats = {
    'AI教程': { total: 892, engagement: '5.2k', creators: 23 },
    '美妆评测': { total: 2156, engagement: '3.8k', creators: 67 },
    '数码开箱': { total: 1284, engagement: '2.3k', creators: 45 },
    '美食探店': { total: 3421, engagement: '4.1k', creators: 89 }
  }
  
  const keyword = keywords.value.toLowerCase()
  const stats = Object.keys(baseStats).find(k => keyword.includes(k.toLowerCase()))
  
  if (stats) {
    competitorStats.value = {
      totalContent: baseStats[stats].total,
      avgEngagement: baseStats[stats].engagement,
      topCreatorCount: baseStats[stats].creators
    }
  }
}

// 格式化函数
const formatDay = (date) => {
  const day = new Date(date)
  const today = new Date()
  const diffTime = day - today
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const days = ['今天', '明天', '后天', '大后天', '周五', '周六', '周日']
  return days[diffDays] || day.toLocaleDateString('zh-CN', { weekday: 'short' })
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 样式计算
const getConfidenceColor = computed(() => {
  const confidence = predictionResult.value?.confidence || 0
  if (confidence >= 80) return '#67C23A'
  if (confidence >= 60) return '#E6A23C'
  return '#F56C6C'
})

const getConfidenceText = computed(() => {
  const confidence = predictionResult.value?.confidence || 0
  if (confidence >= 80) return '高置信度'
  if (confidence >= 60) return '中等置信度'
  return '低置信度'
})

const getTrendClass = (day) => {
  return {
    'trend-up': day.trend === 'up',
    'trend-down': day.trend === 'down',
    'trend-stable': day.trend === 'stable'
  }
}

// 建议生成
const getTitleSuggestions = () => {
  const keyword = keywords.value
  return [
    `${keyword}全攻略：新手必看的5个技巧`,
    `2024最新${keyword}评测：值不值得买？`,
    `实测${keyword}效果：真实体验分享`,
    `${keyword}避坑指南：这些雷区千万别踩`
  ]
}

const getTagSuggestions = () => {
  const keyword = keywords.value
  const baseTags = {
    'AI教程': ['AI', '教程', '技术', '学习', '工具'],
    '美妆评测': ['美妆', '评测', '种草', '护肤', '化妆'],
    '数码开箱': ['数码', '开箱', '评测', '科技', '新品']
  }
  
  const tags = Object.keys(baseTags).find(k => keyword.includes(k))
  return baseTags[tags] || ['热门', '推荐', '干货', '实用']
}

// 最佳时机计算
const getBestDay = () => {
  if (!predictionResult.value?.data) return { day: '-', time: '-', score: 0 }
  
  const best = predictionResult.value.data.reduce((max, day) => 
    day.score > max.score ? day : max
  )
  
  return {
    day: formatDay(best.date),
    time: '19:00-21:00',
    score: Math.round(best.score)
  }
}

const getGoodDay = () => {
  if (!predictionResult.value?.data) return { day: '-', time: '-', score: 0 }
  
  const sorted = [...predictionResult.value.data].sort((a, b) => b.score - a.score)
  const good = sorted[1] || sorted[0]
  
  return {
    day: formatDay(good.date),
    time: '14:00-16:00',
    score: Math.round(good.score)
  }
}

const restoreHistory = (item) => {
  keywords.value = item.keywords
  predictionResult.value = { data: item.data, confidence: 85 }
}

const removeTitle = (title) => {
  // 可以在这里实现标题管理
}

const generateMoreTitles = () => {
  // 可以在这里实现更多标题生成
  ElMessage.info('正在生成更多标题建议...')
}
</script>

<style scoped>
.hot-predictor {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.predictor-header {
  text-align: center;
  margin-bottom: 30px;
}

.predictor-header h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: var(--accent-color);
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 16px;
}

.input-section {
  margin-bottom: 30px;
}

.keyword-input {
  margin-bottom: 15px;
}

.quick-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword-tag {
  cursor: pointer;
  transition: all 0.3s ease;
}

.keyword-tag:hover {
  transform: scale(1.05);
}

.prediction-results {
  display: grid;
  gap: 30px;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: 10px;
}

.confidence-text {
  margin-top: 10px;
  text-align: center;
}

.trend-chart h3 {
  margin-bottom: 20px;
  color: var(--text-color-primary);
}

.chart-container {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 10px 0;
}

.day-trend {
  flex: 1;
  min-width: 120px;
  padding: 15px;
  background: var(--bg-color-secondary);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.day-trend:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.day-name {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.trend-score {
  background: var(--accent-color);
  border-radius: 5px;
  margin: 10px 0;
  display: flex;
  align-items: end;
  justify-content: center;
  min-height: 100px;
  transition: all 0.3s ease;
}

.score-value {
  color: white;
  font-weight: bold;
  font-size: 18px;
}

.trend-up .trend-score {
  background: linear-gradient(to top, #67C23A, #95D475);
}

.trend-down .trend-score {
  background: linear-gradient(to top, #F56C6C, #fab6b6);
}

.trend-stable .trend-score {
  background: linear-gradient(to top, #909399, #c8c9cc);
}

.day-details {
  margin-top: 10px;
}

.volume {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 5px;
}

.platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.optimal-timing {
  margin: 30px 0;
}

.optimal-timing h3 {
  margin-bottom: 20px;
}

.timing-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.timing-card {
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
}

.timing-card.best {
  background: linear-gradient(135deg, #67C23A, #95D475);
  color: white;
}

.timing-card.good {
  background: linear-gradient(135deg, #E6A23C, #eebe77);
  color: white;
}

.timing-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 15px;
}

.content-suggestions {
  margin: 30px 0;
}

.content-suggestions h3 {
  margin-bottom: 20px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.suggestion-card {
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: 10px;
}

.suggestion-card h4 {
  margin-bottom: 15px;
  color: var(--text-color-primary);
}

.title-suggestion {
  margin: 5px;
  max-width: 100%;
  white-space: normal;
  height: auto;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-suggestion {
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag-suggestion:hover {
  transform: scale(1.05);
}

.competitor-analysis {
  margin: 30px 0;
}

.competitor-analysis h3 {
  margin-bottom: 20px;
}

.analysis-alert {
  margin-bottom: 20px;
}

.competitor-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
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
  margin-top: 5px;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.loading-text {
  margin-top: 20px;
  color: var(--text-color-secondary);
}

.loading-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.history-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid var(--border-color);
}

.history-section h3 {
  margin-bottom: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: var(--bg-color-hover);
}

.history-keywords {
  font-weight: bold;
}

.history-time {
  color: var(--text-color-secondary);
  font-size: 14px;
}

.history-score {
  color: var(--accent-color);
  font-weight: bold;
}

@media (max-width: 768px) {
  .timing-cards,
  .suggestions-grid,
  .competitor-stats {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    flex-direction: column;
  }
  
  .day-trend {
    min-width: auto;
  }
}
</style>