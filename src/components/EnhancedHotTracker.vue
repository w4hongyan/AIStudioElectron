<template>
  <div class="enhanced-hot-tracker">
    <!-- 顶部洞察摘要 -->
    <div class="insight-summary">
      <div class="summary-card trending">
        <div class="card-icon">🔥</div>
        <div class="card-content">
          <h3>今日最热</h3>
          <p>{{ topHotspot.title }}</p>
          <span class="trend-indicator">↑{{ topHotspot.growth }}%</span>
        </div>
      </div>
      
      <div class="summary-card opportunity">
        <div class="card-icon">💡</div>
        <div class="card-content">
          <h3>机会提醒</h3>
          <p>{{ opportunityInsight.text }}</p>
          <span class="time-badge">{{ opportunityInsight.time }}</span>
        </div>
      </div>
      
      <div class="summary-card timing">
        <div class="card-icon">⏰</div>
        <div class="card-content">
          <h3>最佳时机</h3>
          <p>{{ bestTiming.period }}</p>
          <span class="efficiency-badge">+{{ bestTiming.efficiency }}%效率</span>
        </div>
      </div>
    </div>

    <div class="tracker-content">
      <!-- 左侧智能筛选 -->
      <div class="smart-filter">
        <div class="filter-section">
          <h3>🎯 智能推荐</h3>
          <div class="mood-filter">
            <label>今天想发什么内容？</label>
            <div class="mood-chips">
              <div 
                v-for="mood in contentMoods" 
                :key="mood.value"
                :class="['mood-chip', { active: selectedMood === mood.value }]"
                @click="selectMood(mood.value)"
              >
                <span class="mood-emoji">{{ mood.emoji }}</span>
                <span>{{ mood.label }}</span>
              </div>
            </div>
          </div>

          <div class="platform-presets">
            <label>目标平台</label>
            <div class="preset-cards">
              <div 
                v-for="preset in platformPresets" 
                :key="preset.platform"
                :class="['preset-card', { active: activePreset === preset.platform }]"
                @click="applyPreset(preset.platform)"
              >
                <div class="preset-icon">{{ preset.icon }}</div>
                <div class="preset-info">
                  <div class="preset-name">{{ preset.name }}</div>
                  <div class="preset-desc">{{ preset.desc }}</div>
                </div>
                <div class="preset-stats">
                  <div class="engagement-rate">{{ preset.engagement }}%</div>
                  <div class="label">互动率</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <el-button type="primary" @click="generatePersonalizedFeed" :loading="isGenerating">
            <el-icon><MagicStick /></el-icon>
            为我定制热点
          </el-button>
          <el-button @click="scheduleHotspots">
            <el-icon><Clock /></el-icon>
            定时推送
          </el-button>
        </div>
      </div>

      <!-- 中间热点内容 -->
      <div class="hotspot-feed">
        <div class="feed-header">
          <div class="feed-title">
            <h3>{{ selectedMood ? contentMoods.find(m => m.value === selectedMood)?.label : '全部' }}热点</h3>
            <span class="feed-count">{{ filteredHotspots.length }}个机会</span>
          </div>
          <div class="view-controls">
            <el-segmented v-model="viewMode" :options="viewOptions" />
          </div>
        </div>

        <!-- 卡片视图 -->
        <div v-if="viewMode === 'card'" class="hotspot-cards">
          <div 
            v-for="hotspot in filteredHotspots" 
            :key="hotspot.id"
            :class="['hotspot-card', getHotspotClass(hotspot)]"
          >
            <div class="card-header">
              <div class="hotspot-rank">
                <span class="rank-number">#{{ hotspot.rank }}</span>
                <el-tag 
                  :type="getTrendType(hotspot.trend)" 
                  size="small"
                  class="trend-tag"
                >
                  {{ hotspot.trend === 'up' ? '↑' : hotspot.trend === 'down' ? '↓' : '→' }}
                  {{ Math.abs(hotspot.growth) }}%
                </el-tag>
              </div>
              <div class="hotspot-actions">
                <el-button size="small" circle @click="toggleBookmark(hotspot)">
                  <el-icon><StarFilled v-if="hotspot.bookmarked" /><Star v-else /></el-icon>
                </el-button>
              </div>
            </div>

            <div class="card-content">
              <h4 class="hotspot-title" @click="showDetail(hotspot)">{{ hotspot.title }}</h4>
              <p class="hotspot-desc">{{ hotspot.description }}</p>
              
              <div class="hotspot-metrics">
                <div class="metric">
                  <span class="metric-value">{{ formatNumber(hotspot.heat) }}</span>
                  <span class="metric-label">热度</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{{ hotspot.engagement }}%</span>
                  <span class="metric-label">互动</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{{ hotspot.potential }}%</span>
                  <span class="metric-label">潜力</span>
                </div>
              </div>

              <div class="content-suggestions">
                <div class="suggestion-title">创作建议：</div>
                <div class="suggestion-chips">
                  <el-tag 
                    v-for="suggestion in hotspot.suggestions" 
                    :key="suggestion"
                    size="small"
                    effect="plain"
                    class="suggestion-chip"
                  >
                    {{ suggestion }}
                  </el-tag>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="platform-tags">
                <el-tag 
                  v-for="platform in hotspot.platforms" 
                  :key="platform"
                  size="small"
                  :type="getPlatformType(platform)"
                >
                  {{ platform }}
                </el-tag>
              </div>
              <div class="card-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="createContent(hotspot)"
                  :icon="Edit"
                >
                  立即创作
                </el-button>
                <el-button size="small" @click="scheduleContent(hotspot)">
                  定时创作
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else class="hotspot-list">
          <div 
            v-for="hotspot in filteredHotspots" 
            :key="hotspot.id"
            :class="['hotspot-item', getHotspotClass(hotspot)]"
          >
            <div class="item-left">
              <div class="rank-badge">{{ hotspot.rank }}</div>
              <div class="trend-indicator" :class="hotspot.trend">
                <el-icon>
                  <Top v-if="hotspot.trend === 'up'" />
                  <Bottom v-else-if="hotspot.trend === 'down'" />
                  <Minus v-else />
                </el-icon>
              </div>
            </div>
            
            <div class="item-center">
              <h4 class="item-title">{{ hotspot.title }}</h4>
              <div class="item-stats">
                <span>{{ formatNumber(hotspot.heat) }}热度</span>
                <span>{{ hotspot.growth }}%增长</span>
                <span>{{ hotspot.engagement }}%互动</span>
              </div>
            </div>

            <div class="item-right">
              <el-button-group>
                <el-button size="small" @click="createContent(hotspot)">
                  创作
                </el-button>
                <el-button size="small" @click="showDetail(hotspot)">
                  详情
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧智能助手 -->
      <div class="ai-assistant">
        <div class="assistant-header">
          <div class="assistant-avatar">🤖</div>
          <div class="assistant-info">
            <h4>AI热点助手</h4>
            <p>为你发现最佳创作时机</p>
          </div>
        </div>

        <div class="assistant-insights">
          <div class="insight-item">
            <div class="insight-icon">📊</div>
            <div class="insight-content">
              <div class="insight-title">数据洞察</div>
              <div class="insight-desc">{{ currentInsights.data }}</div>
            </div>
          </div>

          <div class="insight-item">
            <div class="insight-icon">🎯</div>
            <div class="insight-content">
              <div class="insight-title">创作建议</div>
              <div class="insight-desc">{{ currentInsights.suggestion }}</div>
            </div>
          </div>

          <div class="insight-item">
            <div class="insight-icon">⏰</div>
            <div class="insight-content">
              <div class="insight-title">最佳时机</div>
              <div class="insight-desc">{{ currentInsights.timing }}</div>
            </div>
          </div>
        </div>

        <div class="assistant-actions">
          <el-button type="primary" @click="askAIAssistant" :loading="isAsking">
            询问AI助手
          </el-button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="热点详情"
      width="600px"
    >
      <div v-if="selectedHotspot" class="detail-content">
        <div class="detail-header">
          <h3>{{ selectedHotspot.title }}</h3>
          <div class="detail-meta">
            <el-tag :type="getTrendType(selectedHotspot.trend)">
              {{ selectedHotspot.trend === 'up' ? '上升' : 
                 selectedHotspot.trend === 'down' ? '下降' : '稳定' }}
            </el-tag>
            <span>热度：{{ formatNumber(selectedHotspot.heat) }}</span>
            <span>增长率：{{ selectedHotspot.growth }}%</span>
          </div>
        </div>

        <div class="detail-description">
          <h4>内容描述</h4>
          <p>{{ selectedHotspot.description }}</p>
        </div>

        <div class="detail-analysis">
          <h4>AI分析</h4>
          <div class="analysis-cards">
            <div class="analysis-card">
              <h5>受众画像</h5>
              <p>{{ selectedHotspot.audience }}</p>
            </div>
            <div class="analysis-card">
              <h5>创作角度</h5>
              <p>{{ selectedHotspot.angle }}</p>
            </div>
            <div class="analysis-card">
              <h5>注意事项</h5>
              <p>{{ selectedHotspot.cautions }}</p>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <el-button type="primary" @click="createContent(selectedHotspot)">
            立即创作
          </el-button>
          <el-button @click="bookmarkHotspot(selectedHotspot)">
            {{ selectedHotspot.bookmarked ? '取消收藏' : '收藏' }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Edit, Star, StarFilled, Clock, MagicStick, Top, Bottom, Minus } from '@element-plus/icons-vue'

