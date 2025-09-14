/**
 * 智谱AI GLM-4-Flash API服务封装
 * 提供统一的AI调用接口
 */

class GLMApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GLM_API_KEY
    this.apiUrl = import.meta.env.VITE_GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    this.model = import.meta.env.VITE_AI_MODEL || 'glm-4-flash'
    this.maxTokens = parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 2048
    this.temperature = parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000
    this.retryCount = parseInt(import.meta.env.VITE_API_RETRY_COUNT) || 3
    this.retryDelay = parseInt(import.meta.env.VITE_API_RETRY_DELAY) || 1000
  }

  /**
   * 检查API配置是否完整
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your_api_key_here'
  }

  /**
   * 发送聊天请求到GLM-4-Flash
   */
  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('GLM API密钥未配置，请在.env文件中设置VITE_GLM_API_KEY')
    }

    const requestBody = {
      model: this.model,
      messages: this.formatMessages(messages),
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: false
    }

    return this.makeRequest(requestBody)
  }

  /**
   * 格式化消息为GLM API格式
   */
  formatMessages(messages) {
    if (typeof messages === 'string') {
      return [{ role: 'user', content: messages }]
    }
    
    if (Array.isArray(messages)) {
      return messages.map(msg => ({
        role: msg.role || 'user',
        content: msg.content || msg
      }))
    }
    
    return [{ role: 'user', content: String(messages) }]
  }

  /**
   * 发送HTTP请求
   */
  async makeRequest(requestBody, attempt = 1) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`)
      }

      const data = await response.json()
      return this.parseResponse(data)
    } catch (error) {
      if (attempt < this.retryCount && !error.name === 'AbortError') {
        console.warn(`GLM API请求失败，正在重试 (${attempt}/${this.retryCount}):`, error.message)
        await this.delay(this.retryDelay * attempt)
        return this.makeRequest(requestBody, attempt + 1)
      }
      throw error
    }
  }

  /**
   * 解析API响应
   */
  parseResponse(data) {
    if (!data.choices || !data.choices[0]) {
      throw new Error('API响应格式错误')
    }

    const choice = data.choices[0]
    return {
      content: choice.message?.content || '',
      finishReason: choice.finish_reason,
      usage: data.usage,
      model: data.model,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * AI写作助手
   */
  async generateContent(prompt, type = 'article', options = {}) {
    const systemPrompts = {
      article: '你是一个专业的内容创作助手，擅长写作各种类型的文章。请根据用户需求创作高质量、有吸引力的内容。',
      social: '你是一个社交媒体内容专家，擅长创作吸引人的短文案、标题和话题。内容要简洁有趣，适合社交平台传播。',
      marketing: '你是一个营销文案专家，擅长创作有说服力的营销内容。要突出产品优势，激发用户行动。',
      tutorial: '你是一个教程创作专家，擅长将复杂概念简化为易懂的教程内容。要条理清晰，步骤明确。'
    }

    const messages = [
      { role: 'system', content: systemPrompts[type] || systemPrompts.article },
      { role: 'user', content: prompt }
    ]

    return this.chat(messages, options)
  }

  /**
   * 热点分析
   */
  async analyzeHotTopics(keywords, platform = 'all') {
    const prompt = `请分析关键词"${keywords}"在${platform === 'all' ? '各大平台' : platform}的热度趋势，包括：
1. 当前热度评分(1-100)
2. 未来7天趋势预测
3. 相关热门话题
4. 最佳发布时间建议
5. 内容创作建议

请以JSON格式返回结构化数据。`

    const response = await this.chat(prompt, { temperature: 0.3 })
    
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.warn('无法解析JSON响应，返回原始内容')
    }
    
    return { analysis: response.content }
  }

  /**
   * 智能推荐
   */
  async getRecommendations(userProfile, contentType = 'mixed') {
    const prompt = `基于用户画像：${JSON.stringify(userProfile)}，为${contentType}类型内容提供个性化推荐，包括：
1. 推荐话题(5个)
2. 内容风格建议
3. 发布时间建议
4. 平台选择建议
5. 预期效果评估

请以JSON格式返回。`

    const response = await this.chat(prompt, { temperature: 0.5 })
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.warn('无法解析JSON响应，返回原始内容')
    }
    
    return { recommendations: response.content }
  }

  /**
   * 内容优化建议
   */
  async optimizeContent(content, platform, goal = 'engagement') {
    const prompt = `请优化以下${platform}平台的内容，目标是提升${goal}：

原内容：
${content}

请提供：
1. 优化后的内容
2. 修改说明
3. 预期效果提升
4. 其他建议

以JSON格式返回。`

    const response = await this.chat(prompt, { temperature: 0.4 })
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.warn('无法解析JSON响应，返回原始内容')
    }
    
    return { optimization: response.content }
  }
}

// 创建全局实例
export const glmApiService = new GLMApiService()
export default GLMApiService