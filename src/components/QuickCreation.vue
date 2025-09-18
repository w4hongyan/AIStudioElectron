<template>
  <div class="quick-creation">
    <!-- 顶部进度指示器 -->
    <div class="creation-progress">
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="选择类型" />
        <el-step title="输入主题" />
        <el-step title="AI生成" />
        <el-step title="发布内容" />
      </el-steps>
    </div>

    <!-- 步骤1：选择心情和类型 -->
    <div v-if="currentStep === 0" class="step-content">
      <div class="step-header">
        <h2>🎯 今天心情如何？想分享什么？</h2>
        <p>选择最适合你的心情和内容类型，AI将在3分钟内完成创作</p>
      </div>
      
      <!-- 心情选择器 -->
      <div class="mood-selector">
        <div 
          v-for="mood in moodOptions" 
          :key="mood.value"
          :class="['mood-card', { active: selectedMood === mood.value }]"
          @click="selectMood(mood.value)">
          <div class="mood-emoji">{{ mood.emoji }}</div>
          <div class="mood-label">{{ mood.label }}</div>
        </div>
      </div>

      <h4>选择内容类型</h4>
      <div class="creation-types">
        <div 
          v-for="type in filteredContentTypes" 
          :key="type.id"
          :class="['type-card', { active: selectedType?.id === type.id }]"
          @click="selectType(type)">
          <div class="type-icon">{{ type.icon }}</div>
          <h3>{{ type.name }}</h3>
          <p>{{ type.description }}</p>
          <div v-if="type.recommended" class="recommended-badge">推荐</div>
          <div class="type-stats">
            <span>⏱️ {{ type.avgTime }}分钟</span>
            <span>📊 {{ type.successRate }}%成功率</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤2：输入主题和关键词 -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="step-header">
        <h2>📝 告诉我你的想法</h2>
        <p>输入主题关键词，AI将为你生成爆款内容</p>
      </div>
      
      <div class="input-section">
        <div class="input-group">
          <label>内容主题</label>
          <el-input
            v-model="contentTheme"
            placeholder="例如：夏季护肤小技巧、职场新人指南..."
            size="large"
            :maxlength="50"
            show-word-limit
          />
        </div>
        
        <div class="input-group">
          <label>目标平台</label>
          <el-select v-model="targetPlatform" size="large" style="width: 100%">
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="抖音" value="douyin" />
            <el-option label="B站" value="bilibili" />
            <el-option label="微信公众号" value="wechat" />
          </el-select>
        </div>
        
        <div class="input-group">
          <label>内容风格</label>
          <el-radio-group v-model="contentStyle" size="large">
            <el-radio-button label="casual">轻松幽默</el-radio-button>
            <el-radio-button label="professional">专业权威</el-radio-button>
            <el-radio-button label="warm">温暖治愈</el-radio-button>
            <el-radio-button label="trendy">潮流时尚</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- AI实时建议 -->
      <div v-if="contentTheme" class="ai-suggestions">
        <h4>🤖 AI推荐关键词</h4>
        <div class="suggestion-chips">
          <el-tag
            v-for="keyword in suggestedKeywords"
            :key="keyword"
            :type="selectedKeywords.includes(keyword) ? 'success' : 'info'"
            effect="plain"
            round
            @click="toggleKeyword(keyword)">
            {{ keyword }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 步骤3：AI生成内容 -->
    <div v-if="currentStep === 2" class="step-content">
      <div class="step-header">
        <h2>✨ AI正在为你创作</h2>
        <p>根据你的需求，AI正在生成高质量内容...</p>
      </div>
      
      <div class="generation-progress">
        <el-progress 
          :percentage="generationProgress" 
          :status="generationStatus"
          :stroke-width="20"
          striped
          striped-flow>
          <template #default>
            {{ generationMessage }}
          </template>
        </el-progress>
      </div>
      
      <!-- 预览内容 -->
      <div v-if="generatedContent" class="content-preview">
        <div class="preview-header">
          <h3>📋 内容预览</h3>
          <div class="preview-actions">
            <el-button type="text" @click="regenerateContent">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
            <el-button type="text" @click="editContent">
              <el-icon><Edit /></el-icon>
              手动编辑
            </el-button>
          </div>
        </div>
        
        <div class="preview-content">
          <div class="content-text">
            <h4>{{ generatedContent.title }}</h4>
            <p>{{ generatedContent.content }}</p>
          </div>
          
          <div v-if="generatedContent.hashtags" class="content-hashtags">
            <el-tag
              v-for="tag in generatedContent.hashtags"
              :key="tag"
              size="small"
              effect="plain">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤4：发布和分享 -->
    <div v-if="currentStep === 3" class="step-content">
      <div class="step-header">
        <h2>🚀 准备发布</h2>
        <p>你的内容已经准备就绪，选择发布方式</p>
      </div>
      
      <div class="publish-options">
        <div class="publish-card" @click="publishToPlatform">
          <div class="publish-icon">📱</div>
          <h3>直接发布</h3>
          <p>一键发布到{{ targetPlatformName }}</p>
          <el-button type="primary" size="large">
            立即发布
          </el-button>
        </div>
        
        <div class="publish-card" @click="downloadContent">
          <div class="publish-icon">💾</div>
          <h3>下载保存</h3>
          <p>保存到本地，稍后发布</p>
          <el-button type="success" size="large">
            下载文件
          </el-button>
        </div>
        
        <div class="publish-card" @click="schedulePublish">
          <div class="publish-icon">⏰</div>
          <h3>定时发布</h3>
          <p>选择最佳时间自动发布</p>
          <el-button type="warning" size="large">
            设置定时
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="step-navigation">
      <el-button 
        v-if="currentStep > 0" 
        @click="previousStep"
        size="large">
        上一步
      </el-button>
      
      <el-button 
        v-if="currentStep < 3" 
        type="primary" 
        @click="nextStep"
        size="large"
        :disabled="!canProceed">
        {{ nextButtonText }}
      </el-button>
      
      <el-button 
        v-if="currentStep === 3"
        type="success" 
        @click="completeCreation"
        size="large">
        完成创作
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { glmApiService } from '../services/glmApiService.js'

// 响应式数据
const currentStep = ref(0)
const selectedType = ref(null)
const selectedMood = ref('')
const contentTheme = ref('')
const targetPlatform = ref('xiaohongshu')
const contentStyle = ref('casual')
const selectedKeywords = ref([])
const generationProgress = ref(0)
const generationStatus = ref('')
const generationMessage = ref('')
const generatedContent = ref(null)

// 心情选项
const moodOptions = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'inspired', label: '有感悟', emoji: '💡' },
  { value: 'excited', label: '激动', emoji: '🎉' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'tired', label: '疲惫', emoji: '😴' }
]