// 数据状态
const selectedMood = ref('')
const activePreset = ref('all')
const viewMode = ref('card')
const isGenerating = ref(false)
const isAsking = ref(false)
const detailVisible = ref(false)
const selectedHotspot = ref(null)

const contentMoods = [
  { value: 'inspiring', label: '励志正能量', emoji: '💪' },
  { value: 'educational', label: '知识干货', emoji: '📚' },
  { value: 'entertaining', label: '轻松娱乐', emoji: '😄' },
  { value: 'trendy', label: '时尚潮流', emoji: '✨' },
  { value: 'emotional', label: '情感共鸣', emoji: '❤️' }
]

const platformPresets = [
  { platform: 'all', name: '全平台', desc: '综合热点', icon: '🌐', engagement: 8.5 },
  { platform: 'douyin', name: '抖音', desc: '短视频热点', icon: '🎵', engagement: 12.3 },
  { platform: 'xiaohongshu', name: '小红书', desc: '生活方式', icon: '📒', engagement: 15.7 },
  { platform: 'bilibili', name: 'B站', desc: '二次元文化', icon: '👾', engagement: 9.8 }
]

const viewOptions = [
  { label: '卡片视图', value: 'card' },
  { label: '列表视图', value: 'list' }
]

// 模拟热点数据
const hotspots = ref([
  {
    id: 1,
    title: 'AI绘画工具Stable Diffusion 3.0发布',
    description: '新一代AI绘画工具发布，画质提升300%，支持中文提示词',
    rank: 1,
    trend: 'up',
    growth: 245,
    heat: 158000,
    engagement: 18.5,
    potential: 92,
    platforms: ['抖音', '小红书', 'B站'],
    suggestions: ['教程制作', '对比评测', '使用技巧'],
    audience: '18-35岁设计师和AI爱好者',
    angle: '从实用角度介绍新功能',
    cautions: '避免过度夸大效果'
  },
  {
    id: 2,
    title: '年轻人开始反向消费',
    description: '从盲目跟风到理性消费，年轻人的消费观念正在改变',
    rank: 2,
    trend: 'up',
    growth: 189,
    heat: 124000,
    engagement: 22.3,
    potential: 88,
    platforms: ['小红书', '微博'],
    suggestions: ['观点分享', '个人经历', '省钱攻略'],
    audience: '18-30岁年轻消费者',
    angle: '结合个人经历谈消费观念转变',
    cautions: '避免说教，保持真实'
  },
  {
    id: 3,
    title: '多巴胺穿搭2.0版本',
    description: '从去年的多巴胺穿搭升级，更加个性化和场景化',
    rank: 3,
    trend: 'stable',
    growth: 67,
    heat: 98000,
    engagement: 15.2,
    potential: 75,
    platforms: ['小红书', '抖音'],
    suggestions: ['穿搭教程', '场景搭配', '色彩搭配'],
    audience: '16-28岁时尚爱好者',
    angle: '实用穿搭指南',
    cautions: '注意季节性和实用性'
  }
])

