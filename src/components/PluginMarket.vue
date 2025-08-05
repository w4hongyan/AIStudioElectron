<template>
  <div class="plugin-market">
    <el-alert
      title="🔌 插件市场：无限扩展您的自媒体工具能力"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <!-- 市场统计 -->
    <div class="market-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="icon">📦</div>
              <div class="data">
                <div class="number">{{ totalPlugins }}</div>
                <div class="label">总插件数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="icon">⬇️</div>
              <div class="data">
                <div class="number">{{ installedPlugins }}</div>
                <div class="label">已安装</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="icon">⭐</div>
              <div class="data">
                <div class="number">{{ avgRating }}</div>
                <div class="label">平均评分</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="icon">🔥</div>
              <div class="data">
                <div class="number">{{ trendingPlugins }}</div>
                <div class="label">本周热门</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20" align="middle">
          <el-col :span="12">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索插件..."
              :prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-select v-model="selectedCategory" placeholder="选择分类" clearable>
              <el-option label="内容创作" value="content" />
              <el-option label="数据分析" value="analytics" />
              <el-option label="平台集成" value="platform" />
              <el-option label="效率工具" value="productivity" />
              <el-option label="AI增强" value="ai" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="sortBy" placeholder="排序方式">
              <el-option label="热门程度" value="popular" />
              <el-option label="评分最高" value="rating" />
              <el-option label="最新发布" value="newest" />
              <el-option label="下载量" value="downloads" />
            </el-select>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 插件展示 -->
    <div class="plugins-grid">
      <el-row :gutter="20">
        <el-col v-for="plugin in filteredPlugins" :key="plugin.id" :span="8">
          <el-card class="plugin-card" :body-style="{ padding: '0px' }">
            <div class="plugin-header">
              <img :src="plugin.icon" class="plugin-icon" />
              <div class="plugin-info">
                <h3>{{ plugin.name }}</h3>
                <p class="author">by {{ plugin.author }}</p>
              </div>
              <el-tag size="small" :type="getStatusType(plugin.status)">
                {{ plugin.status }}
              </el-tag>
            </div>
            
            <div class="plugin-body">
              <p class="description">{{ plugin.description }}</p>
              
              <div class="plugin-stats">
                <div class="stat">
                  <el-icon><Star /></el-icon>
                  <span>{{ plugin.rating }}</span>
                </div>
                <div class="stat">
                  <el-icon><Download /></el-icon>
                  <span>{{ plugin.downloads }}</span>
                </div>
                <div class="stat">
                  <el-icon><User /></el-icon>
                  <span>{{ plugin.users }}</span>
                </div>
              </div>

              <div class="categories">
                <el-tag 
                  v-for="category in plugin.categories" 
                  :key="category" 
                  size="mini" 
                  class="category-tag"
                >
                  {{ category }}
                </el-tag>
              </div>
            </div>

            <div class="plugin-footer">
              <el-button 
                v-if="plugin.status === 'available'" 
                type="primary" 
                size="small" 
                @click="installPlugin(plugin)"
              >
                <el-icon><Download /></el-icon> 安装
              </el-button>
              <el-button 
                v-else-if="plugin.status === 'installed'" 
                type="warning" 
                size="small" 
                @click="uninstallPlugin(plugin)"
              >
                <el-icon><Delete /></el-icon> 卸载
              </el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                @click="updatePlugin(plugin)"
              >
                <el-icon><Refresh /></el-icon> 更新
              </el-button>
              
              <el-button size="small" @click="viewPluginDetails(plugin)">
                详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 插件详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="插件详情" width="600px">
      <div v-if="selectedPlugin" class="plugin-detail">
        <div class="detail-header">
          <img :src="selectedPlugin.icon" class="detail-icon" />
          <div class="detail-info">
            <h2>{{ selectedPlugin.name }}</h2>
            <p class="detail-author">作者: {{ selectedPlugin.author }}</p>
            <p class="detail-version">版本: {{ selectedPlugin.version }}</p>
          </div>
        </div>

        <div class="detail-content">
          <el-tabs v-model="activeDetailTab">
            <el-tab-pane label="描述" name="description">
              <p>{{ selectedPlugin.longDescription }}</p>
              
              <h4>功能特性</h4>
              <ul>
                <li v-for="feature in selectedPlugin.features" :key="feature">
                  ✓ {{ feature }}
                </li>
              </ul>
            </el-tab-pane>

            <el-tab-pane label="评价" name="reviews">
              <div class="reviews">
                <div v-for="review in selectedPlugin.reviews" :key="review.id" class="review">
                  <div class="review-header">
                    <span class="reviewer">{{ review.user }}</span>
                    <el-rate v-model="review.rating" disabled size="small" />
                  </div>
                  <p>{{ review.comment }}</p>
                  <span class="review-date">{{ review.date }}</span>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="版本历史" name="changelog">
              <div class="changelog">
                <div v-for="version in selectedPlugin.changelog" :key="version.version" class="version">
                  <h5>{{ version.version }} ({{ version.date }})</h5>
                  <ul>
                    <li v-for="change in version.changes" :key="change">
                      • {{ change }}
                    </li>
                  </ul>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>

    <!-- 已安装插件管理 -->
    <div class="installed-section">
      <el-card>
        <template #header>
          <span>📦 已安装插件</span>
          <el-button type="primary" size="small" @click="managePlugins" style="float: right">
            管理插件
          </el-button>
        </template>
        
        <el-table :data="installedPluginList" style="width: 100%">
          <el-table-column prop="name" label="插件名称" />
          <el-table-column prop="version" label="版本" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'warning'">
                {{ row.status === 'enabled' ? '已启用' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="togglePlugin(row)">
                {{ row.status === 'enabled' ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" @click="uninstallPlugin(row)">
                卸载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { Search, Download, Star, User, Refresh, Delete, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('')
const sortBy = ref('popular')
const detailDialogVisible = ref(false)
const activeDetailTab = ref('description')
const selectedPlugin = ref(null)

// 统计数据
const totalPlugins = ref(156)
const installedPlugins = ref(12)
const avgRating = ref(4.7)
const trendingPlugins = ref(8)

// 插件数据
const plugins = ref([
  {
    id: 1,
    name: '抖音热点追踪器',
    author: 'AI Studio',
    version: '2.1.0',
    icon: 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=抖音',
    description: '实时监控抖音热榜，自动推荐热门话题',
    longDescription: '抖音热点追踪器能够实时监控抖音平台的实时热榜，包括热门话题、热门音乐、热门挑战等。基于AI算法分析趋势，为您的内容创作提供灵感来源。',
    status: 'installed',
    rating: 4.8,
    downloads: 15420,
    users: 8900,
    categories: ['内容创作', '数据分析'],
    features: ['实时热榜监控', '话题推荐', '趋势分析', '一键生成选题'],
    reviews: [
      { id: 1, user: '创作者小王', rating: 5, comment: '非常实用，帮我找到了很多热门选题！', date: '2024-01-15' },
      { id: 2, user: '运营小李', rating: 4, comment: '数据很准确，就是界面可以再优化', date: '2024-01-10' }
    ],
    changelog: [
      { version: '2.1.0', date: '2024-01-20', changes: ['新增音乐热榜', '优化推荐算法', '修复已知bug'] },
      { version: '2.0.0', date: '2024-01-10', changes: ['全新界面设计', '增加趋势预测', '支持多平台数据'] }
    ]
  },
  {
    id: 2,
    name: '智能字幕生成器',
    author: '字幕大师',
    version: '1.5.2',
    icon: 'https://via.placeholder.com/60x60/4ECDC4/FFFFFF?text=字幕',
    description: 'AI自动生成精美字幕，支持多种样式',
    longDescription: '基于先进的语音识别技术，自动为您的视频生成准确的字幕。提供多种字幕样式模板，支持自定义字体、颜色、动画效果，让您的视频更专业。',
    status: 'available',
    rating: 4.6,
    downloads: 12350,
    users: 6700,
    categories: ['内容创作', 'AI增强'],
    features: ['自动语音识别', '多语言支持', '样式模板', '实时预览'],
    reviews: [
      { id: 3, user: '视频博主', rating: 5, comment: '识别率很高，样式也很漂亮', date: '2024-01-18' }
    ],
    changelog: [
      { version: '1.5.2', date: '2024-01-18', changes: ['修复样式bug', '提升识别准确率'] }
    ]
  },
  {
    id: 3,
    name: '多平台一键发布',
    author: '发布助手',
    version: '3.0.1',
    icon: 'https://via.placeholder.com/60x60/45B7D1/FFFFFF?text=发布',
    description: '一键发布到10+主流平台，省时高效',
    longDescription: '支持抖音、快手、B站、小红书、微博等10+主流平台的一键发布。自动适配各平台格式要求，支持定时发布，批量操作，大大提升发布效率。',
    status: 'update',
    rating: 4.9,
    downloads: 28900,
    users: 15600,
    categories: ['平台集成', '效率工具'],
    features: ['10+平台支持', '定时发布', '批量操作', '格式自动适配'],
    reviews: [
      { id: 4, user: 'MCN机构', rating: 5, comment: '效率提升10倍！', date: '2024-01-16' }
    ],
    changelog: [
      { version: '3.0.1', date: '2024-01-19', changes: ['新增小红书支持', '优化发布流程'] }
    ]
  }
])

const installedPluginList = ref([
  { id: 1, name: '抖音热点追踪器', version: '2.1.0', status: 'enabled' },
  { id: 5, name: '竞品分析器', version: '1.2.0', status: 'enabled' },
  { id: 7, name: '封面模板库', version: '3.5.0', status: 'disabled' }
])

// 计算属性
const filteredPlugins = computed(() => {
  let result = plugins.value

  // 搜索过滤
  if (searchKeyword.value) {
    result = result.filter(plugin => 
      plugin.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    result = result.filter(plugin => 
      plugin.categories.includes(selectedCategory.value)
    )
  }

  // 排序
  switch (sortBy.value) {
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'downloads':
      result.sort((a, b) => b.downloads - a.downloads)
      break
    case 'newest':
      result.sort((a, b) => new Date(b.changelog[0].date) - new Date(a.changelog[0].date))
      break
    default:
      result.sort((a, b) => b.downloads - a.downloads)
  }

  return result
})

// 方法
const getStatusType = (status) => {
  const types = {
    'available': 'success',
    'installed': 'info',
    'update': 'warning'
  }
  return types[status] || 'info'
}

const installPlugin = (plugin) => {
  ElMessageBox.confirm(
    `确定要安装 "${plugin.name}" 插件吗？`,
    '安装插件',
    { confirmButtonText: '安装', cancelButtonText: '取消' }
  ).then(() => {
    plugin.status = 'installed'
    installedPlugins.value++
    installedPluginList.value.push({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      status: 'enabled'
    })
    ElMessage.success('插件安装成功！')
  })
}

const uninstallPlugin = (plugin) => {
  ElMessageBox.confirm(
    `确定要卸载 "${plugin.name}" 插件吗？`,
    '卸载插件',
    { confirmButtonText: '卸载', cancelButtonText: '取消' }
  ).then(() => {
    plugin.status = 'available'
    installedPlugins.value--
    const index = installedPluginList.value.findIndex(p => p.id === plugin.id)
    if (index > -1) {
      installedPluginList.value.splice(index, 1)
    }
    ElMessage.success('插件卸载成功！')
  })
}

const updatePlugin = (plugin) => {
  ElMessage.success(`正在更新 ${plugin.name}...`)
  setTimeout(() => {
    plugin.status = 'installed'
    ElMessage.success('插件更新成功！')
  }, 1500)
}

const viewPluginDetails = (plugin) => {
  selectedPlugin.value = plugin
  detailDialogVisible.value = true
}

const togglePlugin = (plugin) => {
  plugin.status = plugin.status === 'enabled' ? 'disabled' : 'enabled'
  ElMessage.success(plugin.status === 'enabled' ? '插件已启用' : '插件已禁用')
}

const managePlugins = () => {
  ElMessage.info('插件管理功能开发中...')
}
</script>

<style scoped>
.plugin-market {
  padding: 20px;
}

.market-stats {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.icon {
  font-size: 32px;
}

.data .number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.data .label {
  font-size: 14px;
  color: #666;
}

.search-section {
  margin-bottom: 30px;
}

.plugins-grid {
  margin-bottom: 30px;
}

.plugin-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.plugin-card:hover {
  transform: translateY(-5px);
}

.plugin-header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.plugin-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 15px;
}

.plugin-info h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.author {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.plugin-body {
  padding: 15px;
}

.description {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.plugin-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #999;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.category-tag {
  margin: 2px;
}

.plugin-footer {
  padding: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.plugin-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.detail-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  margin-right: 20px;
}

.detail-info h2 {
  margin: 0 0 10px 0;
}

.detail-author, .detail-version {
  margin: 5px 0;
  color: #666;
}

.detail-content {
  margin-top: 20px;
}

.reviews, .changelog {
  margin-top: 20px;
}

.review, .version {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reviewer {
  font-weight: bold;
}

.review-date {
  font-size: 12px;
  color: #999;
}

.installed-section {
  margin-top: 30px;
}
</style>