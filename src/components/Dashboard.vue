<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>AI Studio 功能总览</h1>
      <p class="subtitle">一站式AI内容创作与运营平台</p>
      
      <!-- 系统状态监控 -->
      <div class="system-status">
        <div class="status-item">
          <el-icon :size="16" color="#67C23A"><SuccessFilled /></el-icon>
          <span>AI服务在线</span>
        </div>
        <div class="status-item">
          <el-icon :size="16" color="#E6A23C"><WarningFilled /></el-icon>
          <span>内存使用: {{ memoryUsage }}%</span>
        </div>
        <div class="status-item">
          <el-icon :size="16" color="#409EFF"><InfoFilled /></el-icon>
          <span>今日处理: {{ todayProcessed }} 任务</span>
        </div>
      </div>
    </div>

    <!-- 🎯 新手一键创作流程 -->
    <div class="quick-actions">
      <!-- 核心场景：我今天要发什么？ -->
      <div class="action-card primary" @click="startQuickCreation">
        <div class="action-icon">
          <el-icon :size="32"><Lightning /></el-icon>
        </div>
        <div class="action-content">
          <h3>🚀 一键创作</h3>
          <p>3分钟完成今日内容创作</p>
          <el-tag type="success" size="small">新手推荐</el-tag>
        </div>
      </div>
      
      <!-- 核心场景：什么内容最火？ -->
      <div class="action-card secondary" @click="openTrendingIdeas">
        <div class="action-icon">
          <el-icon :size="32"><TrendCharts /></el-icon>
        </div>
        <div class="action-content">
          <h3>🔥 今日热点</h3>
          <p>AI推荐10个爆款选题</p>
          <el-tag type="warning" size="small">实时更新</el-tag>
        </div>
      </div>
      
      <!-- 核心场景：如何批量生产？ -->
      <div class="action-card secondary" @click="openSmartWorkflow">
        <div class="action-icon">
          <el-icon :size="32"><MagicStick /></el-icon>
        </div>
        <div class="action-content">
          <h3>⚡ 智能工作流</h3>
          <p>1小时生成1周内容</p>
          <el-tag type="info" size="small">效率神器</el-tag>
        </div>
      </div>
    </div>
    
    <!-- 📊 个性化数据洞察 -->
    <div class="personal-insights">
      <div class="insight-card">
        <h4>📈 你的创作效率</h4>
        <div class="efficiency-meter">
          <el-progress 
            type="circle" 
            :percentage="85" 
            :width="80"
            status="success">
            <template #default>85%</template>
          </el-progress>
          <div class="efficiency-text">
            <span>比同行快3.2倍</span>
            <small>本周已节省4.5小时</small>
          </div>
        </div>
      </div>
      
      <div class="insight-card">
        <h4>🎯 最佳发布时间</h4>
        <div class="optimal-time">
          <el-icon :size="24"><Clock /></el-icon>
          <div>
            <strong>今晚 19:30-20:30</strong>
            <small>预计曝光量提升240%</small>
          </div>
        </div>
      </div>
    </div>

    <div class="feature-grid">
      <div v-for="group in featureGroups" :key="group.category" class="feature-group">
        <div class="group-header">
          <el-icon :size="24" class="group-icon">
            <component :is="group.icon" />
          </el-icon>
          <h3>{{ group.category }}</h3>
          <div class="group-stats">
            <span>{{ group.usage }} 次使用</span>
          </div>
        </div>
        
        <div class="feature-cards">
          <div v-for="feature in group.features" :key="feature.name" class="feature-card">
            <div class="card-icon">
              <el-icon :size="32">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <h4>{{ feature.name }}</h4>
            <p>{{ feature.description }}</p>
            <div class="feature-meta">
              <el-tag :type="feature.status.type" size="mini">
                {{ feature.status.text }}
              </el-tag>
              <span class="usage-count">{{ feature.usage }} 次</span>
            </div>
            <el-button type="primary" size="small" @click="openFeature(feature)" class="feature-btn">
              立即使用
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用统计 -->
    <div class="usage-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalUsage }}</div>
          <div class="stat-label">总使用次数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24"><Star /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ successRate }}%</div>
          <div class="stat-label">成功率</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ avgProcessingTime }}s</div>
          <div class="stat-label">平均处理时间</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Edit,
  Picture,
  VideoPlay,
  TrendCharts,
  Calendar,
  Setting,
  User,
  DataAnalysis,
  Monitor,
  Operation,
  Star,
  Postcard,
  Headset,
  EditPen,
  SuccessFilled,
  WarningFilled,
  InfoFilled,
  Clock,
  MagicStick,
  DataLine,
  Upload,
  Scissor,
  Grid
} from '@element-plus/icons-vue'
import { memoryMonitor } from '../services/memoryMonitor'

