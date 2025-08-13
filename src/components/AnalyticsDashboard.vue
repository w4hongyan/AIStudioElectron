<template>
  <div class="analytics-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1>📊 数据分析仪表板</h1>
      <p class="subtitle">实时监控您的内容表现和创作效率</p>
    </div>

    <!-- 关键指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <h3>{{ totalViews.toLocaleString() }}</h3>
          <p>总浏览量</p>
          <span class="trend positive">+{{ viewsGrowth }}%</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">❤️</div>
        <div class="metric-content">
          <h3>{{ totalEngagement.toLocaleString() }}</h3>
          <p>总互动量</p>
          <span class="trend positive">+{{ engagementGrowth }}%</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">🎯</div>
        <div class="metric-content">
          <h3>{{ conversionRate }}%</h3>
          <p>转化率</p>
          <span class="trend positive">+{{ conversionGrowth }}%</span>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">⚡</div>
        <div class="metric-content">
          <h3>{{ avgEfficiency }}</h3>
          <p>创作效率</p>
          <span class="trend positive">+{{ efficiencyGrowth }}%</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-container">
        <h3>📊 内容表现趋势</h3>
        <div class="chart-placeholder">
          <el-skeleton :rows="5" animated v-if="loading" />
          <div v-else class="chart-content">
            <canvas ref="performanceChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <h3>🎨 热门内容类型</h3>
        <div class="chart-placeholder">
          <el-skeleton :rows="5" animated v-if="loading" />
          <div v-else class="chart-content">
            <canvas ref="contentTypeChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时热点追踪 -->
    <div class="hotspot-section">
      <h3>🔥 实时热点追踪</h3>
      <div class="hotspot-list">
        <div v-for="(hotspot, index) in hotspots" :key="index" class="hotspot-item">
          <div class="hotspot-rank">#{{ index + 1 }}</div>
          <div class="hotspot-content">
            <h4>{{ hotspot.title }}</h4>
            <p>{{ hotspot.description }}</p>
            <div class="hotspot-stats">
              <span>热度: {{ hotspot.heat }}</span>
              <span>增长: {{ hotspot.growth }}%</span>
            </div>
          </div>
          <el-button type="primary" size="small" @click="createFromHotspot(hotspot)">
            立即创作
          </el-button>
        </div>
      </div>
    </div>

    <!-- 创作建议 -->
    <div class="suggestions-section">
      <h3>💡 智能创作建议</h3>
      <div class="suggestions-grid">
        <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-card">
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <h4>{{ suggestion.title }}</h4>
          <p>{{ suggestion.description }}</p>
          <el-button type="text" @click="applySuggestion(suggestion)">
            应用建议
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const loading = ref(true)
const totalViews = ref(125000)
const totalEngagement = ref(8750)
const conversionRate = ref(12.5)
const avgEfficiency = ref(8.7)
const viewsGrowth = ref(23)
const engagementGrowth = ref(15)
const conversionGrowth = ref(8)
const efficiencyGrowth = ref(32)

const hotspots = ref([
  {
    title: "AI绘画教程",
    description: "Midjourney和Stable Diffusion教程内容热度持续上升",
    heat: "98.5K",
    growth: "156"
  },
  {
    title: "短视频剪辑技巧",
    description: "手机剪辑APP使用教程成为热门话题",
    heat: "87.2K",
    growth: "89"
  },
  {
    title: "职场效率工具",
    description: "AI办公工具推荐内容获得大量关注",
    heat: "76.8K",
    growth: "67"
  }
])

const suggestions = ref([
  {
    icon: "⏰",
    title: "最佳发布时间",
    description: "根据您的受众分析，晚上8-10点是最佳发布时间"
  },
  {
    icon: "🏷️",
    title: "热门标签推荐",
    description: "建议添加 #AI工具 #效率提升 等热门标签"
  },
  {
    icon: "📱",
    title: "平台优化建议",
    description: "抖音平台更适合短视频，B站适合长教程"
  }
])

// 方法
const createFromHotspot = (hotspot) => {
  ElMessage.success(`正在为 "${hotspot.title}" 创建内容...`)
  // 这里可以跳转到对应的创作工具
}

const applySuggestion = (suggestion) => {
  ElMessage.success(`已应用建议: ${suggestion.title}`)
  // 这里可以实现建议的应用逻辑
}

const loadData = async () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    loading.value = false
    initCharts()
  }, 1500)
}

const initCharts = async () => {
  await nextTick()
  // 这里可以集成实际的图表库如Chart.js
  console.log('Charts initialized')
}

// 生命周期
onMounted(() => {
  loadData()
})

// 定时刷新数据 - 降低更新频率减少性能影响
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    // 模拟实时数据更新，降低频率减少性能影响
    totalViews.value += Math.floor(Math.random() * 100)
    totalEngagement.value += Math.floor(Math.random() * 10)
  }, 15000) // 从5秒改为15秒更新一次
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  font-size: 32px;
  color: var(--text-color-primary);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: var(--text-color-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: var(--card-shadow);
  transition: transform 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-icon {
  font-size: 36px;
  margin-right: 16px;
}

.metric-content h3 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--text-color-primary);
}

.metric-content p {
  margin: 0 0 8px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.trend.positive {
  background: #e6f7ff;
  color: #1890ff;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.chart-container {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--card-shadow);
}

.chart-container h3 {
  margin: 0 0 20px 0;
  color: var(--text-color-primary);
}

.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.hotspot-section {
  margin-bottom: 40px;
}

.hotspot-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-color-primary);
}

.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hotspot-item {
  display: flex;
  align-items: center;
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--card-shadow);
}

.hotspot-rank {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
  margin-right: 20px;
  min-width: 40px;
}

.hotspot-content {
  flex: 1;
}

.hotspot-content h4 {
  margin: 0 0 8px 0;
  color: var(--text-color-primary);
}

.hotspot-content p {
  margin: 0 0 12px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.hotspot-stats {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.suggestions-section {
  margin-bottom: 40px;
}

.suggestions-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-color-primary);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.suggestion-card {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--card-shadow);
  transition: transform 0.3s ease;
}

.suggestion-card:hover {
  transform: translateY(-2px);
}

.suggestion-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.suggestion-card h4 {
  margin: 0 0 12px 0;
  color: var(--text-color-primary);
}

.suggestion-card p {
  margin: 0 0 16px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .hotspot-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hotspot-rank {
    margin-bottom: 12px;
  }
}
</style>