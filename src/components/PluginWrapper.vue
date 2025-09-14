<template>
  <div class="plugin-wrapper">
    <!-- 插件可用时显示内容 -->
    <div v-if="isPluginAvailable && !showLimitReached" class="plugin-content">
      <component 
        :is="pluginComponent" 
        v-bind="$attrs"
        @plugin-action="handlePluginAction"
        :plugin-config="pluginConfig"
        :usage-stats="usageStats"
      />
    </div>

    <!-- 试用期警告 -->
    <div v-if="showTrialWarning" class="trial-warning">
      <el-alert
        :title="`${pluginInfo.name} 试用期警告`"
        :description="trialWarningMessage"
        type="warning"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="warning-actions">
            <el-button type="primary" size="small" @click="handlePurchase">
              立即购买
            </el-button>
            <el-button size="small" @click="dismissWarning">
              稍后提醒
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 使用限制达到 -->
    <div v-if="showLimitReached" class="limit-reached">
      <el-result
        icon="warning"
        :title="`${pluginInfo.name} 使用限制`"
        :sub-title="limitMessage"
      >
        <template #extra>
          <el-button v-if="pluginInfo.type === 'free'" type="primary" @click="handleUpgrade">
            升级到专业版
          </el-button>
          <el-button v-else type="primary" @click="handlePurchase">
            购买许可证
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 插件不可用 -->
    <div v-if="!isPluginAvailable && !showLimitReached" class="plugin-unavailable">
      <el-result
        icon="error"
        :title="`${pluginInfo.name} 不可用`"
        :sub-title="unavailableMessage"
      >
        <template #extra>
          <el-button v-if="licenseStatus.status === 'expired'" type="primary" @click="handleRenew">
            续费许可证
          </el-button>
          <el-button v-else-if="pluginInfo.type === 'premium'" type="primary" @click="handleStartTrial">
            开始试用
          </el-button>
          <el-button v-else @click="handleInstall">
            安装插件
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 购买对话框 -->
    <el-dialog
      v-model="showPurchaseDialog"
      title="购买插件许可证"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="purchase-content">
        <div class="plugin-info">
          <h3>{{ pluginInfo.name }}</h3>
          <p class="price">¥{{ pluginInfo.price }}</p>
          <ul class="features">
            <li v-for="feature in pluginInfo.features" :key="feature">
              <el-icon><Check /></el-icon>
              {{ feature }}
            </li>
          </ul>
        </div>
        
        <el-form :model="purchaseForm" label-width="100px">
          <el-form-item label="许可证密钥">
            <el-input
              v-model="purchaseForm.licenseKey"
              placeholder="请输入25位许可证密钥"
              maxlength="25"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showPurchaseDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPurchase" :loading="purchasing">
          确认购买
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import pluginService from '../services/pluginService.js';