const router = useRouter()

// 系统状态
const memoryUsage = ref(0)
const todayProcessed = ref(0)
const totalUsage = ref(12547)
const successRate = ref(94.7)
const avgProcessingTime = ref(2.3)

// 功能组数据 - 与左侧菜单一一对应
const featureGroups = ref([
  {
    category: '内容创作',
    icon: Edit,
    usage: 3847,
    features: [
      { 
        name: 'AI写作助手', 
        description: '智能生成高质量文章', 
        icon: Edit, 
        route: '/ai-writer',
        status: { type: 'primary', text: '稳定' },
        usage: 1247
      },
      { 
        name: 'AI图片生成', 
        description: 'AI生成高质量图片', 
        icon: Picture, 
        route: '/ai-image-generator',
        status: { type: 'primary', text: '稳定' },
        usage: 1023
      },
      { 
        name: '语音合成', 
        description: 'AI语音合成与处理', 
        icon: Headset, 
        route: '/voice-synthesizer',
        status: { type: 'primary', text: '稳定' },
        usage: 525
      },
      { 
        name: '爆款优化', 
        description: 'AI优化内容质量', 
        icon: MagicStick, 
        route: '/content-optimizer',
        status: { type: 'success', text: '热门' },
        usage: 1185
      }
    ]
  },
  {
    category: '媒体处理',
    icon: Picture,
    usage: 4567,
    features: [
      { 
        name: '图片处理', 
        description: 'AI图片编辑与处理', 
        icon: Picture, 
        route: '/image-tools',
        status: { type: 'primary', text: '稳定' },
        usage: 1023
      },
      { 
        name: '视频处理', 
        description: '智能视频剪辑制作', 
        icon: VideoPlay, 
        route: '/video-tools',
        status: { type: 'primary', text: '稳定' },
        usage: 678
      },
      { 
        name: '音频处理', 
        description: '音频编辑与优化', 
        icon: Headset, 
        route: '/audio-tools',
        status: { type: 'warning', text: '测试中' },
        usage: 525
      },
      { 
        name: '智能剪辑', 
        description: 'AI驱动的内容编辑', 
        icon: Scissor, 
        route: '/auto-editor',
        status: { type: 'success', text: '新功能' },
        usage: 892
      },
      { 
        name: '专业剪辑', 
        description: '专业视频编辑工具', 
        icon: EditPen, 
        route: '/video-editor',
        status: { type: 'primary', text: '稳定' },
        usage: 756
      },
      { 
        name: '封面设计', 
        description: '专业封面设计工具', 
        icon: Postcard, 
        route: '/cover-designer',
        status: { type: 'primary', text: '稳定' },
        usage: 444
      }
    ]
  },
  {
    category: '运营工具',
    icon: TrendCharts,
    usage: 2891,
    features: [
      { 
        name: 'AI热点预测', 
        description: '基于AI算法预测未来7天热点趋势', 
        icon: TrendCharts, 
        route: '/hot-predictor',
        status: { type: 'success', text: '新功能' },
        usage: 523
      },
      { 
        name: '智能批量处理', 
        description: 'AI驱动的批量内容生成，效率提升300%', 
        icon: DataAnalysis, 
        route: '/batch-processor',
        status: { type: 'success', text: '热门' },
        usage: 2341
      },
      { 
        name: '内容策略', 
        description: '制定内容发布策略', 
        icon: DataLine, 
        route: '/strategy-management',
        status: { type: 'primary', text: '稳定' },
        usage: 987
      },
      { 
        name: '热点追踪', 
        description: '实时监控全网热点', 
        icon: TrendCharts, 
        route: '/hot-tracker',
        status: { type: 'primary', text: '稳定' },
        usage: 892
      },
      { 
        name: '智能推荐', 
        description: '个性化内容推荐', 
        icon: Star, 
        route: '/smart-recommendations',
        status: { type: 'primary', text: '稳定' },
        usage: 756
      },
      { 
        name: '一键发布', 
        description: '多平台一键发布', 
        icon: Upload, 
        route: '/platform-publisher',
        status: { type: 'primary', text: '稳定' },
        usage: 659
      }
    ]
  },
  {
    category: '系统管理',
    icon: Setting,
    usage: 1242,
    features: [
      { 
        name: '插件中心', 
        description: '扩展功能插件管理', 
        icon: Grid, 
        route: '/plugin-market',
        status: { type: 'primary', text: '稳定' },
        usage: 342
      },
      { 
        name: '数据分析', 
        description: '深度分析运营数据', 
        icon: TrendCharts, 
        route: '/analytics-dashboard',
        status: { type: 'primary', text: '稳定' },
        usage: 1245
      },
      { 
        name: '性能优化', 
        description: '缓存管理与性能优化', 
        icon: Monitor, 
        route: '/cache-manager',
        status: { type: 'primary', text: '稳定' },
        usage: 444
      },
      { 
        name: '功能设置', 
        description: '功能管理与配置', 
        icon: Operation, 
        route: '/feature-manager',
        status: { type: 'primary', text: '稳定' },
        usage: 456
      }
    ]
  }
])

