<template>
  <div class="dashboard">
    <h1 class="dashboard-title">功能总览</h1>
    <p class="dashboard-subtitle">点击下方卡片，快速开始您的创作之旅。</p>
    
    <div v-for="(group, groupIndex) in featureGroups" :key="groupIndex">
      <h2 class="group-title">{{ group.name }}</h2>
      <el-row :gutter="20">
        <el-col :span="6" v-for="feature in group.features" :key="feature.key">
          <el-card class="feature-card" shadow="hover" @click="navigateTo(feature.key)">
            <div class="feature-card-content">
              <el-icon :size="28" class="feature-icon"><component :is="feature.icon" /></el-icon>
              <span class="feature-name">{{ feature.name }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { 
  Cpu, Picture, Microphone, MagicStick, 
  VideoCamera, VideoPlay, Headset, Scissor, EditPen, Postcard,
  TrendCharts, DataLine, Star, Upload,
  Setting, Grid, Monitor, Operation
} from '@element-plus/icons-vue';

const emit = defineEmits(['navigate']);

const navigateTo = (key) => {
  emit('navigate', key);
};

const featureGroups = [
  {
    name: '内容创作',
    features: [
      { key: 'ai-script-writer', name: 'AI 写作', icon: 'Edit' },
      { key: 'content-optimizer', name: '爆款优化', icon: 'MagicStick' },
      { key: 'ai-image-generator', name: 'AI 绘图', icon: 'Picture' },
      { key: 'voice-synthesizer', name: '语音合成', icon: 'Microphone' },
    ]
  },
  {
    name: '媒体处理',
    features: [
      { key: 'image-tools', name: '图片处理', icon: 'Picture' },
      { key: 'video-tools', name: '视频处理', icon: 'VideoPlay' },
      { key: 'audio-tools', name: '音频处理', icon: 'Headset' },
      { key: 'auto-editor', name: '智能剪辑', icon: 'Scissor' },
      { key: 'video-editor', name: '专业剪辑', icon: 'EditPen' },
      { key: 'cover-designer', name: '封面设计', icon: 'Postcard' },
    ]
  },
  {
    name: '运营工具',
    features: [
      { key: 'strategy-management', name: '内容策略', icon: 'DataLine' },
      { key: 'hot-tracker', name: '热点追踪', icon: 'TrendCharts' },
      { key: 'smart-recommendations', name: '智能推荐', icon: 'Star' },
      { key: 'platform-publisher', name: '一键发布', icon: 'Upload' },
    ]
  },
  {
    name: '系统管理',
    features: [
      { key: 'plugin-market', name: '插件中心', icon: 'Grid' },
      { key: 'analytics-dashboard', name: '数据分析', icon: 'TrendCharts' },
      { key: 'cache-manager', name: '性能优化', icon: 'Monitor' },
      { key: 'feature-manager', name: '功能设置', icon: 'Operation' },
    ]
  }
];
</script>

<style scoped>
.dashboard {
  padding: 10px;
}
.dashboard-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}
.dashboard-subtitle {
  font-size: 16px;
  color: var(--text-color-secondary);
  margin-bottom: 30px;
}
.group-title {
  font-size: 20px;
  margin-bottom: 15px;
  border-left: 4px solid var(--accent-color);
  padding-left: 10px;
}
.feature-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}
.feature-card-content {
  display: flex;
  align-items: center;
  padding: 15px;
}
.feature-icon {
  margin-right: 15px;
  color: var(--accent-color);
}
.feature-name {
  font-size: 16px;
  font-weight: 500;
}
</style>