// 计算属性
const filteredHotspots = computed(() => {
  let filtered = hotspots.value
  
  if (selectedMood.value) {
    // 根据心情筛选相关热点
    const moodKeywords = {
      inspiring: ['成长', '励志', '正能量'],
      educational: ['教程', '知识', '干货'],
      entertaining: ['搞笑', '娱乐', '轻松'],
      trendy: ['时尚', '潮流', '新品'],
      emotional: ['情感', '故事', '共鸣']
    }
    
    const keywords = moodKeywords[selectedMood.value] || []
    filtered = filtered.filter(hotspot => 
      keywords.some(keyword => 
        hotspot.title.includes(keyword) || hotspot.description.includes(keyword)
      )
    )
  }
  
  if (activePreset.value !== 'all') {
    // 根据平台预设筛选
    filtered = filtered.filter(hotspot => 
      hotspot.platforms.includes(platformPresets.find(p => p.platform === activePreset.value)?.name)
    )
  }
  
  return filtered
})

const topHotspot = computed(() => hotspots.value[0] || {})

const opportunityInsight = computed(() => {
  const now = new Date()
  const hour = now.getHours()
  
  if (hour < 9) {
    return { text: '早高峰通勤内容机会', time: '7-9点' }
  } else if (hour < 12) {
    return { text: '上午学习工作间隙', time: '9-12点' }
  } else if (hour < 14) {
    return { text: '午休时间轻松内容', time: '12-14点' }
  } else if (hour < 18) {
    return { text: '下午工作效率内容', time: '14-18点' }
  } else {
    return { text: '晚间深度内容时间', time: '19-22点' }
  }
})

