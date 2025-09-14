<template>
  <div class="plugin-purchase">
    <!-- 购买对话框 -->
    <el-dialog
      v-model="visible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleClose"
      class="purchase-dialog"
    >
      <div class="purchase-content">
        <!-- 插件信息 -->
        <div class="plugin-info" v-if="selectedPlugin">
          <div class="plugin-header">
            <div class="plugin-icon">
              <el-icon size="48" :color="selectedPlugin.color">
                <component :is="selectedPlugin.icon" />
              </el-icon>
            </div>
            <div class="plugin-details">
              <h3>{{ selectedPlugin.name }}</h3>
              <p class="plugin-description">{{ selectedPlugin.description }}</p>
              <div class="plugin-meta">
                <el-tag size="small" type="info">{{ selectedPlugin.category }}</el-tag>
                <span class="version">v{{ selectedPlugin.version }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 购买选项 -->
        <div class="purchase-options">
          <div class="option-tabs">
            <el-radio-group v-model="selectedPlan" class="plan-selector">
              <el-radio-button label="trial" v-if="!hasTrialUsed">
                <div class="plan-content">
                  <div class="plan-title">7天免费试用</div>
                  <div class="plan-price">¥0</div>
                  <div class="plan-features">
                    <span>• 完整功能体验</span>
                    <span>• 7天使用期限</span>
                  </div>
                </div>
              </el-radio-button>
              
              <el-radio-button label="monthly">
                <div class="plan-content">
                  <div class="plan-title">月度订阅</div>
                  <div class="plan-price">¥{{ selectedPlugin?.pricing?.monthly || 29 }}</div>
                  <div class="plan-features">
                    <span>• 完整功能访问</span>
                    <span>• 月度自动续费</span>
                  </div>
                </div>
              </el-radio-button>
              
              <el-radio-button label="yearly">
                <div class="plan-content">
                  <div class="plan-title">年度订阅</div>
                  <div class="plan-price">¥{{ selectedPlugin?.pricing?.yearly || 299 }}</div>
                  <div class="plan-discount">节省 {{ Math.round((1 - (selectedPlugin?.pricing?.yearly || 299) / ((selectedPlugin?.pricing?.monthly || 29) * 12)) * 100) }}%</div>
                  <div class="plan-features">
                    <span>• 完整功能访问</span>
                    <span>• 年度付费优惠</span>
                  </div>
                </div>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 功能对比 -->
        <div class="feature-comparison" v-if="selectedPlugin">
          <h4>功能对比</h4>
          <el-table :data="featureComparison" class="comparison-table">
            <el-table-column prop="feature" label="功能" width="200" />
            <el-table-column label="免费版" width="100" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.free" color="#67C23A"><Check /></el-icon>
                <el-icon v-else color="#F56C6C"><Close /></el-icon>
              </template>
            </el-table-column>
            <el-table-column label="付费版" width="100" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.premium" color="#67C23A"><Check /></el-icon>
                <el-icon v-else color="#F56C6C"><Close /></el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
        </div>

        <!-- 支付信息 -->
        <div class="payment-info" v-if="selectedPlan !== 'trial'">
          <h4>支付信息</h4>
          <div class="payment-summary">
            <div class="summary-item">
              <span>插件名称：</span>
              <span>{{ selectedPlugin?.name }}</span>
            </div>
            <div class="summary-item">
              <span>订阅类型：</span>
              <span>{{ getPlanLabel(selectedPlan) }}</span>
            </div>
            <div class="summary-item total">
              <span>总计：</span>
              <span class="price">¥{{ getCurrentPrice() }}</span>
            </div>
          </div>
        </div>

        <!-- 试用信息 -->
        <div class="trial-info" v-if="selectedPlan === 'trial'">
          <el-alert
            title="试用说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>• 试用期为7天，从激活时开始计算</p>
              <p>• 试用期间可使用所有付费功能</p>
              <p>• 试用结束后需要购买正式版本继续使用</p>
              <p>• 每个插件只能试用一次</p>
            </template>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button 
            type="primary" 
            @click="handlePurchase"
            :loading="purchasing"
            :disabled="!selectedPlan"
          >
            {{ getPurchaseButtonText() }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 支付成功对话框 -->
    <el-dialog
      v-model="successVisible"
      title="购买成功"
      width="400px"
      :show-close="false"
      class="success-dialog"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon size="64" color="#67C23A"><SuccessFilled /></el-icon>
        </div>
        <h3>{{ successTitle }}</h3>
        <p>{{ successMessage }}</p>
      </div>
      
      <template #footer>
        <el-button type="primary" @click="handleSuccessClose">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, SuccessFilled } from '@element-plus/icons-vue'
import { pluginService } from '../services/pluginService.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  plugin: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'purchase-success'])

// 响应式数据
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const selectedPlugin = ref(null)
const selectedPlan = ref('trial')
const purchasing = ref(false)
const successVisible = ref(false)
const successTitle = ref('')
const successMessage = ref('')

// 计算属性
const dialogTitle = computed(() => {
  return selectedPlugin.value ? `购买 ${selectedPlugin.value.name}` : '购买插件'
})

const hasTrialUsed = computed(() => {
  if (!selectedPlugin.value) return false
  return pluginService.hasUsedTrial(selectedPlugin.value.id)
})

const featureComparison = computed(() => {
  if (!selectedPlugin.value) return []
  
  const features = [
    {
      feature: '基础功能',
      free: true,
      premium: true,
      description: '核心功能访问'
    },
    {
      feature: '高级功能',
      free: false,
      premium: true,
      description: '专业级功能和工具'
    },
    {
      feature: '使用限制',
      free: true,
      premium: false,
      description: '免费版有使用次数限制'
    },
    {
      feature: '技术支持',
      free: false,
      premium: true,
      description: '优先技术支持服务'
    },
    {
      feature: '定期更新',
      free: true,
      premium: true,
      description: '功能更新和bug修复'
    }
  ]
  
  return features
})

// 方法
const getCurrentPrice = () => {
  if (!selectedPlugin.value || selectedPlan.value === 'trial') return 0
  
  const pricing = selectedPlugin.value.pricing || {}
  switch (selectedPlan.value) {
    case 'monthly':
      return pricing.monthly || 29
    case 'yearly':
      return pricing.yearly || 299
    default:
      return 0
  }
}

const getPlanLabel = (plan) => {
  switch (plan) {
    case 'trial':
      return '7天免费试用'
    case 'monthly':
      return '月度订阅'
    case 'yearly':
      return '年度订阅'
    default:
      return '未知'
  }
}

const getPurchaseButtonText = () => {
  if (purchasing.value) return '处理中...'
  
  switch (selectedPlan.value) {
    case 'trial':
      return '开始试用'
    case 'monthly':
    case 'yearly':
      return `立即购买 ¥${getCurrentPrice()}`
    default:
      return '确认购买'
  }
}

const handlePurchase = async () => {
  if (!selectedPlugin.value || !selectedPlan.value) {
    ElMessage.warning('请选择购买方案')
    return
  }
  
  purchasing.value = true
  
  try {
    let result
    
    if (selectedPlan.value === 'trial') {
      // 开始试用
      result = await pluginService.startTrial(selectedPlugin.value.id)
      successTitle.value = '试用开始'
      successMessage.value = `${selectedPlugin.value.name} 试用期已激活，有效期7天。`
    } else {
      // 购买插件
      result = await pluginService.purchasePlugin(
        selectedPlugin.value.id, 
        selectedPlan.value,
        getCurrentPrice()
      )
      successTitle.value = '购买成功'
      successMessage.value = `${selectedPlugin.value.name} 已成功购买，感谢您的支持！`
    }
    
    if (result.success) {
      visible.value = false
      successVisible.value = true
      emit('purchase-success', {
        plugin: selectedPlugin.value,
        plan: selectedPlan.value,
        result
      })
    } else {
      ElMessage.error(result.error || '购买失败，请重试')
    }
  } catch (error) {
    console.error('购买失败:', error)
    ElMessage.error('购买失败，请重试')
  } finally {
    purchasing.value = false
  }
}

const handleClose = () => {
  if (purchasing.value) {
    ElMessage.warning('正在处理中，请稍候...')
    return
  }
  visible.value = false
}

const handleSuccessClose = () => {
  successVisible.value = false
}

// 监听插件变化
watch(() => props.plugin, (newPlugin) => {
  if (newPlugin) {
    selectedPlugin.value = newPlugin
    // 重置选择
    selectedPlan.value = hasTrialUsed.value ? 'monthly' : 'trial'
  }
}, { immediate: true })
</script>

<style scoped>
.plugin-purchase {
  /* 组件容器样式 */
}

.purchase-dialog {
  /* 对话框样式 */
}

.purchase-content {
  padding: 0;
}

.plugin-info {
  margin-bottom: 24px;
}

.plugin-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.plugin-icon {
  flex-shrink: 0;
}

.plugin-details h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.plugin-description {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.5;
}

.plugin-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version {
  font-size: 12px;
  color: #909399;
}

.purchase-options {
  margin-bottom: 24px;
}

.plan-selector {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

:deep(.el-radio-button) {
  width: 100%;
  margin: 0;
}

:deep(.el-radio-button__inner) {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  text-align: left;
  border: 2px solid #e4e7ed;
  background: #fff;
  transition: all 0.2s;
}

:deep(.el-radio-button__inner:hover) {
  border-color: #409eff;
}

:deep(.el-radio-button.is-active .el-radio-button__inner) {
  border-color: #409eff;
  background: #f0f9ff;
  color: #303133;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plan-price {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

.plan-discount {
  font-size: 12px;
  color: #67c23a;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
}

.plan-features span {
  font-size: 12px;
  color: #606266;
}

.feature-comparison {
  margin-bottom: 24px;
}

.feature-comparison h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.comparison-table {
  width: 100%;
}

.payment-info,
.trial-info {
  margin-bottom: 24px;
}

.payment-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.payment-summary {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item.total {
  font-weight: 600;
  font-size: 16px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #e4e7ed;
}

.price {
  color: #409eff;
  font-size: 18px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.success-dialog {
  text-align: center;
}

.success-content {
  padding: 20px;
  text-align: center;
}

.success-icon {
  margin-bottom: 16px;
}

.success-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.success-content p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto;
  }
  
  .plugin-header {
    flex-direction: column;
    text-align: center;
  }
  
  .plan-selector {
    gap: 8px;
  }
  
  :deep(.el-radio-button__inner) {
    padding: 12px;
  }
}
</style>