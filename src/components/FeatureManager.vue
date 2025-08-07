<template>
  <div class="feature-manager">
    <!-- 页面标题 -->
    <div class="manager-header">
      <h1>⚙️ 功能管理中心</h1>
      <p class="subtitle">管理所有高级功能的使用权限和配置</p>
    </div>

    <!-- 会员状态卡片 -->
    <div class="membership-card">
      <div class="membership-info">
        <div class="membership-icon">👑</div>
        <div class="membership-details">
          <h3>{{ membershipStatus.title }}</h3>
          <p>{{ membershipStatus.description }}</p>
          <div class="membership-features">
            <span v-for="feature in membershipStatus.features" :key="feature" class="feature-tag">
              {{ feature }}
            </span>
          </div>
        </div>
      </div>
      <div class="membership-actions">
        <el-button type="primary" size="large" @click="upgradeMembership">
          {{ membershipStatus.buttonText }}
        </el-button>
        <el-button type="text" @click="viewPricing">查看价格方案</el-button>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="features-section">
      <h3>🚀 可用功能列表</h3>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.id" 
             :class="['feature-card', { 'locked': !feature.enabled, 'popular': feature.popular }]">
          <div class="feature-header">
            <div class="feature-icon">{{ feature.icon }}</div>
            <div class="feature-status">
              <el-tag :type="feature.enabled ? 'success' : 'warning'" size="small">
                {{ feature.enabled ? '已启用' : '未启用' }}
              </el-tag>
              <el-tag v-if="feature.popular" type="danger" size="small" effect="dark">
                热门
              </el-tag>
            </div>
          </div>
          
          <div class="feature-content">
            <h4>{{ feature.name }}</h4>
            <p>{{ feature.description }}</p>
            <div class="feature-stats">
              <span>使用次数: {{ feature.usageCount }}</span>
              <span>节省时长: {{ feature.timeSaved }}分钟</span>
            </div>
          </div>
          
          <div class="feature-actions">
            <el-button 
              :type="feature.enabled ? 'primary' : 'default'" 
              size="small"
              @click="toggleFeature(feature)"
              :disabled="!feature.available">
              {{ feature.enabled ? '立即使用' : feature.available ? '启用功能' : '升级解锁' }}
            </el-button>
            <el-button type="text" size="small" @click="showFeatureDetails(feature)">
              详情
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用统计 -->
    <div class="usage-stats">
      <h3>📊 使用统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <h4>{{ totalUsage }}</h4>
          <p>总使用次数</p>
        </div>
        <div class="stat-card">
          <h4>{{ totalTimeSaved }}</h4>
          <p>总节省时间(分钟)</p>
        </div>
        <div class="stat-card">
          <h4>{{ favoriteFeature }}</h4>
          <p>最常用功能</p>
        </div>
        <div class="stat-card">
          <h4>{{ efficiencyScore }}</h4>
          <p>效率评分</p>
        </div>
      </div>
    </div>

    <!-- 功能详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="功能详情" width="600px">
      <div v-if="selectedFeature" class="feature-detail">
        <div class="detail-header">
          <div class="detail-icon">{{ selectedFeature.icon }}</div>
          <div>
            <h3>{{ selectedFeature.name }}</h3>
            <p>{{ selectedFeature.description }}</p>
          </div>
        </div>
        
        <div class="detail-content">
          <h4>功能特点</h4>
          <ul>
            <li v-for="benefit in selectedFeature.benefits" :key="benefit">
              {{ benefit }}
            </li>
          </ul>
          
          <h4>使用教程</h4>
          <div class="tutorial-steps">
            <div v-for="(step, index) in selectedFeature.tutorial" :key="index" class="step">
              <span class="step-number">{{ index + 1 }}</span>
              <span>{{ step }}</span>
            </div>
          </div>
          
          <h4>使用数据</h4>
          <div class="usage-data">
            <div class="data-item">
              <span>本周使用:</span>
              <strong>{{ selectedFeature.weeklyUsage }} 次</strong>
            </div>
            <div class="data-item">
              <span>节省时间:</span>
              <strong>{{ selectedFeature.weeklyTimeSaved }} 分钟</strong>
            </div>
            <div class="data-item">
              <span>效率提升:</span>
              <strong>{{ selectedFeature.efficiencyBoost }}%</strong>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const membershipStatus = ref({
  title: "高级会员",
  description: "享受所有高级功能，无限次使用",
  features: ["AI智能写作", "批量处理", "高级模板", "优先支持"],
  buttonText: "升级终身会员"
})

