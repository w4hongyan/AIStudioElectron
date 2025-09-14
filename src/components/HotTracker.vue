<template>
  <div class="hot-tracker">
    <div class="tracker-layout">
      <!-- 左侧平台选择 -->
      <div class="platform-selector">
        <h3>平台选择</h3>
        <div class="platform-list">
          <el-checkbox-group v-model="selectedPlatforms">
            <el-checkbox 
              v-for="platform in platforms" 
              :key="platform.id" 
              :label="platform.id"
            >
              <div class="platform-option">
                <img :src="platform.logo" :alt="platform.name" class="platform-logo" />
                <span>{{ platform.name }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="filter-options">
          <h4>筛选选项</h4>
          <el-form label-width="80px" size="small">
            <el-form-item label="时间范围">
              <el-select v-model="timeRange" style="width: 100%">
                <el-option label="实时" value="realtime" />
                <el-option label="今日" value="today" />
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
              </el-select>
            </el-form-item>
            <el-form-item label="内容类型">
              <el-select v-model="contentType" style="width: 100%">
                <el-option label="全部" value="all" />
                <el-option label="视频" value="video" />
                <el-option label="图文" value="image" />
                <el-option label="文章" value="article" />
              </el-select>
            </el-form-item>
            <el-form-item label="分类领域">
              <el-cascader
                v-model="category"
                :options="categoryOptions"
                :props="{ expandTrigger: 'hover' }"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>

          <el-alert
          title="⚠️ 演示模式：当前为模拟数据，实际使用时将连接真实API"
          type="warning"
          :closable="false"
          style="margin-bottom: 15px"
        />
        <el-button 
          type="primary" 
          @click="fetchHotContent"
          :loading="isLoading"
          style="width: 100%"
        >
          <el-icon><Refresh /></el-icon>
          {{ isLoading ? '获取中...' : '获取热点' }}
        </el-button>
        </div>
      </div>

      <!-- 中间热点列表 -->
      <div class="content-list">
        <div class="list-header">
          <h3>热点内容</h3>
          <div class="sort-options">
            <el-radio-group v-model="sortBy" size="small">
              <el-radio-button label="hot">热度</el-radio-button>
              <el-radio-button label="time">时间</el-radio-button>
              <el-radio-button label="growth">增长率</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="content-items">
          <div 
            v-for="item in hotContent" 
            :key="item.id"
            class="content-item"
            :class="{ 'trending': item.isTrending }"
          >
            <div class="item-rank">
              <span class="rank-number">{{ item.rank }}</span>
              <span 
                class="rank-trend" 
                :class="item.trend"
              >
                <el-icon>
                  <CaretTop v-if="item.trend === 'up'" />
                  <CaretBottom v-if="item.trend === 'down'" />
                  <Minus v-if="item.trend === 'stable'" />
                </el-icon>
              </span>
            </div>

            <div class="item-content">
              <h4 class="item-title" @click="openDetail(item)">{{ item.title }}</h4>
              <div class="item-meta">
                <span class="platform-tag" :style="{ backgroundColor: item.platformColor }">
                  {{ item.platform }}
                </span>
                <span class="category">{{ item.category }}</span>
                <span class="time">{{ item.time }}</span>
              </div>
              <div class="item-stats">
                <span class="stat">
                  <el-icon><View /></el-icon>
                  {{ formatNumber(item.views) }}
                </span>
                <span class="stat">
                  <el-icon><Star /></el-icon>
                  {{ formatNumber(item.likes) }}
                </span>
                <span class="stat">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ formatNumber(item.comments) }}
                </span>
                <span class="stat">
                  <el-icon><Share /></el-icon>
                  {{ formatNumber(item.shares) }}
                </span>
              </div>
            </div>

            <div class="item-actions">
              <el-button 
                size="small" 
                type="primary" 
                @click="createScript(item)"
                :icon="Edit"
              >
                创作脚本
              </el-button>
              <el-button 
                size="small" 
                @click="addToCollection(item)"
                :icon="Star"
                :type="item.collected ? 'warning' : ''"
              >
                {{ item.collected ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="load-more">
          <el-button 
            v-if="hasMore"
            @click="loadMore"
            :loading="isLoadingMore"
          >
            {{ isLoadingMore ? '加载中...' : '加载更多' }}
          </el-button>
        </div>
      </div>

      <!-- 右侧分析面板 -->
      <div class="analysis-panel">
        <h3>趋势分析</h3>
        
        <div class="trend-chart">
          <h4>📈 数据洞察中心</h4>
          <div class="insight-cards">
            <div class="insight-card">
              <h5>观众画像</h5>
              <div class="chart-placeholder">
                <el-progress type="circle" :percentage="68" status="success">
                  <template #default>18-25岁</template>
                </el-progress>
                <p>主要受众群体</p>
              </div>
            </div>
            <div class="insight-card">
              <h5>热点预测</h5>
              <el-tag type="success" effect="dark">AI预测中</el-tag>
              <p class="prediction-text">"AI工具"话题热度↑78%</p>
            </div>
            <div class="insight-card">
              <h5>最佳发布时间</h5>
              <el-tag type="warning">19:00-21:00</el-tag>
              <p>用户活跃度最高</p>
            </div>
          </div>
          <el-button type="primary" plain style="width: 100%; margin-top: 10px">
            查看详细数据分析
          </el-button>
        </div>

        <div class="keywords-cloud">
          <h4>热门关键词</h4>
          <div class="keywords-list">
            <span 
              v-for="keyword in hotKeywords" 
              :key="keyword.text"
              class="keyword-tag"
              :style="{ fontSize: keyword.weight + 'px', color: keyword.color }"
              @click="searchKeyword(keyword.text)"
            >
              {{ keyword.text }}
            </span>
          </div>
        </div>

        <div class="collection-list">
          <h4>我的收藏</h4>
          <el-scrollbar height="200px">
            <div 
              v-for="item in collectedItems" 
              :key="item.id"
              class="collection-item"
            >
              <span class="collection-title">{{ item.title }}</span>
              <div class="collection-actions">
                <el-button size="small" @click="removeFromCollection(item)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="热点详情"
      width="70%"
    >
      <div class="detail-content" v-if="detailDialog.item">
        <h3>{{ detailDialog.item.title }}</h3>
        <div class="detail-meta">
          <span>平台：{{ detailDialog.item.platform }}</span>
          <span>分类：{{ detailDialog.item.category }}</span>
          <span>发布时间：{{ detailDialog.item.publishTime }}</span>
        </div>
        <div class="detail-stats">
          <div class="stat-item">
            <span class="stat-label">播放量</span>
            <span class="stat-value">{{ formatNumber(detailDialog.item.views) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">点赞数</span>
            <span class="stat-value">{{ formatNumber(detailDialog.item.likes) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">评论数</span>
            <span class="stat-value">{{ formatNumber(detailDialog.item.comments) }}</span>
          </div>
        </div>
        <div class="detail-description">
          <h4>内容描述</h4>
          <p>{{ detailDialog.item.description }}</p>
        </div>
        <div class="detail-tags">
          <el-tag 
            v-for="tag in detailDialog.item.tags" 
            :key="tag"
            class="detail-tag"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="createScript(detailDialog.item)">
          创作脚本
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 智能推荐侧边栏 -->
    <SmartRecommendations />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Refresh, CaretTop, CaretBottom, View, Star, ChatDotRound, Share, Edit, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiService } from '../services/aiService.js'
import SmartRecommendations from './SmartRecommendations.vue'

// 数据状态
const platforms = ref([
  { id: 'douyin', name: '抖音', logo: '/logos/douyin.png', color: '#000' },
  { id: 'bilibili', name: '哔哩哔哩', logo: '/logos/bilibili.png', color: '#00A1D6' },
  { id: 'xiaohongshu', name: '小红书', logo: '/logos/xiaohongshu.png', color: '#FF2442' },
  { id: 'weibo', name: '微博', logo: '/logos/weibo.png', color: '#E6162D' },
  { id: 'kuaishou', name: '快手', logo: '/logos/kuaishou.png', color: '#FF6A00' }
])

const selectedPlatforms = ref(['douyin', 'bilibili'])
const timeRange = ref('today')
const contentType = ref('all')
const category = ref(['entertainment'])
const sortBy = ref('hot')

const hotContent = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)

const hotKeywords = ref([])
const collectedItems = ref([])

const detailDialog = reactive({
  visible: false,
  item: null
})

// 分类选项
const categoryOptions = [
  {
    value: 'entertainment',
    label: '娱乐',
    children: [
      { value: 'celebrity', label: '明星' },
      { value: 'variety', label: '综艺' },
      { value: 'music', label: '音乐' }
    ]
  },
  {
    value: 'technology',
    label: '科技',
    children: [
      { value: 'digital', label: '数码' },
      { value: 'ai', label: '人工智能' },
      { value: 'internet', label: '互联网' }
    ]
  },
  {
    value: 'lifestyle',
    label: '生活',
    children: [
      { value: 'food', label: '美食' },
      { value: 'travel', label: '旅行' },
      { value: 'fashion', label: '时尚' }
    ]
  }
]

// 方法
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const fetchHotContent = async () => {
  isLoading.value = true
  
  try {
    // 构建查询关键词
    const keywords = buildSearchKeywords()
    
    // 调用AI服务进行热点预测
    const result = await aiService.predictHotTopics(keywords, 7)
    
    if (result.success) {
      // 处理AI返回的数据
      hotContent.value = processAIHotData(result.data)
      
      // 生成热门关键词
      hotKeywords.value = extractKeywords(result.data)
      
      ElMessage.success(`热点数据更新完成！数据来源: ${result.source}`)
    } else {
      // 使用降级数据
      hotContent.value = getMockHotData()
      hotKeywords.value = getMockKeywords()
      ElMessage.warning('AI服务暂不可用，显示模拟数据')
    }
  } catch (error) {
    console.error('获取热点数据失败:', error)
    ElMessage.error('获取热点数据失败: ' + error.message)
    
    // 使用降级数据
    hotContent.value = getMockHotData()
    hotKeywords.value = getMockKeywords()
  } finally {
    isLoading.value = false
  }
}

// 构建搜索关键词
const buildSearchKeywords = () => {
  const platformNames = selectedPlatforms.value.map(id => {
    const platform = platforms.value.find(p => p.id === id)
    return platform ? platform.name : ''
  }).filter(Boolean).join(' ')
  
  const categoryName = category.value.length > 0 ? category.value[category.value.length - 1] : '全部'
  
  return `${platformNames} ${categoryName} ${contentType.value} 热点 趋势`
}

// 处理AI返回的热点数据
const processAIHotData = (aiData) => {
  return aiData.map((item, index) => ({
    id: index + 1,
    title: item.aiInsights ? extractTitle(item.aiInsights) : `热点话题 ${index + 1}`,
    platform: getRandomPlatform(),
    platformColor: getPlatformColor(getRandomPlatform()),
    category: category.value.length > 0 ? getCategoryLabel(category.value[category.value.length - 1]) : '综合',
    views: Math.floor(item.volume || Math.random() * 3000000 + 500000),
    likes: Math.floor((item.volume || Math.random() * 3000000) * 0.06),
    comments: Math.floor((item.volume || Math.random() * 3000000) * 0.003),
    shares: Math.floor((item.volume || Math.random() * 3000000) * 0.004),
    time: getRelativeTime(item.date),
    trend: item.trend || (item.score > 80 ? 'up' : item.score > 60 ? 'stable' : 'down'),
    rank: index + 1,
    isTrending: item.score > 85,
    collected: false,
    description: item.aiInsights || `基于AI分析的热点内容，热度评分: ${item.score}`,
    tags: item.keywords || ['AI分析', '热点', '趋势'],
    publishTime: formatDate(item.date),
    confidence: item.confidence || 85
  }))
}

// 从AI分析中提取标题
const extractTitle = (insights) => {
  if (typeof insights === 'string') {
    // 尝试从文本中提取第一行作为标题
    const lines = insights.split('\n').filter(line => line.trim())
    return lines[0] || '热点话题'
  }
  return '热点话题'
}

// 获取随机平台
const getRandomPlatform = () => {
  const availablePlatforms = platforms.value.filter(p => selectedPlatforms.value.includes(p.id))
  const randomPlatform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)]
  return randomPlatform ? randomPlatform.name : '抖音'
}

// 获取平台颜色
const getPlatformColor = (platformName) => {
  const colorMap = {
    '抖音': '#000',
    '哔哩哔哩': '#00A1D6',
    '小红书': '#FF2442',
    '微博': '#E6162D',
    '快手': '#FF6A00'
  }
  return colorMap[platformName] || '#409eff'
}

// 获取分类标签
const getCategoryLabel = (categoryValue) => {
  const categoryMap = {
    'celebrity': '明星',
    'variety': '综艺',
    'music': '音乐',
    'digital': '数码',
    'ai': '人工智能',
    'internet': '互联网',
    'food': '美食',
    'travel': '旅行',
    'fashion': '时尚'
  }
  return categoryMap[categoryValue] || '综合'
}

// 获取相对时间
const getRelativeTime = (date) => {
  const now = new Date()
  const targetDate = new Date(date)
  const diffHours = Math.floor((now - targetDate) / (1000 * 60 * 60))
  
  if (diffHours < 1) return '刚刚'
  if (diffHours < 24) return `${diffHours}小时前`
  return `${Math.floor(diffHours / 24)}天前`
}

// 提取关键词
const extractKeywords = (aiData) => {
  const keywords = new Map()
  
  aiData.forEach(item => {
    if (item.keywords && Array.isArray(item.keywords)) {
      item.keywords.forEach(keyword => {
        const count = keywords.get(keyword) || 0
        keywords.set(keyword, count + 1)
      })
    }
  })
  
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count], index) => ({
      text,
      weight: Math.max(12, 24 - index * 2),
      color: colors[index % colors.length]
    }))
}

