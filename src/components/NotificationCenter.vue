<template>
  <div class="notification-center">
    <el-popover
      placement="bottom-end"
      :width="400"
      trigger="click"
      popper-class="notification-popover"
    >
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <el-button circle :icon="Bell" />
        </el-badge>
      </template>
      
      <div class="notification-panel">
        <div class="notification-header">
          <h3>通知中心</h3>
          <el-button type="text" @click="markAllRead">全部已读</el-button>
        </div>
        
        <div class="notification-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            :class="['notification-item', { 'unread': !notification.read }]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              <el-icon :style="{ color: notification.type === 'success' ? '#67C23A' : notification.type === 'warning' ? '#E6A23C' : '#409EFF' }">
                <component :is="getIcon(notification.type)" />
              </el-icon>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.time) }}</div>
            </div>
            <div class="notification-actions">
              <el-button 
                v-if="!notification.read" 
                type="text" 
                @click.stop="markAsRead(notification.id)"
              >
                已读
              </el-button>
            </div>
          </div>
          
          <div v-if="notifications.length === 0" class="empty-notifications">
            <el-empty description="暂无新通知" />
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, SuccessFilled, Warning, InfoFilled } from '@element-plus/icons-vue'

const notifications = ref([
  {
    id: 1,
    title: '热点更新',
    message: '发现新的热门话题：AI绘画工具对比',
    type: 'info',
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    action: 'open-hot-tracker'
  },
  {
    id: 2,
    title: 'AI优化完成',
    message: '您的最新视频标题已优化，点击率预计提升35%',
    type: 'success',
    time: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    action: 'open-strategy'
  },
  {
    id: 3,
    title: '策略提醒',
    message: '建议现在发布内容，当前为最佳发布时间',
    type: 'warning',
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    action: 'open-scheduler'
  }
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const getIcon = (type) => {
  const iconMap = {
    success: SuccessFilled,
    warning: Warning,
    info: InfoFilled
  }
  return iconMap[type] || InfoFilled
}

const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return time.toLocaleDateString()
}

const markAsRead = (id) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const handleNotificationClick = (notification) => {
  markAsRead(notification.id)
  
  // 根据通知类型执行相应操作
  switch (notification.action) {
    case 'open-hot-tracker':
      // 触发打开热点追踪器
      break
    case 'open-strategy':
      // 触发打开策略管理
      break
    case 'open-scheduler':
      // 触发打开发布计划器
      break
  }
}

// 实时通知系统
let notificationInterval

const startRealTimeNotifications = () => {
  // 模拟实时通知
  notificationInterval = setInterval(() => {
    const randomEvents = [
      {
        title: '新热点发现',
        message: '抖音新话题：#AI绘画教程 热度上升中',
        type: 'info',
        action: 'open-hot-tracker'
      },
      {
        title: '内容优化建议',
        message: '您的最新内容建议添加这些标签：AI工具, 教程',
        type: 'success',
        action: 'open-strategy'
      }
    ]
    
    if (Math.random() > 0.8) {
      const event = randomEvents[Math.floor(Math.random() * randomEvents.length)]
      addNotification(event)
    }
  }, 30000) // 每30秒检查一次
}

const addNotification = (event) => {
  notifications.value.unshift({
    id: Date.now(),
    ...event,
    time: new Date(),
    read: false
  })
  
  // 保持最多20条通知
  if (notifications.value.length > 20) {
    notifications.value = notifications.value.slice(0, 20)
  }
}

onMounted(() => {
  startRealTimeNotifications()
})

onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
  }
})
</script>

<style scoped>
.notification-center {
  display: inline-block;
}

.notification-badge {
  cursor: pointer;
}

.notification-panel {
  max-height: 500px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-icon {
  margin-right: 12px;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.notification-message {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-time {
  color: #999;
  font-size: 12px;
}

.notification-actions {
  margin-left: 8px;
}

.empty-notifications {
  padding: 40px 0;
}
</style>