const features = ref([
  {
    id: 1,
    name: "AI智能写作",
    icon: "🤖",
    description: "基于AI的智能内容创作，支持多种风格和格式",
    enabled: true,
    available: true,
    popular: true,
    usageCount: 156,
    timeSaved: 2340,
    benefits: [
      "支持多种内容类型",
      "智能语义理解",
      "一键生成高质量内容",
      "支持自定义风格"
    ],
    tutorial: [
      "选择内容类型和主题",
      "设置参数和风格偏好",
      "点击生成获取AI建议",
      "编辑和完善最终内容"
    ],
    weeklyUsage: 23,
    weeklyTimeSaved: 345,
    efficiencyBoost: 85
  },
  {
    id: 2,
    name: "批量图片处理",
    icon: "🖼️",
    description: "一键批量处理图片，支持多种格式和效果",
    enabled: false,
    available: false,
    popular: true,
    usageCount: 0,
    timeSaved: 0,
    benefits: [
      "支持多种图片格式",
      "批量应用滤镜效果",
      "智能尺寸调整",
      "云端高速处理"
    ],
    tutorial: [
      "上传需要处理的图片",
      "选择处理效果和参数",
      "预览处理结果",
      "一键批量导出"
    ],
    weeklyUsage: 0,
    weeklyTimeSaved: 0,
    efficiencyBoost: 0
  },
  {
    id: 3,
    name: "热点追踪器",
    icon: "🔥",
    description: "实时监控各大平台热点，把握内容趋势",
    enabled: true,
    available: true,
    popular: false,
    usageCount: 89,
    timeSaved: 445,
    benefits: [
      "多平台实时监控",
      "智能趋势分析",
      "个性化推荐",
      "一键生成内容"
    ],
    tutorial: [
      "选择监控平台和关键词",
      "设置提醒频率",
      "查看热点报告",
      "基于热点创作内容"
    ],
    weeklyUsage: 12,
    weeklyTimeSaved: 60,
    efficiencyBoost: 65
  }
])

const detailDialogVisible = ref(false)
const selectedFeature = ref(null)

// 计算属性
const totalUsage = computed(() => 
  features.value.reduce((sum, f) => sum + f.usageCount, 0)
)

const totalTimeSaved = computed(() => 
  features.value.reduce((sum, f) => sum + f.timeSaved, 0)
)

const favoriteFeature = computed(() => {
  const maxUsage = Math.max(...features.value.map(f => f.usageCount))
  return features.value.find(f => f.usageCount === maxUsage)?.name || '暂无'
})

const efficiencyScore = computed(() => {
  const enabledFeatures = features.value.filter(f => f.enabled)
  const avgBoost = enabledFeatures.reduce((sum, f) => sum + f.efficiencyBoost, 0) / enabledFeatures.length
  return Math.round(avgBoost) || 0
})

// 方法
const toggleFeature = (feature) => {
  if (!feature.available) {
    ElMessage.warning('此功能需要升级会员才能使用')
    return
  }
  
  feature.enabled = !feature.enabled
  ElMessage.success(`${feature.name} ${feature.enabled ? '已启用' : '已禁用'}`)
}

const showFeatureDetails = (feature) => {
  selectedFeature.value = feature
  detailDialogVisible.value = true
}

const upgradeMembership = () => {
  ElMessageBox.confirm(
    '升级至终身会员，享受所有高级功能无限制使用！',
    '升级会员',
    {
      confirmButtonText: '立即升级',
      cancelButtonText: '稍后考虑',
      type: 'success'
    }
  ).then(() => {
    ElMessage.success('正在跳转到支付页面...')
  })
}

const viewPricing = () => {
  ElMessage.info('价格方案：\n高级会员：￥99/月\n终身会员：￥999/一次性')
}
</script>

<style scoped>
.feature-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.manager-header {
  text-align: center;
  margin-bottom: 40px;
}

.manager-header h1 {
  font-size: 32px;
  color: var(--text-color-primary);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: var(--text-color-secondary);
}

.membership-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.membership-info {
  display: flex;
  align-items: center;
}

.membership-icon {
  font-size: 48px;
  margin-right: 24px;
}

.membership-details h3 {
  font-size: 24px;
  margin: 0 0 8px 0;
}

.membership-details p {
  font-size: 16px;
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.membership-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.features-section h3 {
  margin: 0 0 24px 0;
  color: var(--text-color-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-card.locked {
  opacity: 0.7;
  background: #f5f7fa;
}

.feature-card.popular {
  border-color: #ff6b6b;
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.feature-icon {
  font-size: 36px;
}

.feature-status {
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: flex-end;
}

.feature-content h4 {
  margin: 0 0 8px 0;
  color: var(--text-color-primary);
}

.feature-content p {
  margin: 0 0 12px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.feature-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 16px;
}

.feature-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.usage-stats {
  margin-top: 40px;
}

.usage-stats h3 {
  margin: 0 0 24px 0;
  color: var(--text-color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--card-bg-color);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--card-shadow);
}

.stat-card h4 {
  font-size: 32px;
  margin: 0 0 8px 0;
  color: var(--text-color-primary);
}

.stat-card p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.feature-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.detail-icon {
  font-size: 48px;
  margin-right: 16px;
}

.detail-content h4 {
  margin: 24px 0 16px 0;
  color: var(--text-color-primary);
}

.detail-content ul {
  margin: 0 0 24px 0;
  padding-left: 20px;
}

.detail-content li {
  margin-bottom: 8px;
  color: var(--text-color-secondary);
}

.tutorial-steps {
  margin-bottom: 24px;
}

.step {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.step-number {
  background: #1890ff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 12px;
  font-weight: bold;
}

.usage-data {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .membership-card {
    flex-direction: column;
    text-align: center;
  }
  
  .membership-info {
    flex-direction: column;
    margin-bottom: 24px;
  }
  
  .membership-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }
}
</style>