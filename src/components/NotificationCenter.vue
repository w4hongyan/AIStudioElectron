<template>
  <div class="notification-center">
    <div class="notification-header">
      <h2>通知中心</h2>
      <div class="notification-stats">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-icon size="20"><Bell /></el-icon>
        </el-badge>
      </div>
      <div class="notification-actions">
        <el-button size="small" @click="markAllAsRead" :disabled="unreadCount === 0">全部已读</el-button>
        <el-button size="small" @click="clearAll" :disabled="notifications.length === 0">清空</el-button>
      </div>
    </div>

    <div class="notification-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部" name="all">
          <div class="notification-list">
            <div 
              v-for="notification in filteredNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 
                'unread': !notification.read,
                'plugin-notification': notification.category === 'plugin',
                'trial-notification': notification.type === 'trial_warning' || notification.type === 'trial_expired'
              }"
              @click="markAsRead(notification)"
            >
              <div class="notification-icon">
                <el-icon :color="getNotificationColor(notification.type)" size="24">
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>
              <div class="notification-body">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <div class="notification-meta">
                  <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
                  <el-tag v-if="notification.category" size="small" :type="getCategoryType(notification.category)">
                    {{ getCategoryLabel(notification.category) }}
                  </el-tag>
                </div>
              </div>
              <div class="notification-actions">
                <el-button 
                  v-if="notification.actionable" 
                  size="small" 
                  :type="getActionButtonType(notification.type)"
                  @click.stop="handleAction(notification)"
                >
                  {{ notification.actionText }}
                </el-button>
                <el-button 
                  size="small" 
                  text
                  @click.stop="dismissNotification(notification)"
                >
                  忽略
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="filteredNotifications.length === 0" class="empty-state">
            <el-empty description="暂无通知" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="插件" name="plugin">
          <div class="notification-list">
            <div 
              v-for="notification in pluginNotifications" 
              :key="notification.id"
              class="notification-item plugin-notification"
              :class="{ 'unread': !notification.read }"
            >
              <div class="notification-icon">
                <el-icon :color="getNotificationColor(notification.type)" size="24">
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>
              <div class="notification-body">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <div class="plugin-info" v-if="notification.pluginName">
                  <el-tag size="small" type="info">{{ notification.pluginName }}</el-tag>
                  <span v-if="notification.daysLeft" class="days-left">
                    剩余 {{ notification.daysLeft }} 天
                  </span>
                </div>
                <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
              </div>
              <div class="notification-actions">
                <el-button 
                  v-if="notification.actionable" 
                  size="small" 
                  :type="getActionButtonType(notification.type)"
                  @click.stop="handleAction(notification)"
                >
                  {{ notification.actionText }}
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="系统" name="system">
          <div class="notification-list">
            <div 
              v-for="notification in systemNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 'unread': !notification.read }"
            >
              <div class="notification-icon">
                <el-icon color="#409EFF" size="24"><Bell /></el-icon>
              </div>
              <div class="notification-body">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Bell, Warning, Success, Info, Clock, ShoppingCart, Refresh, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pluginService } from '../services/pluginService.js'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const notifications = ref([])
const activeTab = ref('all')

