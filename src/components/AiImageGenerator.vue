<template>
  <div class="page-container">
    <h1 class="page-title">AI 绘图</h1>
    <p class="page-subtitle">输入您的创意，生成高质量的图片、插画和封面。</p>

    <el-row :gutter="24">
      <!-- 左侧提示词输入区 -->
      <el-col :span="8">
        <el-card class="control-panel">
          <template #header>
            <div class="card-header">
              <span>绘画参数</span>
            </div>
          </template>
          
          <el-alert
            title="⚠️ 演示模式：当前为模拟生成"
            type="warning"
            :closable="false"
            style="margin-bottom: 15px"
          />
          
          <div class="prompt-section">
            <div class="prompt-header">
              <label>正向提示词</label>
              <div class="prompt-actions">
                <el-button 
                  size="small" 
                  type="success" 
                  :loading="isOptimizing"
                  @click="generateSmartPrompt"
                  :disabled="!positivePrompt.trim()"
                >
                  <el-icon><MagicStick /></el-icon>
                  智能生成
                </el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  :loading="isOptimizing"
                  @click="optimizePrompt"
                  :disabled="!positivePrompt.trim()"
                >
                  <el-icon><MagicStick /></el-icon>
                  AI优化
                </el-button>
              </div>
            </div>
            <el-input
              v-model="positivePrompt"
              type="textarea"
              :rows="6"
              placeholder="描述您想要的画面..."
              maxlength="1000"
              show-word-limit
            />
          </div>

          <div class="prompt-section">
            <label>负向提示词</label>
            <el-input
              v-model="negativePrompt"
              type="textarea"
              :rows="3"
              placeholder="描述您不想要的元素..."
              maxlength="500"
              show-word-limit
            />
          </div>

          <div class="style-presets">
            <label>风格预设</label>
            <div class="preset-grid">
              <div 
                v-for="preset in stylePresets" 
                :key="preset.id"
                class="preset-item"
                :class="{ active: selectedStyle === preset.id }"
                @click="selectedStyle = preset.id"
              >
                <img :src="preset.thumbnail" :alt="preset.name" />
                <span>{{ preset.name }}</span>
              </div>
            </div>
          </div>

          <div class="parameters">
            <h4>生成参数</h4>
            <div class="param-row">
              <label>图片尺寸</label>
              <el-select v-model="imageSize" style="width: 100%">
                <el-option 
                  v-for="option in imageSizeOptions" 
                  :key="option.value" 
                  :label="option.label" 
                  :value="option.value" 
                />
              </el-select>
            </div>
            <div class="param-row">
              <label>生成数量</label>
              <el-input-number v-model="batchCount" :min="1" :max="4" />
            </div>
          </div>

          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="large" 
              @click="generateImage"
              :loading="isGenerating"
              :disabled="!positivePrompt.trim()"
              style="width: 100%"
            >
              <el-icon><Picture /></el-icon>
              {{ isGenerating ? '生成中...' : '开始生成' }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧结果展示区 -->
      <el-col :span="16">
        <el-card class="result-panel">
          <template #header>
            <div class="card-header">
              <span>生成结果</span>
            </div>
          </template>
          
          <div class="generation-status" v-if="isGenerating">
            <el-progress 
              :percentage="generationProgress" 
              :status="generationStatus"
              :stroke-width="6"
            />
            <p class="status-text">{{ generationText }}</p>
          </div>

          <div class="image-grid" v-if="generatedImages.length > 0">
            <div 
              v-for="(image, index) in generatedImages" 
              :key="index"
              class="image-item"
            >
              <el-image :src="image.url" :alt="image.prompt" fit="cover" class="generated-image" />
              <div class="image-actions">
                <el-button-group>
                  <el-button size="small" @click="viewImage(image)" :icon="ZoomIn" />
                  <el-button size="small" type="primary" @click="downloadImage(image)" :icon="Download" />
                  <el-button size="small" @click="regenerateImage(index)" :icon="Refresh" />
                </el-button-group>
              </div>
            </div>
          </div>

          <el-empty v-if="!isGenerating && generatedImages.length === 0" description="输入提示词开始创作" />

          <!-- 历史记录 -->
          <div class="history-panel" v-if="generationHistory.length > 0">
            <h4>历史记录</h4>
            <el-scrollbar height="200px">
              <div 
                v-for="(item, index) in generationHistory" 
                :key="index"
                class="history-item"
                @click="loadHistory(item)"
              >
                <el-image :src="item.thumbnail" class="history-thumbnail" fit="cover" />
                <div class="history-info">
                  <div class="history-prompt">{{ item.prompt.substring(0, 50) }}...</div>
                  <div class="history-meta">
                    <span>{{ item.style }}</span>
                    <span>{{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 大图预览对话框 -->
    <el-dialog v-model="previewDialog.visible" title="预览图片" width="80%" center>
      <img :src="previewDialog.imageUrl" style="width: 100%; height: auto; border-radius: 8px" />
      <template #footer>
        <el-button @click="previewDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="downloadImage(previewDialog.image)">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Picture, ZoomIn, Download, Refresh, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { stylePresets, defaultImageSize, imageSizeOptions } from '../config/imageGenerator.config.js'
import aiService from '../services/aiService'
import { glmApiService } from '../services/glmApiService.js'

const positivePrompt = ref('')
const negativePrompt = ref('')
const selectedStyle = ref('realistic')
const imageSize = ref(defaultImageSize)
const batchCount = ref(1)

const isGenerating = ref(false)
const isOptimizing = ref(false)
const generationProgress = ref(0)
const generationStatus = ref('')
const generationText = ref('')

const generatedImages = ref([])
const generationHistory = ref([])

const previewDialog = reactive({
  visible: false,
  imageUrl: '',
  image: null
})

// 添加智能提示词生成功能
const generateSmartPrompt = async () => {
  if (!positivePrompt.value.trim()) {
    ElMessage.warning('请先输入基础描述')
    return
  }
  
  isOptimizing.value = true
  try {
    // 检查GLM API配置
    const isGlmConfigured = await glmApiService.checkConfiguration()
    
    if (isGlmConfigured) {
      const styleInfo = stylePresets.find(s => s.id === selectedStyle.value)
      const smartPrompt = buildSmartPromptRequest(positivePrompt.value, styleInfo, imageSize.value)
      
      const result = await glmApiService.generateContent(smartPrompt, {
        temperature: 0.8,
        max_tokens: 1000,
        top_p: 0.95
      })
      
      if (result.success && result.content) {
        const enhancedPrompt = parseSmartPromptResponse(result.content)
        positivePrompt.value = enhancedPrompt.positive
        if (enhancedPrompt.negative) {
          negativePrompt.value = enhancedPrompt.negative
        }
        ElMessage.success('GLM AI已为您生成专业提示词')
        return
      }
    }
    
    // 降级到本地智能生成
    const localSmart = generateSmartPromptLocally(positivePrompt.value, selectedStyle.value)
    positivePrompt.value = localSmart.positive
    negativePrompt.value = localSmart.negative
    ElMessage.success('已生成智能提示词')
    
  } catch (error) {
    console.error('智能提示词生成失败:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    isOptimizing.value = false
  }
}

// 构建智能提示词生成请求
const buildSmartPromptRequest = (userInput, styleInfo, imageSize) => {
  return `你是一位顶级的AI绘画提示词专家。基于用户的简单描述，生成专业的正向和负向提示词。

## 用户输入
用户描述：${userInput}
选择风格：${styleInfo?.name || '写实风格'}
图片尺寸：${imageSize}

## 任务要求
1. **正向提示词**：基于用户描述，生成详细的英文提示词
   - 主体描述要具体生动
   - 添加适合的风格关键词
   - 包含构图、光影、色彩指导
   - 添加质量提升关键词
   
2. **负向提示词**：生成相应的负向提示词
   - 排除低质量元素
   - 排除不符合风格的元素
   - 排除常见的AI生成缺陷

## 风格特色
${getAdvancedStyleGuidance(styleInfo?.id)}

## 输出格式
请严格按照以下JSON格式输出：
{
  "positive": "详细的正向提示词",
  "negative": "相应的负向提示词",
  "explanation": "简短的创作思路说明"
}

生成结果：`
}

// 获取高级风格指导
const getAdvancedStyleGuidance = (styleId) => {
  const advancedGuidance = {
    'realistic': `写实摄影风格：
- 关键词：photorealistic, ultra detailed, 8k resolution, professional photography, sharp focus, natural lighting
- 构图：rule of thirds, depth of field, bokeh effect
- 质量：masterpiece, award winning photography, high dynamic range`,
    
    'anime': `日式动漫风格：
- 关键词：anime style, manga art, cel shading, vibrant colors, detailed character design
- 特色：large expressive eyes, dynamic poses, clean line art
- 质量：studio quality, official art, highly detailed`,
    
    'oil-painting': `古典油画风格：
- 关键词：oil painting, classical art, renaissance style, rich textures, brush strokes
- 技法：chiaroscuro lighting, warm color palette, traditional composition
- 质量：museum quality, fine art, masterful technique`,
    
    'watercolor': `水彩画风格：
- 关键词：watercolor painting, soft washes, flowing colors, paper texture, artistic
- 技法：wet on wet technique, color bleeding, transparent layers
- 质量：traditional media, artistic expression, delicate details`,
    
    'sketch': `素描风格：
- 关键词：pencil sketch, line art, crosshatching, detailed shading, monochrome
- 技法：graphite drawing, fine linework, tonal values
- 质量：technical drawing, precise details, artistic skill`,
    
    'cyberpunk': `赛博朋克风格：
- 关键词：cyberpunk aesthetic, neon lights, futuristic cityscape, high tech low life
- 氛围：dark atmosphere, rain reflections, holographic displays, urban decay
- 质量：cinematic lighting, detailed environment, atmospheric mood`
  }
  return advancedGuidance[styleId] || advancedGuidance['realistic']
}

// 解析智能提示词响应
const parseSmartPromptResponse = (content) => {
  try {
    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        positive: parsed.positive || '',
        negative: parsed.negative || '',
        explanation: parsed.explanation || ''
      }
    }
  } catch (error) {
    console.warn('JSON解析失败，使用文本解析')
  }
  
  // 文本解析降级方案
  const lines = content.split('\n').filter(line => line.trim())
  let positive = ''
  let negative = ''
  
  for (const line of lines) {
    if (line.includes('positive') || line.includes('正向')) {
      positive = line.replace(/.*[:：]\s*/, '').replace(/["""]/g, '').trim()
    } else if (line.includes('negative') || line.includes('负向')) {
      negative = line.replace(/.*[:：]\s*/, '').replace(/["""]/g, '').trim()
    }
  }
  
  return { positive: positive || content.trim(), negative }
}

// 本地智能提示词生成（降级方案）
const generateSmartPromptLocally = (userInput, styleId) => {
  const styleTemplates = {
    'realistic': {
      positive: `${userInput}, photorealistic, ultra detailed, 8k resolution, professional photography, sharp focus, natural lighting, masterpiece, award winning photography`,
      negative: 'blurry, low quality, pixelated, cartoon, anime, painting, sketch, low resolution, bad anatomy'
    },
    'anime': {
      positive: `${userInput}, anime style, manga art, cel shading, vibrant colors, detailed character design, studio quality, official art, highly detailed`,
      negative: 'realistic, photographic, 3d render, blurry, low quality, bad anatomy, deformed, ugly'
    },
    'oil-painting': {
      positive: `${userInput}, oil painting, classical art, renaissance style, rich textures, brush strokes, museum quality, fine art, masterful technique`,
      negative: 'digital art, anime, cartoon, low quality, modern style, flat colors, simple'
    },
    'watercolor': {
      positive: `${userInput}, watercolor painting, soft washes, flowing colors, paper texture, artistic, traditional media, delicate details`,
      negative: 'digital art, sharp edges, harsh colors, low quality, photographic, 3d render'
    },
    'sketch': {
      positive: `${userInput}, pencil sketch, line art, crosshatching, detailed shading, monochrome, technical drawing, artistic skill`,
      negative: 'colored, painted, low quality, blurry, photographic, digital art, simple'
    },
    'cyberpunk': {
      positive: `${userInput}, cyberpunk aesthetic, neon lights, futuristic cityscape, dark atmosphere, cinematic lighting, detailed environment`,
      negative: 'bright daylight, natural, rural, low tech, simple, low quality, blurry'
    }
  }
  
  return styleTemplates[styleId] || styleTemplates['realistic']
}

// AI提示词优化
const optimizePrompt = async () => {
  if (!positivePrompt.value.trim()) return
  
  isOptimizing.value = true
  try {
    // 检查GLM API配置
    const isGlmConfigured = await glmApiService.checkConfiguration()
    
    if (isGlmConfigured) {
      // 使用GLM API进行提示词优化
      const styleInfo = stylePresets.find(s => s.id === selectedStyle.value)
      const optimizationPrompt = buildPromptOptimizationPrompt(positivePrompt.value, styleInfo, imageSize.value)
      
      const result = await glmApiService.generateContent(optimizationPrompt, {
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9
      })
      
      if (result.success && result.content) {
        const optimizedPrompt = parseOptimizedPrompt(result.content)
        positivePrompt.value = optimizedPrompt
        ElMessage.success('GLM AI已优化您的提示词')
        return
      }
    }
    
    // 降级到原有aiService
    const styleInfo = stylePresets.find(s => s.id === selectedStyle.value)
    const optimizationPrompt = `请优化以下图片生成提示词，使其更加专业和详细。

原始提示词：${positivePrompt.value}
风格：${styleInfo?.name || '默认'}
图片尺寸：${imageSize.value}

请返回优化后的英文提示词，包含：
1. 主体描述
2. 风格细节
3. 光影效果
4. 构图建议
5. 质量关键词

只返回优化后的提示词，不要其他解释。`

    const result = await aiService.generateContent(optimizationPrompt, 'prompt_optimization', {
      temperature: 0.7,
      max_tokens: 500
    })
    
    if (result.success && result.content) {
      // 提取优化后的提示词
      let optimizedPrompt = result.content.trim()
      
      // 如果返回的是中文，尝试提取英文部分
      const englishMatch = optimizedPrompt.match(/[a-zA-Z][^\u4e00-\u9fa5]*$/)
      if (englishMatch) {
        optimizedPrompt = englishMatch[0].trim()
      }
      
      positivePrompt.value = optimizedPrompt
      ElMessage.success('提示词已优化')
    } else {
      // 降级到本地优化
      const localOptimized = optimizePromptLocally(positivePrompt.value, selectedStyle.value)
      positivePrompt.value = localOptimized
      ElMessage.success('已使用本地优化')
    }
  } catch (error) {
    console.error('提示词优化失败:', error)
    // 降级到本地优化
    const localOptimized = optimizePromptLocally(positivePrompt.value, selectedStyle.value)
    positivePrompt.value = localOptimized
    ElMessage.warning('AI优化失败，使用本地优化')
  } finally {
    isOptimizing.value = false
  }
}

// 构建GLM提示词优化请求
const buildPromptOptimizationPrompt = (originalPrompt, styleInfo, imageSize) => {
  return `你是一位专业的AI绘画提示词优化专家。请优化以下图片生成提示词，使其更加专业、详细和有效。

## 原始信息
- 用户提示词：${originalPrompt}
- 选择风格：${styleInfo?.name || '默认风格'}
- 图片尺寸：${imageSize}

## 优化要求
1. **主体描述**：明确描述画面主体，包含细节特征
2. **风格定义**：根据选择的风格添加相应的艺术风格关键词
3. **技术参数**：添加适合的技术质量关键词
4. **构图指导**：包含构图、视角、光影等专业术语
5. **质量提升**：添加高质量、高分辨率等关键词

## 风格指导
${getStyleGuidance(styleInfo?.id)}

## 输出格式
请直接输出优化后的英文提示词，不要包含任何解释或其他内容。提示词应该简洁明了，用逗号分隔关键词。

优化后的提示词：`
}

// 获取风格指导
const getStyleGuidance = (styleId) => {
  const styleGuidance = {
    'realistic': '写实风格：使用photorealistic, ultra detailed, high resolution, professional photography等关键词',
    'anime': '动漫风格：使用anime style, manga, cel shading, vibrant colors, detailed character design等关键词',
    'oil-painting': '油画风格：使用oil painting, classical art, brush strokes, traditional painting, artistic等关键词',
    'watercolor': '水彩风格：使用watercolor painting, soft colors, artistic, traditional media, flowing colors等关键词',
    'sketch': '素描风格：使用pencil sketch, line art, monochrome, artistic drawing, detailed linework等关键词',
    'cyberpunk': '赛博朋克风格：使用cyberpunk style, neon lights, futuristic, high tech, dark atmosphere等关键词'
  }
  return styleGuidance[styleId] || styleGuidance['realistic']
}

// 解析优化后的提示词
const parseOptimizedPrompt = (content) => {
  // 移除可能的前缀文字，提取纯提示词
  let prompt = content.trim()
  
  // 查找"优化后的提示词："之后的内容
  const promptMatch = prompt.match(/优化后的提示词[：:]\s*(.+)/i)
  if (promptMatch) {
    prompt = promptMatch[1].trim()
  }
  
  // 移除引号
  prompt = prompt.replace(/^["']|["']$/g, '')
  
  // 确保是英文提示词
  if (/[\u4e00-\u9fa5]/.test(prompt)) {
    // 如果包含中文，尝试提取英文部分
    const englishParts = prompt.match(/[a-zA-Z][^，。！？]*[a-zA-Z]/g)
    if (englishParts && englishParts.length > 0) {
      prompt = englishParts.join(', ')
    }
  }
  
  return prompt
}

// 本地提示词优化（降级方案）
const optimizePromptLocally = (prompt, style) => {
  const styleKeywords = {
    'realistic': 'photorealistic, high quality, detailed, professional photography',
    'anime': 'anime style, manga, cel shading, vibrant colors, detailed',
    'oil-painting': 'oil painting style, classical art, brush strokes, artistic',
    'watercolor': 'watercolor painting, soft colors, artistic, traditional media',
    'sketch': 'pencil sketch, line art, monochrome, artistic drawing',
    'cyberpunk': 'cyberpunk style, neon lights, futuristic, high tech, dark atmosphere'
  }
  
  const qualityKeywords = 'masterpiece, best quality, ultra detailed, 8k resolution'
  const styleKeyword = styleKeywords[style] || styleKeywords['realistic']
  
  return `${prompt}, ${styleKeyword}, ${qualityKeywords}`
}

const generateImage = async () => {
  if (!positivePrompt.value.trim()) return
  isGenerating.value = true
  generationProgress.value = 0
  generationText.value = '正在准备...'
  generatedImages.value = []

  const steps = [
    { progress: 20, text: '解析提示词...' },
    { progress: 50, text: '加载模型...' },
    { progress: 80, text: '生成中...' },
    { progress: 100, text: '完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 700))
    generationProgress.value = step.progress
    generationText.value = step.text
  }

  const newImages = []
  for (let i = 0; i < batchCount.value; i++) {
    const image = {
      id: Date.now() + i,
      url: `https://via.placeholder.com/${imageSize.value.split('x')[0]}x${imageSize.value.split('x')[1]}/?text=AI+Image+${i+1}`,
      prompt: positivePrompt.value,
      style: stylePresets.find(s => s.id === selectedStyle.value)?.name || '默认',
      createdAt: new Date()
    }
    newImages.push(image)
    generationHistory.value.unshift({ ...image, thumbnail: image.url })
  }

  generatedImages.value = newImages
  isGenerating.value = false
}

const viewImage = (image) => {
  previewDialog.image = image
  previewDialog.imageUrl = image.url
  previewDialog.visible = true
}

const downloadImage = (image) => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = `ai-image-${Date.now()}.png`
  link.click()
}

const regenerateImage = (index) => {
  generateImage()
}

const formatDate = (date) => new Date(date).toLocaleString()

const loadHistory = (item) => {
  positivePrompt.value = item.prompt
  selectedStyle.value = stylePresets.find(s => s.name === item.style)?.id || 'realistic'
}

onMounted(() => {
  const savedHistory = localStorage.getItem('aiImageHistory')
  if (savedHistory) {
    generationHistory.value = JSON.parse(savedHistory)
  }
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}
.page-subtitle {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 20px;
}
.control-panel, .result-panel {
  height: calc(100vh - 160px);
  overflow-y: auto;
}
.card-header {
  font-size: 16px;
  font-weight: 600;
}
.prompt-section {
  margin-bottom: 20px;
}
.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.prompt-actions {
  display: flex;
  gap: 8px;
}
.prompt-section label, .style-presets label, .parameters h4, .param-row label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}
.prompt-header label {
  margin-bottom: 0;
}
.style-presets, .parameters {
  margin-bottom: 20px;
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}
.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.preset-item:hover {
  border-color: var(--accent-color);
}
.preset-item.active {
  border-color: var(--accent-color);
  background-color: #ecf5ff;
}
.preset-item img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-bottom: 5px;
  object-fit: cover;
}
.preset-item span {
  font-size: 12px;
  text-align: center;
}
.param-row {
  margin-bottom: 15px;
}
.generation-status {
  text-align: center;
  margin-bottom: 20px;
}
.status-text {
  margin: 10px 0 0 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}
.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.generated-image {
  width: 100%;
  height: 200px;
}
.image-actions {
  position: absolute;
  bottom: 5px;
  right: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}
.image-item:hover .image-actions {
  opacity: 1;
}
.history-panel {
  margin-top: 20px;
}
.history-panel h4 {
  margin: 0 0 15px 0;
  font-weight: 600;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.history-item:hover {
  background-color: #f5f7fa;
}
.history-thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}
.history-info {
  flex: 1;
  overflow: hidden;
}
.history-prompt {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-color-secondary);
}
</style>
