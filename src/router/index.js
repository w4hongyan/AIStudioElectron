import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import HotPredictor from '../components/HotPredictor.vue'
import SmartBatchProcessor from '../components/SmartBatchProcessor.vue'
import AIWriter from '../components/AIWriter.vue'
import HotTracker from '../components/HotTracker.vue'
import ImageTools from '../components/ImageTools.vue'
import VideoTools from '../components/VideoTools.vue'
import StrategyManagement from '../components/StrategyManagement.vue'
import PluginMarket from '../components/PluginMarket.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '功能总览',
      icon: 'dashboard'
    }
  },
  {
    path: '/hot-predictor',
    name: 'HotPredictor',
    component: HotPredictor,
    meta: {
      title: 'AI热点预测',
      icon: 'trend-chart',
      description: '基于AI算法预测未来7天热点趋势'
    }
  },
  {
    path: '/batch-processor',
    name: 'SmartBatchProcessor',
    component: SmartBatchProcessor,
    meta: {
      title: '智能批量处理',
      icon: 'data-analysis',
      description: 'AI驱动的批量内容生成，效率提升300%'
    }
  },
  {
    path: '/ai-writer',
    name: 'AIWriter',
    component: AIWriter,
    meta: {
      title: 'AI写作助手',
      icon: 'edit',
      description: '智能生成高质量文章'
    }
  },
  {
    path: '/hot-tracker',
    name: 'HotTracker',
    component: () => import('../components/EnhancedHotTracker.vue'),
    meta: {
      title: '智能热点',
      icon: 'trend-charts',
      description: 'AI驱动的个性化热点发现'
    }
  },
  {
    path: '/image-tools',
    name: 'ImageTools',
    component: ImageTools,
    meta: {
      title: '图片处理',
      icon: 'picture',
      description: 'AI图片生成与编辑'
    }
  },
  {
    path: '/video-tools',
    name: 'VideoTools',
    component: VideoTools,
    meta: {
      title: '视频制作',
      icon: 'video-play',
      description: '智能视频剪辑制作'
    }
  },
  {
    path: '/strategy-management',
    name: 'StrategyManagement',
    component: StrategyManagement,
    meta: {
      title: '内容策略',
      icon: 'calendar',
      description: '制定内容发布策略'
    }
  },
  {
    path: '/plugin-market',
    name: 'PluginMarket',
    component: PluginMarket,
    meta: {
      title: '插件中心',
      icon: 'grid',
      description: '扩展功能插件管理'
    }
  },
  {
    path: '/ai-image-generator',
    name: 'AiImageGenerator',
    component: () => import('../components/AiImageGenerator.vue'),
    meta: {
      title: 'AI图片生成',
      icon: 'picture',
      description: 'AI生成高质量图片'
    }
  },
  {
    path: '/voice-synthesizer',
    name: 'VoiceSynthesizer',
    component: () => import('../components/VoiceSynthesizer.vue'),
    meta: {
      title: '语音合成',
      icon: 'microphone',
      description: 'AI语音合成与处理'
    }
  },
  {
    path: '/auto-editor',
    name: 'AutoEditor',
    component: () => import('../components/AutoEditor.vue'),
    meta: {
      title: '智能编辑器',
      icon: 'scissor',
      description: 'AI驱动的内容编辑器'
    }
  },
  {
    path: '/video-editor',
    name: 'VideoEditor',
    component: () => import('../components/VideoEditor.vue'),
    meta: {
      title: '视频编辑器',
      icon: 'video-play',
      description: '专业视频编辑工具'
    }
  },
  {
    path: '/cover-designer',
    name: 'CoverDesigner',
    component: () => import('../components/CoverDesigner.vue'),
    meta: {
      title: '封面设计',
      icon: 'picture',
      description: '专业封面设计工具'
    }
  },
  {
    path: '/audio-tools',
    name: 'AudioTools',
    component: () => import('../components/AudioTools.vue'),
    meta: {
      title: '音频工具',
      icon: 'microphone',
      description: '音频处理与编辑'
    }
  },
  {
    path: '/content-optimizer',
    name: 'ContentOptimizer',
    component: () => import('../components/ContentOptimizer.vue'),
    meta: {
      title: '内容优化',
      icon: 'edit',
      description: 'AI内容优化工具'
    }
  },
  {
    path: '/analytics-dashboard',
    name: 'AnalyticsDashboard',
    component: () => import('../components/AnalyticsDashboard.vue'),
    meta: {
      title: '数据分析',
      icon: 'trend-charts',
      description: '深度分析运营数据'
    }
  },
  {
    path: '/cache-manager',
    name: 'CacheManager',
    component: () => import('../components/CacheManager.vue'),
    meta: {
      title: '性能优化',
      icon: 'monitor',
      description: '缓存管理与性能优化'
    }
  },
  {
    path: '/ai-script-writer',
    name: 'AiScriptWriter',
    component: () => import('../components/AiScriptWriter.vue'),
    meta: {
      title: 'AI脚本编写器',
      icon: 'edit-pen',
      description: 'AI驱动的影视脚本创作工具'
    }
  },
  {
    path: '/feature-manager',
    name: 'FeatureManager',
    component: () => import('../components/FeatureManager.vue'),
    meta: {
      title: '功能设置',
      icon: 'operation',
      description: '功能管理与配置'
    }
  },
  {
    path: '/quick-creation',
    name: 'QuickCreation',
    component: () => import('../components/QuickCreation.vue'),
    meta: {
      title: '一键创作',
      icon: 'lightning',
      description: '3分钟完成今日内容创作'
    }
  },
  {
    path: '/smart-recommendations',
    name: 'SmartRecommendations',
    component: () => import('../components/SmartRecommendations.vue'),
    meta: {
      title: '智能推荐',
      icon: 'star',
      description: '个性化内容推荐'
    }
  },
  {
    path: '/platform-publisher',
    name: 'PlatformPublisher',
    component: () => import('../components/PlatformPublisher.vue'),
    meta: {
      title: '一键发布',
      icon: 'upload',
      description: '多平台一键发布'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../components/NotFound.vue'),
    meta: {
      title: '页面未找到',
      icon: 'warning'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - AI Studio`
  }
  
  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 记录页面访问统计
  console.log(`导航到: ${to.path}`)
})

export default router