// 创作类型定义
const creationTypes = [
  {
    id: 'social_post',
    name: '社交帖子',
    icon: '📱',
    description: '适合小红书、抖音等平台的短内容',
    avgTime: 2,
    successRate: 92
  },
  {
    id: 'article',
    name: '长文内容',
    icon: '📝',
    description: '深度文章、教程、评测类内容',
    avgTime: 5,
    successRate: 87
  },
  {
    id: 'video_script',
    name: '视频脚本',
    icon: '🎬',
    description: '短视频、Vlog、教学视频脚本',
    avgTime: 3,
    successRate: 89
  },
  {
    id: 'product_review',
    name: '产品测评',
    icon: '⭐',
    description: '商品评测、使用心得分享',
    avgTime: 4,
    successRate: 85
  }
]

const filteredContentTypes = computed(() => {
  const moodMap = {
    happy: ['social_post', 'product_review'],
    inspired: ['social_post', 'video_script', 'article'],
    excited: ['article', 'product_review'],
    calm: ['social_post', 'video_script'],
    tired: ['social_post']
  }
  
  const recommendedIds = moodMap[selectedMood.value] || Object.keys(moodMap)
  return creationTypes.map(type => ({
    ...type,
    recommended: recommendedIds.includes(type.id)
  }))
})

