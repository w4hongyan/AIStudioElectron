/**
 * AI服务层 - 处理所有AI相关的调用和缓存
 * 解决AI响应超时和成本优化问题
 */

import { ElMessage } from 'element-plus'
import { glmApiService } from './glmApiService.js'

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
   * 热点预测算法 - 基于GLM AI分析和历史数据
   */
  async predictHotTopics(keywords, days = 7) {
    try {
      // 优先使用GLM AI进行热点分析
      if (glmApiService.isConfigured()) {
        const aiAnalysis = await glmApiService.analyzeHotTopics(keywords)
        const predictionData = await this.enhancePredictionWithAI(aiAnalysis, keywords, days)
        return {
          success: true,
          data: predictionData,
          confidence: this.calculateConfidence(predictionData),
          timestamp: new Date().toISOString(),
          source: 'ai_enhanced'
        }
      } else {
        // 降级到本地算法
        const predictionData = await this.generatePrediction(keywords, days)
        return {
          success: true,
          data: predictionData,
          confidence: this.calculateConfidence(predictionData),
          timestamp: new Date().toISOString(),
          source: 'local_algorithm'
        }
      }
    } catch (error) {
      console.warn('热点预测失败，使用降级方案:', error.message)
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
   * 使用AI增强预测数据
   */
  async enhancePredictionWithAI(aiAnalysis, keywords, days) {
    const baseTrends = await this.generatePrediction(keywords, days)
    
    // 如果AI返回了结构化数据，使用AI的分析结果
    if (aiAnalysis.score && aiAnalysis.trend) {
      return baseTrends.map((trend, index) => ({
        ...trend,
        score: Math.min(100, aiAnalysis.score + (Math.random() - 0.5) * 10),
        aiInsights: aiAnalysis.analysis || aiAnalysis.recommendations,
        confidence: aiAnalysis.confidence || 85
      }))
    }
    
    return baseTrends
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
   * AI内容生成 - 使用GLM-4-Flash
   */
  async generateContent(prompt, type = 'article', options = {}) {
    try {
      if (glmApiService.isConfigured()) {
        const result = await glmApiService.generateContent(prompt, type, options)
        return {
          success: true,
          content: result.content,
          usage: result.usage,
          model: result.model,
          timestamp: result.timestamp
        }
      } else {
        // 降级到模拟内容
        return {
          success: true,
          content: this.generateMockContent(prompt, type),
          model: 'mock',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.warn('AI内容生成失败:', error.message)
      return {
        success: false,
        error: error.message,
        fallback: this.generateMockContent(prompt, type)
      }
    }
  }

  /**
   * 智能推荐 - 基于用户画像
   */
  async getSmartRecommendations(userProfile, contentType = 'mixed') {
    try {
      if (glmApiService.isConfigured()) {
        const recommendations = await glmApiService.getRecommendations(userProfile, contentType)
        return {
          success: true,
          data: recommendations,
          timestamp: new Date().toISOString(),
          source: 'ai_powered'
        }
      } else {
        return {
          success: true,
          data: this.getMockRecommendations(userProfile, contentType),
          timestamp: new Date().toISOString(),
          source: 'rule_based'
        }
      }
    } catch (error) {
      console.warn('智能推荐失败:', error.message)
      return {
        success: false,
        error: error.message,
        fallback: this.getMockRecommendations(userProfile, contentType)
      }
    }
  }

  /**
   * 内容优化建议
   */
  async optimizeContent(content, platform, goal = 'engagement') {
    try {
      if (glmApiService.isConfigured()) {
        const optimization = await glmApiService.optimizeContent(content, platform, goal)
        return {
          success: true,
          data: optimization,
          timestamp: new Date().toISOString()
        }
      } else {
        return {
          success: true,
          data: this.getMockOptimization(content, platform, goal),
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.warn('内容优化失败:', error.message)
      return {
        success: false,
        error: error.message,
        fallback: this.getMockOptimization(content, platform, goal)
      }
    }
  }

  /**
   * 生成模拟内容（降级方案）
   */
  generateMockContent(prompt, type) {
    const templates = {
      article: `基于"${prompt}"的深度分析\n\n这是一个关于${prompt}的详细分析文章。内容包括背景介绍、核心观点、实例分析和总结建议。\n\n请注意：这是模拟内容，建议配置GLM API获得更好的效果。`,
      social: `🔥 ${prompt} 热点解析\n\n✨ 核心要点\n📈 趋势分析\n💡 实用建议\n\n#${prompt.replace(/\s+/g, '')} #热点分析`,
      marketing: `${prompt} - 不容错过的机会！\n\n🎯 核心优势\n💰 超值体验\n⏰ 限时优惠\n\n立即行动，把握先机！`,
      tutorial: `${prompt} 完整教程\n\n📋 准备工作\n🔧 操作步骤\n✅ 验证结果\n💡 进阶技巧\n\n跟着步骤，轻松掌握！`
    }
    
    return templates[type] || templates.article
  }

  /**
   * 生成模拟推荐（降级方案）
   */
  getMockRecommendations(userProfile, contentType) {
    return {
      topics: ['AI技术趋势', '内容创作技巧', '社交媒体运营', '数据分析方法', '用户体验设计'],
      styles: ['专业分析', '轻松幽默', '实用教程', '深度解读', '热点追踪'],
      timing: ['09:00-11:00', '14:00-16:00', '19:00-21:00'],
      platforms: ['小红书', '抖音', 'B站', '微博'],
      confidence: 75
    }
  }

  /**
   * 生成模拟优化建议（降级方案）
   */
  getMockOptimization(content, platform, goal) {
    return {
      optimized_content: content + '\n\n[AI优化建议：添加更多互动元素和热门标签]',
      suggestions: [
        '增加emoji表情提升视觉效果',
        '添加相关热门标签',
        '优化开头吸引注意力',
        '增加互动性问题'
      ],
      expected_improvement: '预计互动率提升15-25%'
    }
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