const bestTiming = computed(() => {
  const timings = [
    { period: '早晨7-9点', efficiency: 45 },
    { period: '午休12-14点', efficiency: 38 },
    { period: '晚间19-22点', efficiency: 67 }
  ]
  return timings[Math.floor(Math.random() * timings.length)]
})

const currentInsights = ref({
  data: '基于当前热点趋势，AI绘画话题持续升温',
  suggestion: '建议制作教程类内容，互动率提升35%',
  timing: '今晚8点发布效果最佳'
})

// 方法
const selectMood = (mood) => {
  selectedMood.value = selectedMood.value === mood ? '' : mood
}

const applyPreset = (preset) => {
  activePreset.value = preset
}

const generatePersonalizedFeed = async () => {
  isGenerating.value = true
  // 模拟AI生成个性化推荐
  await new Promise(resolve => setTimeout(resolve, 2000))
  isGenerating.value = false
  ElMessage.success('已为你生成个性化热点推荐')
}

const createContent = (hotspot) => {
  // 跳转到创作页面
  console.log('创建内容:', hotspot.title)
  ElMessage.success(`正在为「${hotspot.title}」生成创作建议`)
}

const scheduleContent = (hotspot) => {
  ElMessage.success(`已安排「${hotspot.title}」的定时创作`)
}

const showDetail = (hotspot) => {
  selectedHotspot.value = hotspot
  detailVisible.value = true
}