// 计算属性
const suggestedKeywords = computed(() => {
  if (!contentTheme.value) return []
  // 基于主题生成相关关键词
  const themes = {
    '护肤': ['敏感肌', '补水', '防晒', '抗老', '美白'],
    '职场': ['升职加薪', '面试技巧', '办公软件', '时间管理', '人际关系'],
    '美食': ['家常菜', '烘焙', '减脂餐', '快手菜', '探店']
  }
  
  for (const [key, words] of Object.entries(themes)) {
    if (contentTheme.value.includes(key)) return words
  }
  
  return ['实用技巧', '干货分享', '避坑指南', '新手必看', '经验总结']
})

const targetPlatformName = computed(() => {
  const names = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    bilibili: 'B站',
    wechat: '微信公众号'
  }
  return names[targetPlatform.value]
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return selectedType.value !== null
    case 1: return contentTheme.value.trim().length >= 3
    case 2: return generatedContent.value !== null
    default: return true
  }
})

const nextButtonText = computed(() => {
  switch (currentStep.value) {
    case 0: return '下一步：输入主题'
    case 1: return '开始生成'
    case 2: return '下一步：发布内容'
    default: return '完成'
  }
})

// 方法
const selectMood = (mood) => {
  selectedMood.value = mood
}

const selectType = (type) => {
  selectedType.value = type
  nextStep()
}

const toggleKeyword = (keyword) => {
  const index = selectedKeywords.value.indexOf(keyword)
  if (index > -1) {
    selectedKeywords.value.splice(index, 1)
  } else {
    selectedKeywords.value.push(keyword)
  }
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    // 开始AI生成
    await startGeneration()
  } else {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const startGeneration = async () => {
  generationProgress.value = 0
  generationStatus.value = ''
  generationMessage.value = '正在连接GLM AI...'
  
  try {
    // 检查GLM API配置
    if (!glmApiService.isConfigured()) {
      ElMessage.error('GLM API未配置，请联系管理员设置API密钥')
      return
    }

    // 构建AI生成提示词
    const prompt = buildGenerationPrompt()
    
    // 实际的AI生成步骤
    const steps = [
      { progress: 20, message: '正在分析主题和关键词...' },
      { progress: 40, message: '连接GLM-4-Flash模型...' },
      { progress: 60, message: 'AI正在创作内容...' },
      { progress: 80, message: '优化文案表达和结构...' },
      { progress: 95, message: '生成热门标签...' }
    ]
    
    // 显示进度
    for (let i = 0; i < steps.length - 1; i++) {
      generationProgress.value = steps[i].progress
      generationMessage.value = steps[i].message
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    // 调用GLM API生成内容
    generationProgress.value = 60
    generationMessage.value = 'GLM AI正在创作内容...'
    
    const response = await glmApiService.generateContent(prompt, getContentType(), {
      temperature: 0.8,
      maxTokens: 2048
    })
    
    // 解析生成的内容
    const parsedContent = parseGeneratedContent(response.content)
    
    // 完成进度
    generationProgress.value = 100
    generationMessage.value = '内容生成完成！'
    generationStatus.value = 'success'
    
    // 设置生成的内容
    generatedContent.value = {
      title: parsedContent.title || `${contentTheme.value} | ${targetPlatformName.value}精选内容`,
      content: parsedContent.content || response.content,
      hashtags: parsedContent.hashtags || generateHashtags()
    }
    
    ElMessage.success('AI内容生成成功！')
    currentStep.value++
    
  } catch (error) {
    console.error('GLM API调用失败:', error)
    generationStatus.value = 'exception'
    generationMessage.value = '生成失败，正在使用备用方案...'
    
    // 降级到本地模板生成
    await fallbackGeneration()
    
    ElMessage.warning('AI服务暂时不可用，已使用本地模板生成内容')
  }
}

// 构建GLM生成提示词
const buildGenerationPrompt = () => {
  const platformMap = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    bilibili: 'B站',
    wechat: '微信公众号'
  }
  
  const styleMap = {
    casual: '轻松幽默',
    professional: '专业权威', 
    warm: '温暖治愈',
    trendy: '潮流时尚'
  }
  
  const typeMap = {
    social_post: '社交媒体短文案',
    article: '深度文章',
    video_script: '视频脚本',
    product_review: '产品测评'
  }
  
  const platform = platformMap[targetPlatform.value] || '社交媒体'
  const style = styleMap[contentStyle.value] || '自然'
  const type = typeMap[selectedType.value?.id] || '内容'
  const keywords = selectedKeywords.value.join('、') || ''
  
  return `请为${platform}平台创作一篇关于"${contentTheme.value}"的${type}，要求：

1. 内容风格：${style}
2. 目标平台：${platform}
3. 相关关键词：${keywords}
4. 内容类型：${type}

请生成以下格式的内容：
{
  "title": "吸引人的标题",
  "content": "完整的正文内容，适合${platform}平台特点",
  "hashtags": ["相关标签1", "相关标签2", "相关标签3"]
}

要求：
- 标题要有吸引力，符合${platform}平台特点
- 正文内容要${style}，有实用价值
- 包含3-5个相关热门标签
- 内容长度适中，适合${platform}平台
- 如果是视频脚本，要包含开场、主体、结尾结构
- 如果是产品测评，要包含优缺点分析

请直接返回JSON格式的结果。`
}

// 获取内容类型
const getContentType = () => {
  const typeMapping = {
    social_post: 'social',
    article: 'article', 
    video_script: 'tutorial',
    product_review: 'marketing'
  }
  return typeMapping[selectedType.value?.id] || 'social'
}

// 解析生成的内容
const parseGeneratedContent = (content) => {
  try {
    // 尝试解析JSON格式的响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        title: parsed.title,
        content: parsed.content,
        hashtags: parsed.hashtags || []
      }
    }
  } catch (e) {
    console.warn('无法解析JSON格式，使用原始内容')
  }
  
  // 如果无法解析JSON，尝试从文本中提取结构
  const lines = content.split('\n').filter(line => line.trim())
  const title = lines[0]?.replace(/^#+\s*/, '') || `${contentTheme.value}精选内容`
  const contentText = lines.slice(1).join('\n')
  
  return {
    title,
    content: contentText,
    hashtags: extractHashtagsFromText(contentText)
  }
}

