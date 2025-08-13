/**
 * 内存监控与优化服务
 * 解决Electron应用内存泄漏和崩溃问题
 */

import { ElMessage } from 'element-plus'

class MemoryMonitor {
  constructor() {
    this.memoryThresholds = {
      warning: 500 * 1024 * 1024,  // 500MB
      critical: 800 * 1024 * 1024, // 800MB
      max: 1024 * 1024 * 1024      // 1GB
    }
    
    this.gcInterval = null
    this.memoryData = []
    this.maxHistorySize = 100
    this.isMonitoring = false
    
    // 内存泄漏检测
    this.leakDetector = {
      snapshots: [],
      threshold: 50 * 1024 * 1024, // 50MB增长视为泄漏
      interval: 60000 // 每分钟检查一次
    }
  }

  /**
   * 启动内存监控
   */
  startMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    // 定期收集内存数据 - 降低频率减少性能影响
    this.gcInterval = setInterval(() => {
      this.collectMemoryData()
      this.checkMemoryUsage()
    }, 10000) // 从5秒改为10秒
    
    // 内存泄漏检测 - 降低频率
    setInterval(() => {
      this.detectMemoryLeak()
    }, 30000) // 使用更长的间隔
    
    // 注册全局内存清理
    this.registerGlobalCleanup()
    
