<template>
  <div class="smart-recommendations">
    <el-card class="recommendation-card">
      <template #header>
        <div class="card-header">
          <span>🎯 智能推荐中心</span>
          <el-button type="text" @click="refreshRecommendations">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="recommendation-content">
        <!-- 今日热点推荐 -->
        <div class="recommendation-section">
          <h4>🔥 今日热点推荐</h4>
          <div class="hot-topics">
            <el-tag
              v-for="topic in hotTopics"
              :key="topic.id"
              :type="topic.trend === 'up' ? 'success' : topic.trend === 'down' ? 'danger' : 'info'"
              effect="light"
              class="topic-tag"
              @click="selectTopic(topic)"
            >
              {{ topic.title }}
              <el-icon v-if="topic.trend === 'up'" style="margin-left: 4px"><CaretTop /></el-icon>
              <el-icon v-if="topic.trend === 'down'" style="margin-left: 4px"><CaretBottom /></el-icon>
            </el-tag>
          </div>
        </div>

        <!-- 最佳发布时间 -->
        <div class="recommendation-section">
          <h4>⏰ 最佳发布时间</h4>
          <div class="time-slots">
            <div 
              v-for="slot in bestTimes" 
              :key="slot.time"
              :class="['time-slot', { 'optimal': slot.score > 80 }]"
            >
              <div class="time">{{ slot.time }}</div>
              <div class="score">
                <el-progress 
                  :percentage="slot.score" 
                  :color="slot.score > 80 ? '#67C23A' : slot.score > 60 ? '#E6A23C' : '#F56C6C'"
                  :show-text="false"
                  style="width: 60px"
                />
                <span class="score-text">{{ slot.score }}%</span>
              </div>
              <div class="reason">{{ slot.reason }}</div>
            </div>
          </div>
        </div>

        <!-- 智能标签推荐 -->
        <div class="recommendation-section">
          <h4>🏷️ 智能标签推荐</h4>
          <div class="tag-recommendations">
            <div class="tag-category">
              <span class="category-name">热门标签：</span>
              <div class="tags">
                <el-tag
                  v-for="tag in recommendedTags.hot"
                  :key="tag.name"
                  :type="tag.type"
                  effect="plain"
                  closable
                  @close="dismissTag(tag)"
                  @click="addTag(tag)"
                >
                  {{ tag.name }}
                  <span class="tag-score">{{ tag.score }}%</span>
                </el-tag>
              </div>
            </div>
            <div class="tag-category">
              <span class="category-name">长尾标签：</span>
              <div class="tags">
                <el-tag
                  v-for="tag in recommendedTags.longtail"
                  :key="tag.name"
                  type="info"
                  effect="plain"
                  closable
                  @close="dismissTag(tag)"
                  @click="addTag(tag)"
                >
                  {{ tag.name }}
                  <span class="tag-score">{{ tag.score }}%</span>
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 内容优化建议 -->
        <div class="recommendation-section">
          <h4>💡 内容优化建议</h4>
          <div class="optimization-suggestions">
            <div 
              v-for="suggestion in optimizationSuggestions" 
              :key="suggestion.id"
              class="suggestion-item"
            >
              <div class="suggestion-icon">
                <el-icon :style="{ color: suggestion.impact === 'high' ? '#F56C6C' : suggestion.impact === 'medium' ? '#E6A23C' : '#67C23A' }">
                  <component :is="getSuggestionIcon(suggestion.type)" />
                </el-icon>
              </div>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div class="suggestion-description">{{ suggestion.description }}</div>
                <div class="suggestion-impact">
                  <el-tag :type="suggestion.impact === 'high' ? 'danger' : suggestion.impact === 'medium' ? 'warning' : 'success'" size="small">
                    {{ suggestion.impact === 'high' ? '高影响' : suggestion.impact === 'medium' ? '中影响' : '低影响' }}
                  </el-tag>
                </div>
              </div>
              <div class="suggestion-action">
                <el-button type="primary" size="small" @click="applySuggestion(suggestion)">
                  应用
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 竞品分析 -->
        <div class="recommendation-section">
          <h4>📊 竞品分析洞察</h4>
          <div class="competitor-insights">
            <div class="insight-card">
              <div class="insight-header">
                <span>同类创作者表现</span>
                <el-tag type="success">优于平均</el-tag>
              </div>
              <div class="insight-metrics">
                <div class="metric">
                  <span class="metric-label">平均播放量</span>
                  <span class="metric-value">12.5万</span>
                  <span class="metric-change positive">+23%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">互动率</span>
                  <span class="metric-value">8.7%</span>
                  <span class="metric-change positive">+15%</span>
                </div>
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
import { Refresh, CaretTop, CaretBottom, TrendCharts, Timer, CollectionTag, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import aiService from '../services/aiService'

const hotTopics = ref([
  { id: 1, title: 'AI绘画工具对比', trend: 'up', engagement: 95 },
  { id: 2, title: '春节档电影推荐', trend: 'up', engagement: 88 },
  { id: 3, title: '00后职场现状', trend: 'stable', engagement: 82 },
  { id: 4, title: '冬季护肤攻略', trend: 'down', engagement: 75 }
])

const bestTimes = ref([
  { time: '19:00-20:00', score: 92, reason: '用户下班高峰，活跃度最高' },
  { time: '12:00-13:00', score: 78, reason: '午休时间，碎片化浏览' },
  { time: '21:00-22:00', score: 85, reason: '晚间黄金时段，深度阅读' },
  { time: '09:00-10:00', score: 65, reason: '上班时间，轻度浏览' }
])

const recommendedTags = ref({
  hot: [
    { name: '#AI工具', type: 'success', score: 95 },
    { name: '#教程', type: 'primary', score: 88 },
    { name: '#效率提升', type: 'warning', score: 82 },
    { name: '#实用技巧', type: 'info', score: 78 }
  ],
  longtail: [
    { name: '#自媒体工具', type: 'info', score: 72 },
    { name: '#内容创作', type: 'info', score: 68 },
    { name: '#运营技巧', type: 'info', score: 65 },
    { name: '#干货分享', type: 'info', score: 62 }
  ]
})

const optimizationSuggestions = ref([
  {
    id: 1,
    type: 'title',
    title: '标题优化建议',
    description: '在标题中加入数字和情感词，提升点击率15-25%',
    impact: 'high',
    action: 'optimize-title'
  },
  {
    id: 2,
    type: 'timing',
    title: '发布时间调整',
    description: '将发布时间调整到晚上7-8点，预计提升30%曝光',
    impact: 'medium',
    action: 'adjust-timing'
  },
  {
    id: 3,
    type: 'tags',
    title: '标签组合优化',
    description: '增加2-3个长尾标签，提升搜索流量20%',
    impact: 'medium',
    action: 'optimize-tags'
  }
])

const getSuggestionIcon = (type) => {
  const iconMap = {
    title: CollectionTag,
    timing: Timer,
    tags: CollectionTag,
    content: MagicStick
  }
  return iconMap[type] || MagicStick
}

const refreshRecommendations = async () => {
  try {
    // 构建用户画像
    const userProfile = {
      interests: ['AI技术', '内容创作', '社交媒体'],
      platforms: ['小红书', '抖音', 'B站'],
      contentTypes: ['教程', '分析', '推荐'],
      engagement_history: {
        avg_views: 12500,
        avg_likes: 850,
        best_time: '19:00-21:00'
      }
    }

    // 调用AI推荐服务
    const result = await aiService.getSmartRecommendations(userProfile, 'mixed')
    
    if (result.success && result.data) {
      // 更新热点话题
      if (result.data.topics) {
        hotTopics.value = result.data.topics.map((topic, index) => ({
          id: index + 1,
          title: topic,
          trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
          engagement: Math.floor(Math.random() * 30) + 70
        }))
      }
      
      // 更新推荐标签
      if (result.data.styles) {
        const tagTypes = ['success', 'primary', 'warning', 'info']
        recommendedTags.value.hot = result.data.styles.slice(0, 4).map((style, index) => ({
          name: `#${style}`,
          type: tagTypes[index % tagTypes.length],
          score: Math.floor(Math.random() * 25) + 75
        }))
      }
      
      // 更新最佳发布时间
      if (result.data.timing) {
        bestTimes.value = result.data.timing.map(time => ({
          time,
          score: Math.floor(Math.random() * 30) + 70,
          reason: getTimeReason(time)
        }))
      }
      
      ElMessage.success(`推荐已更新 (${result.source === 'ai_powered' ? 'AI智能' : '规则'})`)
    } else {
      // 降级到模拟数据
      loadMockRecommendations()
      ElMessage.warning('使用模拟推荐数据')
    }
  } catch (error) {
    console.error('获取推荐失败:', error)
    loadMockRecommendations()
    ElMessage.error('推荐更新失败，使用默认数据')
  }
}

// 获取时间段说明
const getTimeReason = (timeSlot) => {
  const reasons = {
    '09:00-11:00': '上班时间，轻度浏览',
    '12:00-13:00': '午休时间，碎片化浏览',
    '14:00-16:00': '下午时段，工作间隙',
    '19:00-21:00': '晚间黄金时段，深度阅读',
    '21:00-22:00': '睡前时光，放松浏览'
  }
  return reasons[timeSlot] || '用户活跃时段'
}

// 加载模拟推荐数据（降级方案）
const loadMockRecommendations = () => {
  const topics = [
    { id: 1, title: 'AI绘画工具对比', trend: 'up', engagement: 95 },
    { id: 2, title: '春节档电影推荐', trend: 'up', engagement: 88 },
    { id: 3, title: '00后职场现状', trend: 'stable', engagement: 82 },
    { id: 4, title: '冬季护肤攻略', trend: 'down', engagement: 75 },
    { id: 5, title: '年终总结模板', trend: 'up', engagement: 91 },
    { id: 6, title: '新年计划制定', trend: 'up', engagement: 87 }
  ]
  
  hotTopics.value = topics.sort(() => Math.random() - 0.5).slice(0, 4)
}

const selectTopic = (topic) => {
  // 触发选择话题事件
  console.log('选择话题:', topic.title)
}

const addTag = (tag) => {
  // 触发添加标签事件
  console.log('添加标签:', tag.name)
}

const dismissTag = (tag) => {
  // 移除标签
  const allTags = [...recommendedTags.value.hot, ...recommendedTags.value.longtail]
  const index = allTags.findIndex(t => t.name === tag.name)
  if (index > -1) {
    if (index < recommendedTags.value.hot.length) {
      recommendedTags.value.hot.splice(index, 1)
    } else {
      recommendedTags.value.longtail.splice(index - recommendedTags.value.hot.length, 1)
    }
  }
}

const applySuggestion = (suggestion) => {
  // 应用优化建议
  console.log('应用建议:', suggestion.title)
  ElMessage.success(`已应用：${suggestion.title}`)
}

// 模拟实时数据更新
let updateInterval

const startRealTimeUpdates = () => {
  updateInterval = setInterval(() => {
    // 随机更新分数 - 降低更新频率减少性能影响
    bestTimes.value.forEach(slot => {
      slot.score = Math.max(50, Math.min(100, slot.score + (Math.random() - 0.5) * 5))
    })
    
    // 随机更新标签分数
    recommendedTags.value.hot.forEach(tag => {
      tag.score = Math.max(60, Math.min(100, tag.score + (Math.random() - 0.5) * 3))
    })
  }, 30000) // 每30秒更新一次，减少性能影响
}

onMounted(() => {
  // 初始化加载推荐数据
  refreshRecommendations()
  startRealTimeUpdates()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.smart-recommendations {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.recommendation-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.recommendation-section h4 {
  margin-bottom: 12px;
  color: #333;
}

.hot-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.topic-tag:hover {
  transform: translateY(-1px);
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f5f5f5;
  transition: all 0.3s;
}

.time-slot.optimal {
  background: #f0f9ff;
  border-left: 3px solid #409eff;
}

.time-slot:hover {
  background: #e8f4ff;
}

.time {
  font-weight: 500;
  min-width: 80px;
}

.score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-text {
  font-size: 12px;
  color: #666;
  min-width: 30px;
}

.reason {
  flex: 1;
  font-size: 12px;
  color: #666;
}

.tag-recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-category {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.category-name {
  font-size: 14px;
  color: #666;
  min-width: 80px;
  margin-top: 4px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-score {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0.7;
}

.optimization-suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  transition: all 0.3s;
}

.suggestion-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
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

.suggestion-action {
  margin-left: auto;
}

.competitor-insights {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-card {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.insight-metrics {
  display: flex;
  gap: 24px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.metric-value {
  font-weight: 500;
  font-size: 16px;
}

.metric-change {
  font-size: 12px;
  font-weight: 500;
}

.metric-change.positive {
  color: #67C23A;
}

.metric-change.negative {
  color: #F56C6C;
}
</style>