// 获取模拟热点数据（降级方案）
const getMockHotData = () => {
  const mockData = [
    {
      id: 1,
      title: 'AI绘画技术突破，普通人也能创作艺术作品',
      platform: '抖音',
      platformColor: '#000',
      category: '科技',
      views: 2500000,
      likes: 150000,
      comments: 8500,
      shares: 12000,
      time: '2小时前',
      trend: 'up',
      rank: 1,
      isTrending: true,
      collected: false,
      description: '最新AI绘画技术让每个人都能成为艺术家，无需专业技能即可创作高质量作品...',
      tags: ['AI', '绘画', '技术', '创作'],
      publishTime: '2024-01-15 14:30'
    },
    {
      id: 2,
      title: '春节档电影票房预测，这部黑马影片或成最大赢家',
      platform: '哔哩哔哩',
      platformColor: '#00A1D6',
      category: '娱乐',
      views: 1800000,
      likes: 95000,
      comments: 6500,
      shares: 8000,
      time: '3小时前',
      trend: 'up',
      rank: 2,
      isTrending: true,
      collected: false,
      description: '专业影评人分析春节档电影市场，预测一匹黑马将逆袭成为票房冠军...',
      tags: ['电影', '春节档', '票房', '预测'],
      publishTime: '2024-01-15 13:45'
    },
    {
      id: 3,
      title: '00后整顿职场真相调查，数据告诉你真实情况',
      platform: '小红书',
      platformColor: '#FF2442',
      category: '生活',
      views: 1200000,
      likes: 78000,
      comments: 4200,
      shares: 3500,
      time: '5小时前',
      trend: 'stable',
      rank: 3,
      isTrending: false,
      collected: true,
      description: '通过大数据分析00后职场现状，揭示"整顿职场"背后的真实情况...',
      tags: ['00后', '职场', '调查', '数据'],
      publishTime: '2024-01-15 11:20'
    }
  ]
  
  return mockData
}