// 从文本中提取标签
const extractHashtagsFromText = (text) => {
  const hashtagRegex = /#([^\s#]+)/g
  const matches = text.match(hashtagRegex) || []
  return matches.slice(0, 5) // 最多5个标签
}

// 降级生成方案
const fallbackGeneration = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  generatedContent.value = {
    title: `${contentTheme.value} | ${targetPlatformName.value}爆款攻略`,
    content: generateContent(),
    hashtags: generateHashtags()
  }
  
  generationProgress.value = 100
  generationStatus.value = 'success'
  currentStep.value++
}

const generateContent = () => {
  const templates = {
    social_post: `🔥${contentTheme.value}真的太重要了！

今天想跟大家分享一下我的${contentTheme.value}心得：

✅ 关键点1：专业实用
✅ 关键点2：操作简单  
✅ 关键点3：效果显著

💡 小建议：${selectedKeywords.value[0] || '坚持就是胜利'}

你们有什么${contentTheme.value}的好方法吗？评论区一起交流！

#${contentTheme.value.replace(/\s/g, '')} #干货分享`,
    
    article: `## ${contentTheme.value}完全指南（新手必看）

作为一个${contentTheme.value}的深度用户，今天想系统地分享一下我的经验...

### 📋 核心要点

1. **基础认知**
   ${contentTheme.value}的核心在于...

2. **实操步骤**  
   第一步：...
   第二步：...
   第三步：...

3. **避坑指南**
   ❌ 常见错误：...
   ✅ 正确做法：...

### 💡 进阶技巧

...`,
    
    video_script: `[开场3秒钩子]
"你们知道吗？90%的人都做错了${contentTheme.value}！"

[内容主体]
今天这条视频，我用1分钟教会你正确的${contentTheme.value}方法：

📍 第1步：...
📍 第2步：...
📍 第3步：...

[结尾互动]
"学会了记得点赞收藏，评论区告诉我你的${contentTheme.value}心得！"

[标签]
#${contentTheme.value} #教程 #干货`,
    
    product_review: `📦 ${contentTheme.value}真实测评

用了${contentTheme.value}一个月，说说真实感受：

✅ 优点：
- 效果确实明显
- 操作简单易上手
- 性价比很高

❌ 缺点：
- 初期需要适应
- 包装可以更好

💰 价格：XXX元
🎯 推荐指数：⭐⭐⭐⭐⭐

适合人群：...
购买建议：...`
  }
  
  return templates[selectedType.value?.id] || templates.social_post
}