const bookmarkHotspot = (hotspot) => {
  hotspot.bookmarked = !hotspot.bookmarked
  ElMessage.success(hotspot.bookmarked ? '已收藏' : '已取消收藏')
}

const toggleBookmark = (hotspot) => {
  bookmarkHotspot(hotspot)
}

const askAIAssistant = async () => {
  isAsking.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  currentInsights.value = {
    data: '最新数据显示，AI工具类内容热度持续上升',
    suggestion: '建议制作对比评测，预计互动率提升50%',
    timing: '今晚7-9点是最佳发布窗口'
  }
  isAsking.value = false
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const getHotspotClass = (hotspot) => {
  if (hotspot.growth > 100) return 'viral'
  if (hotspot.growth > 50) return 'trending'
  if (hotspot.growth > 20) return 'rising'
  return 'stable'
}

const getTrendType = (trend) => {
  return trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'info'
}

const getPlatformType = (platform) => {
  const types = {
    '抖音': 'danger',
    '小红书': 'success',
    'B站': 'primary',
    '微博': 'warning'
  }
  return types[platform] || 'info'
}

onMounted(() => {
  // 添加一些初始数据
  hotspots.value.forEach(hotspot => {
    hotspot.bookmarked = false
  })
})
</script>

<style scoped>
.enhanced-hot-tracker {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.insight-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card.trending {
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
  color: white;
}

.summary-card.opportunity {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
}

.summary-card.timing {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.card-icon {
  font-size: 2em;
  margin-right: 15px;
}

.card-content h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.card-content p {
  margin: 0 0 5px 0;
  font-size: 14px;
  opacity: 0.9;
}

.trend-indicator, .time-badge, .efficiency-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
}

.tracker-content {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 20px;
}

.smart-filter {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.mood-filter, .platform-presets {
  margin-bottom: 20px;
}

.mood-filter label, .platform-presets label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
}

.mood-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mood-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
}

.mood-chip:hover, .mood-chip.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.preset-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-card:hover, .preset-card.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.preset-icon {
  font-size: 1.5em;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-weight: 500;
  font-size: 14px;
}

.preset-desc {
  font-size: 12px;
  color: #666;
}

.preset-stats {
  text-align: right;
}

.engagement-rate {
  font-weight: bold;
  color: #67c23a;
  font-size: 14px;
}

.label {
  font-size: 10px;
  color: #666;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hotspot-feed {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.feed-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feed-count {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
}

.hotspot-cards {
  display: grid;
  gap: 20px;
}

.hotspot-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
}

.hotspot-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.hotspot-card.viral {
  border-left: 4px solid #ff6b6b;
}

.hotspot-card.trending {
  border-left: 4px solid #ffa500;
}

.hotspot-card.rising {
  border-left: 4px solid #4ecdc4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.hotspot-rank {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-number {
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
}

.hotspot-title {
  margin: 0 0 10px 0;
  cursor: pointer;
}

.hotspot-title:hover {
  color: #409eff;
}

.hotspot-desc {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}

.hotspot-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.metric {
  text-align: center;
}

.metric-value {
  display: block;
  font-weight: bold;
  font-size: 16px;
  color: #409eff;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.content-suggestions {
  margin-bottom: 15px;
}

.suggestion-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platform-tags {
  display: flex;
  gap: 5px;
}

.ai-assistant {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.assistant-avatar {
  font-size: 2em;
}

.assistant-info h4 {
  margin: 0;
}

.assistant-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.assistant-insights {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.insight-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.insight-icon {
  font-size: 1.2em;
}

.insight-title {
  font-weight: 500;
  font-size: 14px;
}

.insight-desc {
  font-size: 12px;
  color: #666;
}

@media (max-width: 1200px) {
  .tracker-content {
    grid-template-columns: 1fr;
  }
  
  .smart-filter,
  .ai-assistant {
    order: 2;
  }
  
  .hotspot-feed {
    order: 1;
  }
}
</style>