// 获取模拟关键词（降级方案）
const getMockKeywords = () => {
  return [
    { text: 'AI', weight: 24, color: '#409eff' },
    { text: '春节档', weight: 20, color: '#67c23a' },
    { text: '00后', weight: 18, color: '#e6a23c' },
    { text: '职场', weight: 16, color: '#909399' },
    { text: '绘画', weight: 14, color: '#f56c6c' },
    { text: '电影', weight: 12, color: '#409eff' }
  ]
}

const loadMore = async () => {
  isLoadingMore.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  hasMore.value = false
  isLoadingMore.value = false
}

const openDetail = (item) => {
  detailDialog.item = item
  detailDialog.visible = true
}

const createScript = (item) => {
  // 跳转到脚本创作页面
  console.log('创建脚本:', item.title)
  // 这里可以触发路由跳转或事件
}

const addToCollection = (item) => {
  item.collected = !item.collected
  if (item.collected) {
    collectedItems.value.unshift({
      id: item.id,
      title: item.title,
      platform: item.platform
    })
  } else {
    const index = collectedItems.value.findIndex(i => i.id === item.id)
    if (index > -1) {
      collectedItems.value.splice(index, 1)
    }
  }
}

const removeFromCollection = (item) => {
  const index = collectedItems.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    collectedItems.value.splice(index, 1)
    const contentItem = hotContent.value.find(c => c.id === item.id)
    if (contentItem) {
      contentItem.collected = false
    }
  }
}

