<template>
  <div class="common-layout">
    <el-container>
      <el-aside :width="asideWidth" class="main-aside">
        <div class="logo-container">
          <el-icon :size="32" color="var(--accent-color)"><MagicStick /></el-icon>
          <h1 v-if="!isCollapsed" class="logo-title">畅享AI</h1>
        </div>
        <el-menu
          :collapse="isCollapsed"
          :collapse-transition="false"
          active-text-color="var(--accent-color)"
          background-color="transparent"
          class="el-menu-vertical-demo"
          :default-active="$route.path.slice(1) || 'dashboard'"
          text-color="var(--text-color-primary)"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><Monitor /></el-icon>
            <template #title>功能总览</template>
          </el-menu-item>
          <!-- 内容创作 -->
          <el-sub-menu index="content-creation">
            <template #title>
              <el-icon><Cpu /></el-icon>
              <span>内容创作</span>
            </template>
            <el-menu-item index="ai-writer">
                <el-icon><Edit /></el-icon>
                <template #title>AI 写作</template>
              </el-menu-item>
            <el-menu-item index="ai-image-generator">
                <el-icon><Picture /></el-icon>
                <template #title>AI 绘图</template>
              </el-menu-item>
            <el-menu-item index="voice-synthesizer">
                <el-icon><Microphone /></el-icon>
                <template #title>语音合成</template>
              </el-menu-item>
            <el-menu-item index="content-optimizer">
                <el-icon><MagicStick /></el-icon>
                <template #title>爆款优化</template>
              </el-menu-item>
          </el-sub-menu>

          <!-- 媒体处理 -->
          <el-sub-menu index="media-processing">
            <template #title>
              <el-icon><VideoCamera /></el-icon>
              <span>媒体处理</span>
            </template>
            <el-menu-item index="image-tools">
                <el-icon><Picture /></el-icon>
                <template #title>图片处理</template>
              </el-menu-item>
            <el-menu-item index="video-tools">
                <el-icon><VideoPlay /></el-icon>
                <template #title>视频处理</template>
              </el-menu-item>
            <el-menu-item index="audio-tools">
                <el-icon><Headset /></el-icon>
                <template #title>音频处理</template>
              </el-menu-item>
            <el-menu-item index="auto-editor">
                <el-icon><Scissor /></el-icon>
                <template #title>智能剪辑</template>
              </el-menu-item>
            <el-menu-item index="video-editor">
                <el-icon><EditPen /></el-icon>
                <template #title>专业剪辑</template>
              </el-menu-item>
            <el-menu-item index="cover-designer">
                <el-icon><Postcard /></el-icon>
                <template #title>封面设计</template>
              </el-menu-item>
          </el-sub-menu>

          <!-- 运营工具 -->
          <el-sub-menu index="operations">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>运营工具</span>
            </template>
            <el-menu-item index="hot-predictor">
                <el-icon><TrendCharts /></el-icon>
                <template #title>AI热点预测</template>
              </el-menu-item>
            <el-menu-item index="batch-processor">
                <el-icon><DataAnalysis /></el-icon>
                <template #title>智能批量处理</template>
              </el-menu-item>
            <el-menu-item index="strategy-management">
                <el-icon><DataLine /></el-icon>
                <template #title>内容策略</template>
              </el-menu-item>
            <el-menu-item index="hot-tracker">
                <el-icon><TrendCharts /></el-icon>
                <template #title>热点追踪</template>
              </el-menu-item>
            <el-menu-item index="smart-recommendations">
                <el-icon><Star /></el-icon>
                <template #title>智能推荐</template>
              </el-menu-item>
            <el-menu-item index="platform-publisher">
                <el-icon><Upload /></el-icon>
                <template #title>一键发布</template>
              </el-menu-item>
          </el-sub-menu>

          <!-- 系统管理 -->
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="plugin-market">
                <el-icon><Grid /></el-icon>
                <template #title>插件中心</template>
              </el-menu-item>
            <el-menu-item index="analytics-dashboard">
                <el-icon><TrendCharts /></el-icon>
                <template #title>数据分析</template>
              </el-menu-item>
            <el-menu-item index="cache-manager">
                <el-icon><Monitor /></el-icon>
                <template #title>性能优化</template>
              </el-menu-item>
            <el-menu-item index="feature-manager">
                <el-icon><Operation /></el-icon>
                <template #title>功能设置</template>
              </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="main-header">
          <div class="header-left">
            <el-icon class="collapse-icon" @click="toggleCollapse">
              <component :is="isCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <h1>🎬 AI自媒体工具箱</h1>
          </div>
          <div class="user-info">
            <NotificationCenter />
            <el-tag type="success" effect="dark" style="margin-left: 10px;">
              <el-icon><Star /></el-icon>
              高级会员版
            </el-tag>
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" style="margin-left: 10px;" />
            <span style="margin-left: 10px;">Creative User</span>
          </div>
        </el-header>
        <el-main class="main-content">
      <router-view />
    </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Cpu, 
  Picture, 
  VideoCamera, 
  Microphone, 
  DataLine, 
  Scissor, 
  Grid, 
  Expand, 
  Fold, 
  MagicStick,
  Upload,
  TrendCharts,
  Setting,
  Edit,
  VideoPlay,
  Headset,
  EditPen,
  Postcard,
  Star,
  Monitor,
  Operation,
  DataAnalysis
} from '@element-plus/icons-vue';
import AiImageGenerator from './components/AiImageGenerator.vue'
import AnalyticsDashboard from './components/AnalyticsDashboard.vue'
import FeatureManager from './components/FeatureManager.vue';
import AiScriptWriter from './components/AiScriptWriter.vue';
import AudioTools from './components/AudioTools.vue';
import AutoEditor from './components/AutoEditor.vue';
import CacheManager from './components/CacheManager.vue';
import CoverDesigner from './components/CoverDesigner.vue';
import HotTracker from './components/HotTracker.vue';
import ImageTools from './components/ImageTools.vue';
import NotificationCenter from './components/NotificationCenter.vue';
import PlatformPublisher from './components/PlatformPublisher.vue';
import PluginMarket from './components/PluginMarket.vue';
import SmartRecommendations from './components/SmartRecommendations.vue';
import StrategyManager from './components/StrategyManager.vue';
import VideoEditor from './components/VideoEditor.vue';
import VideoTools from './components/VideoTools.vue';
import VoiceSynthesizer from './components/VoiceSynthesizer.vue';
import ContentOptimizer from './components/ContentOptimizer.vue';
import Dashboard from './components/Dashboard.vue';
import HotPredictor from './components/HotPredictor.vue';
import SmartBatchProcessor from './components/SmartBatchProcessor.vue';