// 方法
const startQuickCreation = () => {
  router.push('/quick-creation')
}

const openTrendingIdeas = () => {
  router.push('/hot-predictor')
}

const openSmartWorkflow = () => {
  router.push('/batch-processor')
}

const openFeature = (feature) => {
  console.log('打开功能:', feature.name)
  
  if (feature.route) {
    router.push(feature.route)
  } else {
    ElMessage.info(`${feature.name} 功能开发中...`)
  }
}

// 系统监控
onMounted(() => {
  // 初始化内存监控
  memoryMonitor.startMonitoring()
  
  // 更新内存使用状态 - 降低更新频率减少性能影响
  const updateStatus = () => {
    memoryUsage.value = memoryMonitor.getMemoryUsage()
    todayProcessed.value = Math.floor(Math.random() * 100) + 50
  }
  
  updateStatus()
  setInterval(updateStatus, 15000) // 每15秒更新一次，减少性能影响
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.dashboard-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 18px;
  color: var(--text-color-secondary);
  margin-bottom: 20px;
}

.system-status {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.action-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-card.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 32px;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  margin: 0 0 5px 0;
  font-size: 20px;
}

.action-content p {
  margin: 0 0 10px 0;
  opacity: 0.9;
}

.feature-grid {
  display: grid;
  gap: 30px;
  margin-bottom: 30px;
}

.feature-group {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.group-icon {
  color: var(--accent-color);
}

.group-header h3 {
  font-size: 24px;
  margin: 0;
  color: var(--text-color-primary);
  flex: 1;
}

.group-stats {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--bg-color-secondary);
  border-radius: 10px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: var(--accent-color);
}

.card-icon {
  color: var(--accent-color);
  margin-bottom: 15px;
}

.feature-card h4 {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--text-color-primary);
}

.feature-card p {
  color: var(--text-color-secondary);
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.5;
}

.feature-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 12px;
}

.usage-count {
  color: var(--text-color-secondary);
}

.feature-btn {
  width: 100%;
}

.usage-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  color: var(--accent-color);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .system-status {
    flex-direction: column;
    gap: 15px;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .usage-stats {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header h1 {
    font-size: 28px;
  }
  
  .feature-group {
    padding: 20px;
  }
}
</style>
