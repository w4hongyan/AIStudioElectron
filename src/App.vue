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
          default-active="ai-script-writer"
          text-color="var(--text-color-primary)"
          @select="handleMenuSelect"
        >
          <el-menu-item index="ai-script-writer">
            <el-icon><Cpu /></el-icon>
            <template #title>AI 创作</template>
          </el-menu-item>
          <el-menu-item index="image-tools">
            <el-icon><Picture /></el-icon>
            <template #title>图片工具</template>
          </el-menu-item>
          <el-menu-item index="video-tools">
            <el-icon><VideoCamera /></el-icon>
            <template #title>视频工具</template>
          </el-menu-item>
          <el-menu-item index="audio-tools">
            <el-icon><Microphone /></el-icon>
            <template #title>音频工具</template>
          </el-menu-item>
          <el-menu-item index="strategy-management">
            <el-icon><DataLine /></el-icon>
            <template #title>策略管理</template>
          </el-menu-item>
          <el-menu-item index="auto-editor">
            <el-icon><Scissor /></el-icon>
            <template #title>自动混剪</template>
          </el-menu-item>
          <el-menu-item index="cover-designer">
            <el-icon><Picture /></el-icon>
            <template #title>封面设计</template>
          </el-menu-item>
          <el-menu-item index="video-editor">
            <el-icon><VideoCamera /></el-icon>
            <template #title>视频剪辑</template>
          </el-menu-item>
          <el-menu-item index="voice-synthesizer">
            <el-icon><Microphone /></el-icon>
            <template #title>语音合成</template>
          </el-menu-item>
          <el-menu-item index="platform-publisher">
            <el-icon><Upload /></el-icon>
            <template #title>平台发布</template>
          </el-menu-item>
          <el-menu-item index="ai-image-generator">
            <el-icon><Picture /></el-icon>
            <template #title>AI 视觉</template>
          </el-menu-item>
          <el-menu-item index="hot-tracker">
            <el-icon><TrendCharts /></el-icon>
            <template #title>热点追踪</template>
          </el-menu-item>
          <el-menu-item index="plugin-market">
            <el-icon><Grid /></el-icon>
            <template #title>插件市场</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="main-header">
          <div class="header-left">
            <el-icon class="collapse-icon" @click="toggleCollapse">
              <component :is="isCollapsed ? 'Expand' : 'Fold'" />
            </el-icon>
            <!-- Other header content can go here -->
          </div>
          <div class="user-info">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span style="margin-left: 10px;">Creative User</span>
          </div>
        </el-header>
        <el-main class="main-content">
          <component :is="activeComponent" />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed } from 'vue';
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
  TrendCharts
} from '@element-plus/icons-vue';
import AiScriptWriter from './components/AiScriptWriter.vue';
import ImageTools from './components/ImageTools.vue';
import VideoTools from './components/VideoTools.vue';
import AudioTools from './components/AudioTools.vue';
import AutoEditor from './components/AutoEditor.vue';
import CoverDesigner from './components/CoverDesigner.vue';
import VideoEditor from './components/VideoEditor.vue';
import VoiceSynthesizer from './components/VoiceSynthesizer.vue';
import PlatformPublisher from './components/PlatformPublisher.vue';
import AiImageGenerator from './components/AiImageGenerator.vue';
import HotTracker from './components/HotTracker.vue';
import StrategyManager from './components/StrategyManager.vue';
import PluginMarket from './components/PluginMarket.vue';

// --- State for Collapsible Sidebar ---
const isCollapsed = ref(false);
const asideWidth = computed(() => (isCollapsed.value ? '65px' : '200px'));
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// --- State for View Switching ---
const PlaceholderComponent = {
  template: `
    <el-card class="welcome-card">
      <h2>功能正在开发中...</h2>
      <p>敬请期待！</p>
    </el-card>
  `
};
const activeComponent = shallowRef(AiScriptWriter);
const componentMap = {
  'ai-script-writer': AiScriptWriter,
  'image-tools': ImageTools,
  'video-tools': VideoTools,
  'audio-tools': AudioTools,
  'auto-editor': AutoEditor,
  'cover-designer': CoverDesigner,
  'video-editor': VideoEditor,
  'voice-synthesizer': VoiceSynthesizer,
  'platform-publisher': PlatformPublisher,
  'ai-image-generator': AiImageGenerator,
  'hot-tracker': HotTracker,
  'strategy-management': StrategyManager,
  'plugin-market': PluginMarket,
};
const handleMenuSelect = (index) => {
  activeComponent.value = componentMap[index] || PlaceholderComponent;
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