// --- State for Collapsible Sidebar ---
const isCollapsed = ref(false);
const asideWidth = computed(() => (isCollapsed.value ? '65px' : '200px'));
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// --- Router Setup ---
const router = useRouter();

// --- State for View Switching ---
const handleMenuSelect = (index) => {
  router.push(`/${index}`)
};
</script>

<style>
:root {
  --main-bg-color: #f0f2f5;
  --aside-bg-color: #ffffff;
  --header-bg-color: #ffffff;
  --content-bg-color: #f0f2f5;
  --card-bg-color: #ffffff;
  --text-color-primary: #303133;
  --text-color-secondary: #606266;
  --accent-color: #409EFF;
  --accent-color-light: #79bbff;
  --border-color: #e4e7ed;
}

body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  background-color: var(--main-bg-color);
  color: var(--text-color-primary);
}

.common-layout, .el-container {
  height: 100vh;
}

.main-aside {
  background-color: var(--aside-bg-color);
  border-right: 1px solid var(--border-color);
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.08);
  transition: width 0.3s ease;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.logo-title {
  margin-left: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent-color);
}

.el-menu {
  border-right: none;
}

.el-menu-item {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.el-menu-item:hover {
  background-color: #ecf5ff;
}

.el-menu-item.is-active {
  color: var(--accent-color) !important;
  background-color: #ecf5ff;
}

.main-header {
  background-color: var(--header-bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-icon {
  font-size: 22px;
  cursor: pointer;
  margin-right: 20px;
  color: var(--text-color-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  color: var(--text-color-primary);
}

.main-content {
  background-color: var(--content-bg-color);
  padding: 24px;
}

.welcome-card, .feature-card, .result-card {
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-color-primary);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
