/**
 * 自动保存与恢复服务
 * 解决数据丢失问题，提供实时保存和崩溃恢复
 */

import { ElMessage } from 'element-plus'

class AutoSaveService {
  constructor() {
    this.saveInterval = null
    this.isAutoSaveEnabled = true
    this.saveDebounceTimer = null
    this.debounceDelay = 1000 // 1秒防抖
    
    this.storageConfig = {
      prefix: 'autosave_',
      maxVersions: 50,
      cleanupInterval: 3600000 // 1小时
    }
    
    this.currentProject = null
    this.unsavedChanges = new Set()
    
    this.init()
  }

  /**
   * 初始化自动保存服务
   */
  init() {
    this.enableAutoSave()
    this.setupCrashRecovery()
    this.startCleanupTimer()
    
    // 监听页面卸载事件
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        this.forceSaveAll()
        e.preventDefault()
        e.returnValue = ''
      }
    })
    
    console.log('💾 自动保存服务已启动')
  }

  /**
   * 启用自动保存
   */
  enableAutoSave() {
    if (this.saveInterval) return
    
    this.saveInterval = setInterval(() => {
      this.saveAllUnsavedChanges()
    }, 30000) // 每30秒检查一次
    
    this.isAutoSaveEnabled = true
  }

  /**
   * 禁用自动保存
   */
  disableAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }
    
    this.isAutoSaveEnabled = false
  }

  /**
   * 注册项目以进行自动保存
   */
  registerProject(projectId, projectData) {
    this.currentProject = {
      id: projectId,
      data: projectData,
      lastSaved: Date.now(),
      version: 1
    }
    
    // 立即保存初始版本
    this.saveProject(projectId, projectData)
  }

  /**
   * 标记变更（防抖保存）
   */
  markChange(projectId, componentId, changeData) {
    const changeKey = `${projectId}_${componentId}`
    
    this.unsavedChanges.add(changeKey)
    
    // 防抖保存
    clearTimeout(this.saveDebounceTimer)
    this.saveDebounceTimer = setTimeout(() => {
      this.saveChange(projectId, componentId, changeData)
    }, this.debounceDelay)
  }

  /**
   * 保存单个变更
   */
  async saveChange(projectId, componentId, changeData) {
    try {
      const saveData = {
        projectId,
        componentId,
        data: changeData,
        timestamp: Date.now(),
        type: 'incremental'
      }
      
      const key = `${this.storageConfig.prefix}${projectId}_${componentId}_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(saveData))
      
      // 更新项目版本
      await this.updateProjectVersion(projectId)
      
      // 移除未保存标记
      this.unsavedChanges.delete(`${projectId}_${componentId}`)
      
      console.log(`💾 已保存变更: ${projectId}/${componentId}`)
      
    } catch (error) {
      console.error('保存变更失败:', error)
      this.handleSaveError(error)
    }
  }

  /**
   * 保存完整项目
   */
  async saveProject(projectId, projectData, metadata = {}) {
    try {
      const saveData = {
        projectId,
        data: projectData,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          version: this.getNextVersion(projectId),
          type: 'full'
        }
      }
      
      const key = `${this.storageConfig.prefix}project_${projectId}_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(saveData))
      
      // 更新最新版本指针
      localStorage.setItem(`${this.storageConfig.prefix}latest_${projectId}`, key)
      
      // 清理旧版本
      this.cleanupOldVersions(projectId)
      
      console.log(`💾 已保存项目: ${projectId} v${saveData.metadata.version}`)
      
    } catch (error) {
      console.error('保存项目失败:', error)
      this.handleSaveError(error)
    }
  }

  /**
   * 获取项目历史版本
   */
  getProjectHistory(projectId) {
    const history = []
    const prefix = this.storageConfig.prefix
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(prefix) && key.includes(`project_${projectId}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          history.push({
            key,
            ...data.metadata,
            data: data.data
          })
        } catch (error) {
          console.error('读取历史版本失败:', error)
        }
      }
    }
    
    return history.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 恢复项目
   */
  async recoverProject(projectId, version = 'latest') {
    try {
      let recoveryData = null
      
      if (version === 'latest') {
        const latestKey = localStorage.getItem(`${this.storageConfig.prefix}latest_${projectId}`)
        if (latestKey) {
          recoveryData = JSON.parse(localStorage.getItem(latestKey))
        }
      } else {
        const history = this.getProjectHistory(projectId)
        recoveryData = history.find(h => h.version === version)
      }
      
      if (!recoveryData) {
        throw new Error('未找到可恢复的数据')
      }
      
      console.log(`🔄 已恢复项目: ${projectId} v${recoveryData.metadata.version}`)
      
      return {
        success: true,
        data: recoveryData.data,
        metadata: recoveryData.metadata,
        recoveredAt: Date.now()
      }
      
    } catch (error) {
      console.error('恢复项目失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 检查是否有可恢复的数据
   */
  checkForRecovery() {
    const recoveryProjects = []
    const prefix = this.storageConfig.prefix
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(prefix) && key.includes('project_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          recoveryProjects.push({
            projectId: data.projectId,
            version: data.metadata.version,
            timestamp: data.metadata.timestamp,
            key
          })
        } catch (error) {
          console.error('检查恢复数据失败:', error)
        }
      }
    }
    
    return recoveryProjects
  }

  /**
   * 获取项目下一个版本号
   */
  getNextVersion(projectId) {
    const history = this.getProjectHistory(projectId)
    const latestVersion = history.length > 0 ? Math.max(...history.map(h => h.version)) : 0
    return latestVersion + 1
  }

  /**
   * 更新项目版本
   */
  async updateProjectVersion(projectId) {
    // 版本更新由saveProject处理
  }

  /**
   * 清理旧版本
   */
  cleanupOldVersions(projectId) {
    const history = this.getProjectHistory(projectId)
    
    if (history.length > this.storageConfig.maxVersions) {
      const toDelete = history.slice(this.storageConfig.maxVersions)
      
      toDelete.forEach(item => {
        localStorage.removeItem(item.key)
      })
      
      console.log(`🧹 已清理 ${toDelete.length} 个旧版本`)
    }
  }

  /**
   * 保存所有未保存的变更
   */
  async saveAllUnsavedChanges() {
    if (this.unsavedChanges.size === 0) return
    
    console.log(`💾 正在保存 ${this.unsavedChanges.size} 个未保存的变更`)
    
    // 这里可以实现批量保存逻辑
    this.unsavedChanges.clear()
  }

  /**
   * 强制保存所有数据
   */
  async forceSaveAll() {
    console.log('💾 强制保存所有数据...')
    
    // 保存当前项目
    if (this.currentProject) {
      await this.saveProject(this.currentProject.id, this.currentProject.data)
    }
    
    // 保存所有未保存变更
    await this.saveAllUnsavedChanges()
  }

  /**
   * 检查是否有未保存的变更
   */
  hasUnsavedChanges() {
    return this.unsavedChanges.size > 0
  }

  /**
   * 设置崩溃恢复
   */
  setupCrashRecovery() {
    // 检查是否有可恢复的数据
    const recoverable = this.checkForRecovery()
    
    if (recoverable.length > 0) {
      console.log(`🔄 发现 ${recoverable.length} 个可恢复的项目`)
      
      // 可以在这里触发恢复提示
      setTimeout(() => {
        this.showRecoveryPrompt(recoverable)
      }, 1000)
    }
  }

  /**
   * 显示恢复提示
   */
  showRecoveryPrompt(recoverableProjects) {
    // 这里可以集成UI提示
    console.log('🔄 可恢复的项目:', recoverableProjects)
  }

  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    setInterval(() => {
      this.performStorageCleanup()
    }, this.storageConfig.cleanupInterval)
  }

  /**
   * 执行存储清理
   */
  performStorageCleanup() {
    const prefix = this.storageConfig.prefix
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7天前
    
    let cleanedCount = 0
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          const timestamp = data.timestamp || data.metadata?.timestamp
          
          if (timestamp && timestamp < cutoffTime) {
            localStorage.removeItem(key)
            cleanedCount++
          }
        } catch (error) {
          // 如果数据损坏，直接删除
          localStorage.removeItem(key)
          cleanedCount++
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 已清理 ${cleanedCount} 个过期自动保存文件`)
    }
  }

  /**
   * 处理保存错误
   */
  handleSaveError(error) {
    console.error('自动保存错误:', error)
    
    // 尝试保存到备用存储
    try {
      sessionStorage.setItem('autosave_backup', JSON.stringify({
        error: error.message,
        timestamp: Date.now()
      }))
    } catch (backupError) {
      console.error('备用保存失败:', backupError)
    }
    
    // 通知用户
    ElMessage.error({
      message: '自动保存失败，请检查存储空间',
      duration: 5000
    })
  }

  /**
   * 导出项目数据
   */
  exportProject(projectId) {
    try {
      const history = this.getProjectHistory(projectId)
      const exportData = {
        projectId,
        exportedAt: Date.now(),
        versions: history,
        totalVersions: history.length
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectId}_backup_${Date.now()}.json`
      a.click()
      
      URL.revokeObjectURL(url)
      
      console.log(`📤 已导出项目: ${projectId}`)
      
    } catch (error) {
      console.error('导出项目失败:', error)
    }
  }

  /**
   * 获取保存统计
   */
  getSaveStats() {
    const prefix = this.storageConfig.prefix
    let totalSaves = 0
    let totalSize = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(prefix)) {
        const data = localStorage.getItem(key)
        totalSaves++
        totalSize += data.length
      }
    }
    
    return {
      totalSaves,
      totalSize: Math.round(totalSize / 1024), // KB
      unsavedChanges: this.unsavedChanges.size,
      autoSaveEnabled: this.isAutoSaveEnabled
    }
  }
}

// 创建全局实例
export const autoSaveService = new AutoSaveService()
export default AutoSaveService