export default {
  name: 'PluginWrapper',
  components: {
    Check
  },
  props: {
    pluginId: {
      type: String,
      required: true
    },
    pluginComponent: {
      type: [String, Object],
      required: true
    }
  },
  setup(props) {
    const pluginInfo = ref(null);
    const licenseStatus = ref(null);
    const usageStats = ref(null);
    const showPurchaseDialog = ref(false);
    const purchasing = ref(false);
    const warningDismissed = ref(false);
    
    const purchaseForm = ref({
      licenseKey: ''
    });

    // 计算属性
    const isPluginAvailable = computed(() => {
      return pluginService.isPluginAvailable(props.pluginId);
    });

    const showTrialWarning = computed(() => {
      return !warningDismissed.value && 
             licenseStatus.value?.needsWarning && 
             licenseStatus.value?.status === 'trial';
    });

    const showLimitReached = computed(() => {
      return isPluginAvailable.value && !pluginService.checkUsageLimit(props.pluginId);
    });

    const trialWarningMessage = computed(() => {
      if (!licenseStatus.value?.expiryDate) return '';
      const daysLeft = Math.ceil((new Date(licenseStatus.value.expiryDate) - new Date()) / (24 * 60 * 60 * 1000));
      return `试用期还有 ${daysLeft} 天到期，请及时购买许可证以继续使用完整功能。`;
    });

    const limitMessage = computed(() => {
      if (!pluginInfo.value?.limitations) return '';
      const { dailyUsage } = pluginInfo.value.limitations;
      return `今日使用次数已达上限 (${dailyUsage}次)，请明天再试或升级到专业版。`;
    });

    const unavailableMessage = computed(() => {
      if (!licenseStatus.value) return '插件未安装或许可证无效';
      
      switch (licenseStatus.value.status) {
        case 'expired':
          return '许可证已过期，请续费后继续使用';
        case 'invalid':
          return '许可证无效，请重新购买';
        default:
          return '插件暂时不可用';
      }
    });

    const pluginConfig = computed(() => {
      if (!pluginInfo.value) return {};
      
      return {
        type: pluginInfo.value.type,
        limitations: pluginInfo.value.limitations,
        features: pluginInfo.value.features,
        licenseStatus: licenseStatus.value
      };
    });

    // 方法
    const loadPluginData = () => {
      const availablePlugins = pluginService.getAvailablePlugins();
      pluginInfo.value = availablePlugins.find(p => p.id === props.pluginId);
      
      if (pluginInfo.value) {
        licenseStatus.value = pluginService.getLicenseStatus(props.pluginId);
        usageStats.value = pluginService.getUsageStats(props.pluginId);
      }
    };

    const handlePluginAction = (action) => {
      // 记录使用统计
      pluginService.recordUsage(props.pluginId, action);
      
      // 重新加载数据以更新使用统计
      loadPluginData();
    };

    const handlePurchase = () => {
      showPurchaseDialog.value = true;
    };

    const handleUpgrade = () => {
      // 查找对应的专业版插件
      const proPluginId = props.pluginId.replace('basic_', 'pro_');
      const availablePlugins = pluginService.getAvailablePlugins();
      const proPlugin = availablePlugins.find(p => p.id === proPluginId);
      
      if (proPlugin) {
        ElMessageBox.confirm(
          `是否升级到 ${proPlugin.name}？价格：¥${proPlugin.price}`,
          '升级插件',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }
        ).then(() => {
          // 安装专业版插件
          pluginService.installPlugin(proPluginId).then(() => {
            ElMessage.success('插件升级成功！');
            loadPluginData();
          }).catch(error => {
            ElMessage.error('升级失败：' + error.message);
          });
        });
      }
    };

    const handleStartTrial = async () => {
      try {
        await pluginService.startTrial(props.pluginId);
        ElMessage.success('试用期已开始，享受7天免费体验！');
        loadPluginData();
      } catch (error) {
        ElMessage.error('开始试用失败：' + error.message);
      }
    };

    const handleInstall = async () => {
      try {
        await pluginService.installPlugin(props.pluginId);
        ElMessage.success('插件安装成功！');
        loadPluginData();
      } catch (error) {
        ElMessage.error('安装失败：' + error.message);
      }
    };

    const handleRenew = () => {
      showPurchaseDialog.value = true;
    };

    const confirmPurchase = async () => {
      if (!purchaseForm.value.licenseKey) {
        ElMessage.warning('请输入许可证密钥');
        return;
      }

      purchasing.value = true;
      try {
        await pluginService.purchasePlugin(props.pluginId, purchaseForm.value.licenseKey);
        ElMessage.success('购买成功！插件已激活。');
        showPurchaseDialog.value = false;
        purchaseForm.value.licenseKey = '';
        loadPluginData();
      } catch (error) {
        ElMessage.error('购买失败：' + error.message);
      } finally {
        purchasing.value = false;
      }
    };

    const dismissWarning = () => {
      warningDismissed.value = true;
    };

    // 监听插件通知
    const handlePluginNotification = (event) => {
      const { detail } = event;
      if (detail.pluginId === props.pluginId) {
        if (detail.type === 'trial_expired') {
          ElMessage.error(detail.message);
          loadPluginData();
        } else if (detail.type === 'trial_warning') {
          ElMessage.warning(detail.message);
          warningDismissed.value = false;
          loadPluginData();
        }
      }
    };

    // 生命周期
    onMounted(() => {
      loadPluginData();
      window.addEventListener('plugin-notification', handlePluginNotification);
    });

    onUnmounted(() => {
      window.removeEventListener('plugin-notification', handlePluginNotification);
    });

    return {
      pluginInfo,
      licenseStatus,
      usageStats,
      isPluginAvailable,
      showTrialWarning,
      showLimitReached,
      trialWarningMessage,
      limitMessage,
      unavailableMessage,
      pluginConfig,
      showPurchaseDialog,
      purchasing,
      purchaseForm,
      handlePluginAction,
      handlePurchase,
      handleUpgrade,
      handleStartTrial,
      handleInstall,
      handleRenew,
      confirmPurchase,
      dismissWarning
    };
  }
};
</script>

<style scoped>
.plugin-wrapper {
  width: 100%;
  height: 100%;
}

.trial-warning {
  margin-bottom: 16px;
}

.warning-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.limit-reached,
.plugin-unavailable {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.purchase-content {
  padding: 20px 0;
}

.plugin-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #e6a23c;
  margin: 8px 0 16px 0;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: #606266;
}

.features li .el-icon {
  color: #67c23a;
}
</style>