const searchKeyword = (keyword) => {
  console.log('搜索关键词:', keyword)
  // 这里可以实现关键词搜索功能
}

onMounted(() => {
  // 加载收藏数据
  const savedCollection = localStorage.getItem('hotTrackerCollection')
  if (savedCollection) {
    collectedItems.value = JSON.parse(savedCollection)
  }
  
  fetchHotContent()
})
</script>

<style scoped>
.hot-tracker {
  height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.tracker-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.platform-selector,
.content-list,
.analysis-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.platform-selector {
  width: 300px;
  overflow-y: auto;
}

.content-list {
  flex: 1;
  min-width: 400px;
  overflow-y: auto;
}

.analysis-panel {
  width: 300px;
  overflow-y: auto;
}

.platform-list {
  margin-bottom: 20px;
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.filter-options h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.content-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.content-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 159, 255, 0.2);
}

.content-item.trending {
  border-left: 4px solid #ff6b6b;
}

.item-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 40px;
}

.rank-number {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.rank-trend {
  font-size: 16px;
}

.rank-trend.up {
  color: #67c23a;
}

.rank-trend.down {
  color: #f56c6c;
}

.rank-trend.stable {
  color: #909399;
}

.item-content {
  flex: 1;
}

.item-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  cursor: pointer;
}

.item-title:hover {
  color: #409eff;
}

.item-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.platform-tag {
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-size: 11px;
}

.item-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.stat {
  display: flex;
  align-items: center;
  gap: 3px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.trend-chart,
.keywords-cloud,
.collection-list {
  margin-bottom: 20px;
}

.trend-chart h4,
.keywords-cloud h4,
.collection-list h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  border: 1px dashed #e4e7ed;
  border-radius: 8px;
  color: #999;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.keyword-tag:hover {
  transform: scale(1.1);
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 8px;
}

.collection-title {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.detail-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.detail-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  color: #666;
}

.detail-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.detail-description {
  margin-bottom: 20px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>