const generateHashtags = () => {
  const baseTags = {
    xiaohongshu: ['小红书', '干货分享', '新手必看'],
    douyin: ['抖音', '教程', '干货'],
    bilibili: ['B站', '知识分享', '学习'],
    wechat: ['微信公众号', '干货', '经验分享']
  }
  
  return [...baseTags[targetPlatform.value], ...selectedKeywords.value]
}

const regenerateContent = () => {
  generatedContent.value = null
  startGeneration()
}

const editContent = () => {
  ElMessage.success('编辑功能开发中...')
}

const publishToPlatform = () => {
  ElMessage.success(`正在发布到${targetPlatformName}...`)
}

const downloadContent = () => {
  const blob = new Blob([JSON.stringify(generatedContent.value, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${contentTheme.value}-内容.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('内容已下载')
}

const schedulePublish = () => {
  ElMessage.success('定时发布功能开发中...')
}

const completeCreation = () => {
  ElMessage.success('🎉 创作完成！已为你节省45分钟创作时间')
  // 重置状态
  currentStep.value = 0
  selectedType.value = null
  contentTheme.value = ''
  generatedContent.value = null
}

// 监听生成进度
watch(currentStep, (newStep) => {
  if (newStep === 2 && !generatedContent.value) {
    generationMessage.value = '准备生成...'
  }
})
</script>

<style scoped>
.quick-creation {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.creation-progress {
  margin-bottom: 40px;
}

.step-content {
  min-height: 500px;
}

.step-header {
  text-align: center;
  margin-bottom: 40px;
}

.step-header h2 {
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--text-color-primary);
}

.step-header p {
  font-size: 16px;
  color: var(--text-color-secondary);
}

/* 心情选择器样式 */
.mood-selector {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.mood-card {
  text-align: center;
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  background: white;
}

.mood-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64,158,255,0.15);
}

.mood-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.mood-emoji {
  font-size: 2em;
  margin-bottom: 8px;
}

.mood-label {
  font-size: 14px;
  font-weight: 500;
}

.creation-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.type-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
}

.type-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
}

.type-card.active {
  border-color: #409eff;
  background: #f0f9ff;
}

.type-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.type-card h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--text-color-primary);
}

.type-card p {
  color: var(--text-color-secondary);
  margin-bottom: 16px;
}

.type-stats {
  display: flex;
  justify-content: space-around;
  font-size: 14px;
  color: #909399;
}

.input-section {
  max-width: 600px;
  margin: 0 auto;
}

.input-group {
  margin-bottom: 32px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.ai-suggestions {
  margin-top: 32px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
}

.ai-suggestions h4 {
  margin-bottom: 16px;
  color: var(--text-color-primary);
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.generation-progress {
  max-width: 400px;
  margin: 0 auto 40px;
}

.content-preview {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #f9fafb;
}

.preview-content {
  padding: 24px;
}

.content-text h4 {
  margin-bottom: 16px;
  color: var(--text-color-primary);
}

.content-text p {
  line-height: 1.8;
  color: var(--text-color-secondary);
  white-space: pre-line;
}

.content-hashtags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.publish-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.publish-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.recommended-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.publish-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
}

.publish-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.publish-card h3 {
  margin-bottom: 8px;
  color: var(--text-color-primary);
}

.publish-card p {
  color: var(--text-color-secondary);
  margin-bottom: 24px;
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .creation-types {
    grid-template-columns: 1fr;
  }
  
  .publish-options {
    grid-template-columns: 1fr;
  }
  
  .step-navigation {
    flex-direction: column;
    gap: 16px;
  }
  
  .step-navigation .el-button {
    width: 100%;
  }
}
</style>