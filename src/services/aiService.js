/**
 * AI服务层 - 处理所有AI相关的调用和缓存
 * 解决AI响应超时和成本优化问题
 */

import { ElMessage } from 'element-plus'

class AIService {
  constructor() {
    this.cache = new Map()
    this.requestQueue = []
    this.isProcessing = false
    this.maxConcurrent = 3
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    }
    
    // 模拟AI模型切换策略
    this.models = {
      gpt4: { cost: 0.06, speed: 'slow', quality: 'high' },
      gpt35: { cost: 0.002, speed: 'fast', quality: 'medium' },
      local: { cost: 0, speed: 'instant', quality: 'basic' }
    }
  }

  /**
   * 智能模型选择 - 根据成本和响应时间
   */
  selectModel(prompt, complexity = 'medium') {
    const cacheKey = this.generateCacheKey(prompt)
    
    // 优先检查缓存
    if (this.cache.has(cacheKey)) {
      return { model: 'local', cached: true, data: this.cache.get(cacheKey) }
    }

    // 根据复杂度选择模型
    if (complexity === 'high' || prompt.length > 1000) {
      return { model: 'gpt4', cached: false }
    } else if (complexity === 'medium') {
      return { model: 'gpt35', cached: false }
    } else {
      return { model: 'gpt35', cached: false }
    }
  }

  /**
   * 热点预测算法 - 基于历史数据和趋势分析
   */
  async predictHotTopics(keywords, days = 7) {
    try {
      const predictionData = await this.generatePrediction(keywords, days)
      return {
        success: true,
        data: predictionData,
        confidence: this.calculateConfidence(predictionData),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackPrediction(keywords)
      }
    }
  }

  /**
   * 队列化处理 - 避免并发过多导致API限制
   */
  async queueRequest(requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        fn: requestFn,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      })
      
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return
    
    this.isProcessing = true
    
    // 按优先级排序
    this.requestQueue.sort((a, b) => {
      const priorityMap = { high: 3, normal: 2, low: 1 }
      return priorityMap[b.priority] - priorityMap[a.priority]
    })

    const activeRequests = []
    while (this.requestQueue.length > 0 && activeRequests.length < this.maxConcurrent) {
      const request = this.requestQueue.shift()
      activeRequests.push(this.executeWithRetry(request))
    }

    await Promise.allSettled(activeRequests)
    this.isProcessing = false
    
    // 继续处理剩余请求
    if (this.requestQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100)
    }
  }

  /**
   * 带重试机制的请求执行
   */
  async executeWithRetry(request) {
    let lastError
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await request.fn()
        request.resolve(result)
        return
      } catch (error) {
        lastError = error
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          )
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    request.reject(lastError)
  }

  /**
   * 生成热点预测数据
   */
  async generatePrediction(keywords, days) {
    // 模拟基于历史数据的预测算法
    const baseTrends = [
      { date: new Date(), score: 75, volume: 10000, trend: 'up' },
      { date: new Date(Date.now() + 86400000), score: 82, volume: 15000, trend: 'up' },
      { date: new Date(Date.now() + 86400000 * 2), score: 91, volume: 25000, trend: 'up' },
      { date: new Date(Date.now() + 86400000 * 3), score: 88, volume: 22000, trend: 'down' },
      { date: new Date(Date.now() + 86400000 * 4), score: 79, volume: 18000, trend: 'down' },
      { date: new Date(Date.now() + 86400000 * 5), score: 85, volume: 20000, trend: 'up' },
      { date: new Date(Date.now() + 86400000 * 6), score: 93, volume: 30000, trend: 'up' }
    ]

    // 根据关键词调整预测
    const keywordMultiplier = this.calculateKeywordMultiplier(keywords)
    const adjustedTrends = baseTrends.map(trend => ({
      ...trend,
      score: Math.min(100, trend.score * keywordMultiplier),
      volume: Math.floor(trend.volume * keywordMultiplier),
      keywords: keywords.split(' ').slice(0, 3),
      platforms: this.getPlatformRecommendations(trend.score)
    }))

    return adjustedTrends
  }

  /**
   * 关键词影响力计算
   */
  calculateKeywordMultiplier(keywords) {
    const keywordWeights = {
      'ai': 1.5, 'chatgpt': 1.8, '教程': 1.3, '评测': 1.4, '攻略': 1.2,
      '热点': 1.6, '爆款': 1.7, '抖音': 1.4, '小红书': 1.3, 'b站': 1.2
    }
    
    const words = keywords.toLowerCase().split(/\s+/)
    let multiplier = 1
    
    words.forEach(word => {
      if (keywordWeights[word]) {
        multiplier *= keywordWeights[word]
      }
    })
    
    return Math.min(multiplier, 2.5)
  }

  /**
   * 平台推荐算法
   */
  getPlatformRecommendations(score) {
    const platformMap = {
      90: ['抖音', '小红书', 'B站', '快手'],
      80: ['抖音', '小红书', 'B站'],
      70: ['抖音', '小红书'],
      60: ['小红书', '微博']
    }
    
    const threshold = Object.keys(platformMap).reverse().find(t => score >= parseInt(t))
    return platformMap[threshold] || ['小红书']
  }

  /**
   * 置信度计算
   */
  calculateConfidence(predictionData) {
    const volatility = this.calculateVolatility(predictionData)
    const baseConfidence = 85
    return Math.max(60, baseConfidence - volatility * 10)
  }

  calculateVolatility(data) {
    const scores = data.map(d => d.score)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length
    return Math.sqrt(variance) / 10
  }

  /**
   * 缓存管理
   */
  generateCacheKey(prompt) {
    return btoa(prompt.toLowerCase().trim()).substring(0, 16)
  }

  setCache(key, data, ttl = 3600000) { // 1小时TTL
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
    
    // 清理过期缓存
    this.cleanupCache()
  }

  cleanupCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 降级预测方案
   */
  getFallbackPrediction(keywords) {
    return [
      {
        date: new Date(),
        score: 70,
        volume: 5000,
        trend: 'stable',
        keywords: keywords.split(' ').slice(0, 2),
        platforms: ['小红书', '抖音'],
        isFallback: true
      }
    ]
  }

  /**
   * 批量AI处理优化
   */
  async batchProcess(items, processFn) {
    const batchSize = 10
    const results = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(item => this.queueRequest(() => processFn(item)))
      )
      
      results.push(...batchResults.map((result, index) => ({
        item: batch[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      })))
    }
    
    return results
  }
}

// 创建全局实例
export const aiService = new AIService()
export default AIService