    console.log('🧠 内存监控已启动（优化版）')
  }

  /**
   * 停止内存监控
   */
  stopMonitoring() {
    this.isMonitoring = false
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval)
      this.gcInterval = null
    }
    
    console.log('🧠 内存监控已停止')
  }

  /**
   * 收集当前内存使用情况
   */
  collectMemoryData() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      const timestamp = Date.now()
      
      const dataPoint = {
        timestamp,
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      }
      
      this.memoryData.push(dataPoint)
      
      // 限制历史数据大小
      if (this.memoryData.length > this.maxHistorySize) {
        this.memoryData.shift()
      }
      
      return dataPoint
    }
    
    return null
  }

  /**
   * 检查内存使用情况并触发警告
   */
  checkMemoryUsage() {
    const memData = this.collectMemoryData()
    if (!memData) return
    
    const currentUsage = memData.heapUsed
    
    if (currentUsage >= this.memoryThresholds.max) {
      this.triggerCriticalAlert(currentUsage)
    } else if (currentUsage >= this.memoryThresholds.critical) {
      this.triggerCriticalCleanup(currentUsage)
    } else if (currentUsage >= this.memoryThresholds.warning) {
      this.triggerWarning(currentUsage)
    }
  }

  /**
   * 内存泄漏检测
   */
  detectMemoryLeak() {
    const memData = this.collectMemoryData()
    if (!memData) return
    
    this.leakDetector.snapshots.push({
      timestamp: Date.now(),
      heapUsed: memData.heapUsed,
      heapTotal: memData.heapTotal
    })
    
    // 保留最近10个快照
    if (this.leakDetector.snapshots.length > 10) {
      this.leakDetector.snapshots.shift()
    }
    
    // 检测内存增长趋势
    if (this.leakDetector.snapshots.length >= 5) {
      const recent = this.leakDetector.snapshots.slice(-5)
      const initial = recent[0].heapUsed
      const latest = recent[recent.length - 1].heapUsed
      
      if ((latest - initial) > this.leakDetector.threshold) {
        this.triggerLeakAlert(latest - initial)
      }
    }
  }

  /**
   * 触发内存警告
   */
  triggerWarning(usage) {
    const usageMB = Math.round(usage / 1024 / 1024)
    console.warn(`⚠️ 内存使用警告: ${usageMB}MB`)
    
    // 执行轻度清理
    this.performLightCleanup()
  }

  /**
   * 触发关键清理
   */
  triggerCriticalCleanup(usage) {
    const usageMB = Math.round(usage / 1024 / 1024)
    console.error(`🚨 内存使用临界: ${usageMB}MB，执行强制清理`)
    
    // 执行深度清理
    this.performDeepCleanup()
    
    // 通知用户
    ElMessage.warning({
      message: `内存使用过高(${usageMB}MB)，已自动清理缓存`,
      duration: 5000,
      type: 'warning'
    })
  }

  /**
   * 触发内存泄漏警告
   */
  triggerLeakAlert(leakSize) {
    const leakMB = Math.round(leakSize / 1024 / 1024)
    console.error(`🚨 检测到内存泄漏: ${leakMB}MB`)
    
    ElMessage.error({
      message: `检测到内存泄漏(${leakMB}MB)，请重启应用`,
      duration: 0,
      type: 'error',
      showClose: true
    })
  }

  /**
   * 触发内存耗尽警告
   */
  triggerCriticalAlert(usage) {
    const usageMB = Math.round(usage / 1024 / 1024)
    console.error(`💥 内存耗尽: ${usageMB}MB`)
    
    ElMessage.error({
      message: `内存耗尽(${usageMB}MB)，应用即将重启`,
      duration: 0,
      type: 'error',
      showClose: true
    })
    
    // 保存用户数据
    this.saveUserData()
    
    // 延迟重启
    setTimeout(() => {
      if (typeof require !== 'undefined') {
        const { app } = require('@electron/remote')
        app.relaunch()
        app.exit(0)
      }
    }, 3000)
  }

  /**
   * 轻度内存清理
   */
  performLightCleanup() {
    // 清理组件缓存
    if (typeof window !== 'undefined' && window.__VUE_COMPONENT_CACHE__) {
      Object.keys(window.__VUE_COMPONENT_CACHE__).forEach(key => {
        if (Date.now() - window.__VUE_COMPONENT_CACHE__[key].timestamp > 300000) {
          delete window.__VUE_COMPONENT_CACHE__[key]
        }
      })
    }
    
    // 清理图片缓存
    if (typeof window !== 'undefined' && window.__IMAGE_CACHE__) {
      const imageCache = window.__IMAGE_CACHE__
      Object.keys(imageCache).forEach(key => {
        if (Date.now() - imageCache[key].timestamp > 600000) {
          URL.revokeObjectURL(imageCache[key].url)
          delete imageCache[key]
        }
      })
    }
    
    // 强制垃圾回收（仅在Node.js环境中）
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }

  /**
   * 深度内存清理
   */
  performDeepCleanup() {
    // 执行轻度清理
    this.performLightCleanup()
    
    // 清理所有缓存
    if (window.__VUE_COMPONENT_CACHE__) {
      Object.keys(window.__VUE_COMPONENT_CACHE__).forEach(key => {
        delete window.__VUE_COMPONENT_CACHE__[key]
      })
    }
    
    if (window.__IMAGE_CACHE__) {
      const imageCache = window.__IMAGE_CACHE__
      Object.keys(imageCache).forEach(key => {
        URL.revokeObjectURL(imageCache[key].url)
        delete imageCache[key]
      })
    }
    
    // 清理localStorage中的临时数据
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('temp_') || key.includes('cache')) {
        localStorage.removeItem(key)
      }
    })
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc()
    }
  }

  /**
   * 注册全局内存清理事件
   */
  registerGlobalCleanup() {
    // 窗口失去焦点时清理
    window.addEventListener('blur', () => {
      setTimeout(() => this.performLightCleanup(), 1000)
    })
    
    // 页面卸载前清理
    window.addEventListener('beforeunload', () => {
      this.performDeepCleanup()
    })
    
    // 定期自动清理
    setInterval(() => {
      this.performLightCleanup()
    }, 300000) // 每5分钟
  }

  /**
   * 保存用户数据（在重启前）
   */
  saveUserData() {
    try {
      // 保存当前工作状态
      const state = {
        timestamp: Date.now(),
        memoryUsage: this.collectMemoryData(),
        activeProjects: window.__ACTIVE_PROJECTS__ || []
      }
      
      localStorage.setItem('crash_recovery', JSON.stringify(state))
    } catch (error) {
      console.error('保存用户数据失败:', error)
    }
  }

  /**
   * 获取当前内存使用情况
   */
  getMemoryUsage() {
    const memData = this.collectMemoryData()
    if (!memData) return null
    
    return {
      used: memData.heapUsed,
      total: memData.heapTotal,
      external: memData.external,
      percentage: Math.round((memData.heapUsed / memData.heapTotal) * 100)
    }
  }

  /**
   * 获取内存使用统计
   */
  getMemoryStats() {
    const memData = this.collectMemoryData()
    if (!memData) return null
    
    return {
      current: {
        used: Math.round(memData.heapUsed / 1024 / 1024),
        total: Math.round(memData.heapTotal / 1024 / 1024)
      },
      trend: this.memoryData.length > 1 ? this.calculateTrend() : null,
      leakDetected: this.detectMemoryLeakSilent()
    }
  }

  /**
   * 计算内存使用趋势
   */
  calculateTrend() {
    if (this.memoryData.length < 2) return null
    
    const recent = this.memoryData.slice(-10)
    const initial = recent[0].heapUsed
    const latest = recent[recent.length - 1].heapUsed
    
    return {
      direction: latest > initial ? 'increasing' : 'decreasing',
      rate: Math.abs(latest - initial) / 1024 / 1024,
      percentage: ((latest - initial) / initial * 100).toFixed(1)
    }
  }

  /**
   * 静默内存泄漏检测
   */
  detectMemoryLeakSilent() {
    if (this.leakDetector.snapshots.length < 5) return false
    
    const recent = this.leakDetector.snapshots.slice(-5)
    const initial = recent[0].heapUsed
    const latest = recent[recent.length - 1].heapUsed
    
    return (latest - initial) > this.leakDetector.threshold
  }

  /**
   * 获取内存优化建议
   */
  getOptimizationTips() {
    const stats = this.getMemoryStats()
    if (!stats) return []
    
    const tips = []
    
    if (stats.current.used > 400) {
      tips.push('内存使用较高，建议重启应用')
    }
    
    if (stats.leakDetected) {
      tips.push('检测到内存泄漏，请检查大型组件的销毁')
    }
    
    if (stats.trend && stats.trend.direction === 'increasing') {
      tips.push(`内存使用量${stats.trend.percentage}%增长，建议清理缓存`)
    }
    
    return tips
  }
}

// 创建全局实例
export const memoryMonitor = new MemoryMonitor()
export default MemoryMonitor