// 计算属性
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notifications.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }
  return notifications.value.filter(n => n.category === activeTab.value)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const pluginNotifications = computed(() => {
  return notifications.value.filter(n => n.category === 'plugin')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const systemNotifications = computed(() => {
  return notifications.value.filter(n => n.category === 'system')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// 方法
const addNotification = (notification) => {
  const newNotification = {
    id: Date.now() + Math.random(),
    timestamp: new Date(),
    read: false,
    category: 'system',
    actionable: false,
    ...notification
  }
  notifications.value.unshift(newNotification)
  
  // 限制通知数量
  if (notifications.value.length > 100) {
    notifications.value = notifications.value.slice(0, 100)
  }
}

const markAsRead = (notification) => {
  if (!notification.read) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  ElMessage.success('所有通知已标记为已读')
}

const clearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有通知吗？此操作不可撤销。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    notifications.value = []
    ElMessage.success('通知已清空')
  } catch {
    // 用户取消
  }
}

const dismissNotification = (notification) => {
  const index = notifications.value.findIndex(n => n.id === notification.id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const handleAction = async (notification) => {
  try {
    switch (notification.type) {
      case 'trial_warning':
      case 'trial_expired':
        // 跳转到插件市场购买页面
        router.push({
          path: '/plugin-market',
          query: { plugin: notification.pluginId }
        })
        break
      case 'plugin_update':
        // 更新插件
        await pluginService.updatePlugin(notification.pluginId)
        ElMessage.success('插件更新成功')
        break
      case 'plugin_install':
        // 安装插件
        await pluginService.installPlugin(notification.pluginId)
        ElMessage.success('插件安装成功')
        break
      default:
        if (notification.action && typeof notification.action === 'function') {
          notification.action()
        }
    }
    
    // 标记为已读
    markAsRead(notification)
  } catch (error) {
    console.error('处理通知操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success': return Success
    case 'warning': return Warning
    case 'trial_warning': return Clock
    case 'trial_expired': return Warning
    case 'plugin_update': return Refresh
    case 'plugin_install': return ShoppingCart
    case 'plugin_purchase': return Star
    case 'info': return Info
    default: return Bell
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return '#67C23A'
    case 'warning': return '#E6A23C'
    case 'trial_warning': return '#F56C6C'
    case 'trial_expired': return '#F56C6C'
    case 'plugin_update': return '#409EFF'
    case 'plugin_install': return '#409EFF'
    case 'plugin_purchase': return '#9C27B0'
    case 'info': return '#409EFF'
    default: return '#909399'
  }
}

const getActionButtonType = (type) => {
  switch (type) {
    case 'trial_warning':
    case 'trial_expired':
      return 'danger'
    case 'plugin_update':
    case 'plugin_install':
      return 'primary'
    case 'plugin_purchase':
      return 'warning'
    default:
      return 'primary'
  }
}

const getCategoryType = (category) => {
  switch (category) {
    case 'plugin': return 'primary'
    case 'system': return 'info'
    case 'update': return 'success'
    default: return 'info'
  }
}

const getCategoryLabel = (category) => {
  switch (category) {
    case 'plugin': return '插件'
    case 'system': return '系统'
    case 'update': return '更新'
    default: return '其他'
  }
}

const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return time.toLocaleDateString()
}

// 检查插件试用期状态
const checkPluginTrialStatus = async () => {
  try {
    const installedPlugins = await pluginService.getInstalledPlugins()
    
    for (const plugin of installedPlugins) {
      if (plugin.license === 'trial') {
        const daysLeft = pluginService.getTrialDaysLeft(plugin.id)
        
        if (daysLeft <= 0) {
          // 试用期已过期
          addNotification({
            type: 'trial_expired',
            category: 'plugin',
            title: '插件试用期已过期',
            message: `${plugin.name} 的试用期已结束，请购买正式版本以继续使用。`,
            pluginId: plugin.id,
            pluginName: plugin.name,
            actionable: true,
            actionText: '立即购买'
          })
        } else if (daysLeft <= 3) {
          // 试用期即将到期
          addNotification({
            type: 'trial_warning',
            category: 'plugin',
            title: '插件试用期即将到期',
            message: `${plugin.name} 的试用期还剩 ${daysLeft} 天，请及时购买正式版本。`,
            pluginId: plugin.id,
            pluginName: plugin.name,
            daysLeft: daysLeft,
            actionable: true,
            actionText: '立即购买'
          })
        }
      }
    }
  } catch (error) {
    console.error('检查插件试用期状态失败:', error)
  }
}

// 监听插件服务的通知事件
const setupPluginNotifications = () => {
  // 监听插件安装事件
  pluginService.on('plugin:installed', (plugin) => {
    addNotification({
      type: 'success',
      category: 'plugin',
      title: '插件安装成功',
      message: `${plugin.name} 已成功安装并可以使用。`,
      pluginId: plugin.id,
      pluginName: plugin.name
    })
  })
  
  // 监听插件卸载事件
  pluginService.on('plugin:uninstalled', (plugin) => {
    addNotification({
      type: 'info',
      category: 'plugin',
      title: '插件已卸载',
      message: `${plugin.name} 已从系统中移除。`,
      pluginId: plugin.id,
      pluginName: plugin.name
    })
  })
  
  // 监听插件更新事件
  pluginService.on('plugin:updated', (plugin) => {
    addNotification({
      type: 'success',
      category: 'plugin',
      title: '插件更新成功',
      message: `${plugin.name} 已更新到最新版本。`,
      pluginId: plugin.id,
      pluginName: plugin.name
    })
  })
  
  // 监听许可证变更事件
  pluginService.on('license:changed', (plugin) => {
    addNotification({
      type: 'success',
      category: 'plugin',
      title: '许可证已更新',
      message: `${plugin.name} 的许可证已成功更新。`,
      pluginId: plugin.id,
      pluginName: plugin.name
    })
  })
}

// 暴露方法给父组件
defineExpose({
  addNotification,
  checkPluginTrialStatus
})

// 组件挂载时初始化
onMounted(async () => {
  // 设置插件通知监听
  setupPluginNotifications()
  
  // 检查插件试用期状态
  await checkPluginTrialStatus()
  
  // 添加欢迎通知
  addNotification({
    type: 'info',
    category: 'system',
    title: '欢迎使用AI Studio',
    message: '感谢您使用我们的产品，祝您使用愉快！插件中心现已支持试用和购买功能。'
  })
  
  // 定期检查试用期状态（每小时检查一次）
  setInterval(checkPluginTrialStatus, 60 * 60 * 1000)
})
</script>

<style scoped>
.notification-center {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.notification-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.notification-stats {
  display: flex;
  align-items: center;
  margin: 0 16px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-content {
  flex: 1;
  overflow: hidden;
  background: #fff;
}

.notification-list {
  height: 100%;
  overflow-y: auto;
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #f8f9fa;
  transform: translateX(2px);
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 20px;
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.notification-item.plugin-notification {
  border-left-color: #9C27B0;
}

.notification-item.plugin-notification.unread {
  background-color: #faf5ff;
  border-left-color: #9C27B0;
}

.notification-item.plugin-notification.unread::before {
  background: #9C27B0;
}

.notification-item.trial-notification {
  border-left-color: #F56C6C;
  background-color: #fef0f0;
}

.notification-item.trial-notification.unread::before {
  background: #F56C6C;
}

.notification-icon {
  margin-right: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-body h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.notification-body p {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 8px 0;
  word-break: break-word;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.notification-time {
  font-size: 11px;
  color: #909399;
}

.plugin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
}

.days-left {
  font-size: 12px;
  color: #F56C6C;
  font-weight: 500;
  background: #fef0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* Tab样式优化 */
:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0;
}

:deep(.el-tabs__item) {
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs__content) {
  padding: 0;
  height: calc(100% - 48px);
}

:deep(.el-tab-pane) {
  height: 100%;
}

/* 滚动条样式 */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-header {
    padding: 16px;
    flex-direction: column;
    gap: 12px;
  }
  
  .notification-header h2 {
    font-size: 16px;
  }
  
  .notification-item {
    padding: 12px 16px;
  }
  
  .notification-actions {
    flex-direction: row;
    gap: 8px;
  }
  
  :deep(.el-tabs__header) {
    padding: 0 16px;
  }
}
</style>