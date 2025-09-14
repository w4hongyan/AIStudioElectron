import { PLUGIN_CONFIG, LICENSE_RULES } from '../config/pluginSystem.config.js';

class PluginService {
  constructor() {
    this.installedPlugins = new Map();
    this.pluginLicenses = new Map();
    this.usageStats = new Map();
    this.eventListeners = new Map();
    this.init();
  }
  
  // 事件发射器方法
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器执行失败 [${event}]:`, error);
        }
      });
    }
  }

  // 初始化插件系统
  async init() {
    await this.loadInstalledPlugins();
    await this.loadLicenses();
    this.startTrialMonitoring();
  }

  // 加载已安装的插件
  async loadInstalledPlugins() {
    try {
      const stored = localStorage.getItem('installed_plugins');
      if (stored) {
        const plugins = JSON.parse(stored);
        plugins.forEach(plugin => {
          this.installedPlugins.set(plugin.id, plugin);
        });
      }
      
      // 默认安装免费插件
      const freePlugins = PLUGIN_CONFIG.DEFAULT_PLUGINS.filter(p => p.type === 'free');
      freePlugins.forEach(plugin => {
        if (!this.installedPlugins.has(plugin.id)) {
          this.installedPlugins.set(plugin.id, {
            ...plugin,
            installedAt: new Date().toISOString(),
            enabled: true
          });
        }
      });
      
      await this.saveInstalledPlugins();
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
    }
  }

  // 加载许可证信息
  async loadLicenses() {
    try {
      const stored = localStorage.getItem('plugin_licenses');
      if (stored) {
        const licenses = JSON.parse(stored);
        Object.entries(licenses).forEach(([pluginId, license]) => {
          this.pluginLicenses.set(pluginId, license);
        });
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
    }
  }

  // 保存已安装插件
  async saveInstalledPlugins() {
    try {
      const plugins = Array.from(this.installedPlugins.values());
      localStorage.setItem('installed_plugins', JSON.stringify(plugins));
    } catch (error) {
      console.error('Failed to save installed plugins:', error);
    }
  }

  // 保存许可证信息
  async saveLicenses() {
    try {
      const licenses = Object.fromEntries(this.pluginLicenses);
      localStorage.setItem('plugin_licenses', JSON.stringify(licenses));
    } catch (error) {
      console.error('Failed to save licenses:', error);
    }
  }

  // 获取所有可用插件
  getAvailablePlugins() {
    return PLUGIN_CONFIG.DEFAULT_PLUGINS.map(plugin => ({
      ...plugin,
      installed: this.installedPlugins.has(plugin.id),
      licenseStatus: this.getLicenseStatus(plugin.id)
    }));
  }

  // 获取已安装插件
  getInstalledPlugins() {
    return Array.from(this.installedPlugins.values()).map(plugin => ({
      ...plugin,
      licenseStatus: this.getLicenseStatus(plugin.id),
      usageStats: this.getUsageStats(plugin.id)
    }));
  }

  // 安装插件
  async installPlugin(pluginId) {
    const plugin = PLUGIN_CONFIG.DEFAULT_PLUGINS.find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    if (this.installedPlugins.has(pluginId)) {
      throw new Error('Plugin already installed');
    }

    // 安装插件
    const installedPlugin = {
      ...plugin,
      installedAt: new Date().toISOString(),
      enabled: true
    };
    
    this.installedPlugins.set(pluginId, installedPlugin);

    // 如果是收费插件，自动开始试用
    if (plugin.type === 'premium') {
      await this.startTrial(pluginId);
    }

    await this.saveInstalledPlugins();
    
    // 发射安装事件
    this.emit('plugin:installed', installedPlugin);
    
    return installedPlugin;
  }

  // 卸载插件
  async uninstallPlugin(pluginId) {
    if (!this.installedPlugins.has(pluginId)) {
      throw new Error('Plugin not installed');
    }

    const uninstalledPlugin = this.installedPlugins.get(pluginId);
    
    this.installedPlugins.delete(pluginId);
    this.pluginLicenses.delete(pluginId);
    this.usageStats.delete(pluginId);

    await this.saveInstalledPlugins();
    await this.saveLicenses();
    
    // 发射卸载事件
    this.emit('plugin:uninstalled', uninstalledPlugin);
  }

  // 开始试用
  async startTrial(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin || plugin.type !== 'premium') {
      throw new Error('Invalid plugin for trial');
    }

    const startDate = new Date();
    const expiryDate = LICENSE_RULES.calculateTrialExpiry(startDate);

    const license = {
      type: 'trial',
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: PLUGIN_CONFIG.LICENSE_STATUS.TRIAL
    };

    this.pluginLicenses.set(pluginId, license);
    await this.saveLicenses();
    
    return license;
  }

  // 购买插件
  async purchasePlugin(pluginId, licenseKey) {
    // 模拟购买验证
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin || plugin.type !== 'premium') {
      throw new Error('Invalid plugin for purchase');
    }

    // 验证许可证密钥（实际应用中需要服务器验证）
    if (!this.validateLicenseKey(licenseKey)) {
      throw new Error('Invalid license key');
    }

    const license = {
      type: 'premium',
      licenseKey,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年
      status: PLUGIN_CONFIG.LICENSE_STATUS.ACTIVE
    };

    this.pluginLicenses.set(pluginId, license);
    await this.saveLicenses();
    
    return license;
  }

  // 验证许可证密钥（简化版本）
  validateLicenseKey(licenseKey) {
    // 简单的格式验证，实际应用中需要服务器验证
    return licenseKey && licenseKey.length === 25 && licenseKey.includes('-');
  }

  // 获取许可证状态
  getLicenseStatus(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) return null;

    if (plugin.type === 'free') {
      return { status: PLUGIN_CONFIG.LICENSE_STATUS.ACTIVE, type: 'free' };
    }

    const license = this.pluginLicenses.get(pluginId);
    if (!license) {
      return { status: PLUGIN_CONFIG.LICENSE_STATUS.INVALID, type: 'none' };
    }

    const status = LICENSE_RULES.validateLicense(license);
    return {
      ...license,
      status,
      needsWarning: LICENSE_RULES.shouldShowTrialWarning(license.expiryDate)
    };
  }

  // 检查插件是否可用
  isPluginAvailable(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin || !plugin.enabled) return false;

    if (plugin.type === 'free') return true;

    const licenseStatus = this.getLicenseStatus(pluginId);
    return licenseStatus && [
      PLUGIN_CONFIG.LICENSE_STATUS.ACTIVE,
      PLUGIN_CONFIG.LICENSE_STATUS.TRIAL
    ].includes(licenseStatus.status);
  }

  // 记录使用统计
  recordUsage(pluginId, action = 'use') {
    if (!this.usageStats.has(pluginId)) {
      this.usageStats.set(pluginId, {
        dailyUsage: 0,
        totalUsage: 0,
        lastUsed: null,
        lastResetDate: new Date().toDateString()
      });
    }

    const stats = this.usageStats.get(pluginId);
    const today = new Date().toDateString();

    // 重置每日使用量
    if (stats.lastResetDate !== today) {
      stats.dailyUsage = 0;
      stats.lastResetDate = today;
    }

    stats.dailyUsage++;
    stats.totalUsage++;
    stats.lastUsed = new Date().toISOString();

    this.usageStats.set(pluginId, stats);
  }

  // 获取使用统计
  getUsageStats(pluginId) {
    return this.usageStats.get(pluginId) || {
      dailyUsage: 0,
      totalUsage: 0,
      lastUsed: null
    };
  }

  // 检查使用限制
  checkUsageLimit(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin || !plugin.limitations) return true;

    const stats = this.getUsageStats(pluginId);
    const { dailyUsage } = plugin.limitations;

    if (dailyUsage > 0 && stats.dailyUsage >= dailyUsage) {
      return false;
    }

    return true;
  }

  // 开始试用期监控
  startTrialMonitoring() {
    // 每小时检查一次试用期状态
    setInterval(() => {
      this.checkTrialStatus();
    }, 60 * 60 * 1000);

    // 立即检查一次
    this.checkTrialStatus();
  }

  // 检查试用期状态
  checkTrialStatus() {
    this.pluginLicenses.forEach((license, pluginId) => {
      if (license.type === 'trial') {
        const status = LICENSE_RULES.validateLicense(license);
        if (status === PLUGIN_CONFIG.LICENSE_STATUS.EXPIRED) {
          this.handleTrialExpired(pluginId);
        } else if (LICENSE_RULES.shouldShowTrialWarning(license.expiryDate)) {
          this.handleTrialWarning(pluginId, license);
        }
      }
    });
  }

  // 处理试用期到期
  handleTrialExpired(pluginId) {
    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      plugin.enabled = false;
      this.saveInstalledPlugins();
      
      // 发送到期通知
      this.sendNotification({
        type: 'trial_expired',
        pluginId,
        pluginName: plugin.name,
        message: `${plugin.name} 的试用期已到期，请购买许可证继续使用。`
      });
    }
  }

  // 处理试用期警告
  handleTrialWarning(pluginId, license) {
    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      const daysLeft = Math.ceil((new Date(license.expiryDate) - new Date()) / (24 * 60 * 60 * 1000));
      
      this.sendNotification({
        type: 'trial_warning',
        pluginId,
        pluginName: plugin.name,
        daysLeft,
        message: `${plugin.name} 的试用期还有 ${daysLeft} 天到期，请及时购买许可证。`
      });
    }
  }

  // 发送通知
  sendNotification(notification) {
    // 触发自定义事件，由通知中心处理
    window.dispatchEvent(new CustomEvent('plugin-notification', {
      detail: notification
    }));
  }

  // 启用/禁用插件
  async togglePlugin(pluginId, enabled) {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    plugin.enabled = enabled;
    await this.saveInstalledPlugins();
    return plugin;
  }

  // 更新插件许可证
  async updateLicense(pluginId, newLicense) {
    try {
      if (!this.installedPlugins.has(pluginId)) {
        throw new Error('插件未安装')
      }

      const plugin = this.installedPlugins.get(pluginId)
      const pluginConfig = PLUGIN_CONFIG.DEFAULT_PLUGINS.find(p => p.id === pluginId)

      // 更新许可证信息
      plugin.license = newLicense
      this.pluginLicenses.set(pluginId, {
        type: newLicense,
        validUntil: newLicense === 'trial' ? 
          new Date(Date.now() + PLUGIN_CONFIG.trialPeriod.duration) : null,
        features: newLicense === 'free' ? pluginConfig.freeFeatures : pluginConfig.premiumFeatures,
        purchasedAt: newLicense === 'premium' ? new Date() : null
      })

      // 保存到本地存储
      await this.saveInstalledPlugins()
      await this.saveLicenses()
      
      // 发射许可证变更事件
      this.emit('license:changed', plugin)

      return { success: true, license: this.pluginLicenses.get(pluginId) }
    } catch (error) {
      console.error('更新许可证失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 更新插件
  async updatePlugin(pluginId) {
    try {
      if (!this.installedPlugins.has(pluginId)) {
        throw new Error('插件未安装')
      }

      const plugin = this.installedPlugins.get(pluginId)
      const latestVersion = PLUGIN_CONFIG.DEFAULT_PLUGINS.find(p => p.id === pluginId)
      
      if (!latestVersion) {
        throw new Error('找不到插件信息')
      }

      // 更新插件信息
      Object.assign(plugin, {
        ...latestVersion,
        installedAt: plugin.installedAt, // 保持原安装时间
        license: plugin.license, // 保持原许可证
        enabled: plugin.enabled, // 保持原启用状态
        updatedAt: new Date()
      })

      // 保存到本地存储
      await this.saveInstalledPlugins()
      
      // 发射更新事件
      this.emit('plugin:updated', plugin)

      return { success: true, plugin }
    } catch (error) {
      console.error('更新插件失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取试用剩余天数
  getTrialDaysLeft(pluginId) {
    const license = this.pluginLicenses.get(pluginId)
    if (!license || license.type !== 'trial') {
      return 0
    }

    const now = new Date()
    const validUntil = new Date(license.validUntil)
    const diffTime = validUntil - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }
  
  // 检查是否已使用过试用
  hasUsedTrial(pluginId) {
    const trialHistory = this.getTrialHistory()
    return trialHistory.includes(pluginId)
  }
  
  // 开始试用
  async startTrial(pluginId) {
    try {
      if (this.hasUsedTrial(pluginId)) {
        throw new Error('该插件已使用过试用期')
      }
      
      const plugin = PLUGIN_CONFIG.DEFAULT_PLUGINS.find(p => p.id === pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }
      
      // 安装插件（试用版）
      const result = await this.installPlugin(pluginId, 'trial')
      
      if (result.success) {
        // 记录试用历史
        this.addToTrialHistory(pluginId)
        
        return {
          success: true,
          plugin: result.plugin,
          trialDays: 7
        }
      }
      
      return result
    } catch (error) {
      console.error('开始试用失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 购买插件
  async purchasePlugin(pluginId, plan, price) {
    try {
      const plugin = PLUGIN_CONFIG.DEFAULT_PLUGINS.find(p => p.id === pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }
      
      // 模拟支付过程
      await this.simulatePayment(pluginId, plan, price)
      
      // 更新许可证为付费版
      const licenseType = 'premium'
      let result
      
      if (this.installedPlugins.has(pluginId)) {
        // 更新现有插件的许可证
        result = await this.updateLicense(pluginId, licenseType)
      } else {
        // 安装新插件
        result = await this.installPlugin(pluginId, licenseType)
      }
      
      if (result.success) {
        // 记录购买信息
        this.recordPurchase(pluginId, plan, price)
        
        return {
          success: true,
          plugin: result.plugin || this.installedPlugins.get(pluginId),
          plan: plan,
          price: price
        }
      }
      
      return result
    } catch (error) {
      console.error('购买插件失败:', error)
      return { success: false, error: error.message }
    }
  }
  
  // 模拟支付过程
  async simulatePayment(pluginId, plan, price) {
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 模拟支付成功率（实际项目中这里会调用真实的支付接口）
    if (Math.random() > 0.95) {
      throw new Error('支付失败，请重试')
    }
    
    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'success',
      amount: price,
      plan: plan
    }
  }
  
  // 记录购买信息
  recordPurchase(pluginId, plan, price) {
    const purchases = this.getPurchaseHistory()
    purchases.push({
      pluginId,
      plan,
      price,
      purchaseDate: new Date().toISOString(),
      transactionId: `txn_${Date.now()}`
    })
    
    localStorage.setItem('plugin_purchases', JSON.stringify(purchases))
  }
  
  // 获取购买历史
  getPurchaseHistory() {
    try {
      const history = localStorage.getItem('plugin_purchases')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }
  
  // 获取试用历史
  getTrialHistory() {
    try {
      const history = localStorage.getItem('plugin_trials')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }
  
  // 添加到试用历史
  addToTrialHistory(pluginId) {
    const history = this.getTrialHistory()
    if (!history.includes(pluginId)) {
      history.push(pluginId)
      localStorage.setItem('plugin_trials', JSON.stringify(history))
    }
  }
}

// 创建单例实例
export const pluginService = new PluginService();
export default pluginService;