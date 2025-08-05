<template>
  <div class="ai-image-generator">
    <div class="generator-layout">
      <!-- 左侧提示词输入区 -->
      <div class="prompt-panel">
        <h3>🎨 AI图片生成器</h3>
        <el-alert
          title="⚠️ 演示模式：当前为模拟生成，实际使用时将连接真实AI服务"
          type="warning"
          :closable="false"
          style="margin-bottom: 15px"
        />
        
        <div class="prompt-section">
          <label>正向提示词</label>
          <el-input
            v-model="positivePrompt"
            type="textarea"
            :rows="6"
            placeholder="描述您想要的画面，例如：一只可爱的橘猫，坐在窗台上，阳光洒落，温馨氛围..."
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
            placeholder="描述您不想要的元素，例如：模糊，低质量，畸形，多余的手指..."
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
              <el-option label="正方形 512x512" value="512x512" />
              <el-option label="正方形 1024x1024" value="1024x1024" />
              <el-option label="竖版 512x768" value="512x768" />
              <el-option label="竖版 768x1152" value="768x1152" />
              <el-option label="横版 768x512" value="768x512" />
              <el-option label="横版 1152x768" value="1152x768" />
            </el-select>
          </div>

          <div class="param-row">
            <label>采样步数: {{ samplingSteps }}</label>
            <el-slider v-model="samplingSteps" :min="10" :max="50" :step="1" />
          </div>

          <div class="param-row">
            <label>提示词引导系数: {{ guidanceScale }}</label>
            <el-slider v-model="guidanceScale" :min="1" :max="20" :step="0.5" />
          </div>

          <div class="param-row">
            <label>生成数量</label>
            <el-input-number v-model="batchCount" :min="1" :max="4" />
          </div>

          <el-collapse>
            <el-collapse-item title="展开高级设置" name="advanced">
              <div class="param-row">
                <label>随机种子</label>
                <el-input v-model="seed" placeholder="-1 为随机" />
              </div>
            </el-collapse-item>
          </el-collapse>
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
      </div>

      <!-- 右侧结果展示区 -->
      <div class="result-panel">
        <h3>生成结果</h3>
        
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
            <img :src="image.url" :alt="image.prompt" />
            <div class="image-actions">
              <el-button size="small" @click="viewImage(image)">
                <el-icon><ZoomIn /></el-icon>
                查看
              </el-button>
              <el-button size="small" type="success" @click="downloadImage(image)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button size="small" @click="regenerateImage(index)">
                <el-icon><Refresh /></el-icon>
                重绘
              </el-button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-if="!isGenerating && generatedImages.length === 0">
          <el-icon size="64"><Picture /></el-icon>
          <p>输入提示词开始创作</p>
        </div>

        <!-- 历史记录 -->
        <div class="history-panel" v-if="generationHistory.length > 0">
          <h4>历史记录</h4>
          <el-scrollbar height="200px">
            <div 
              v-for="(item, index) in generationHistory" 
              :key="index"
              class="history-item"
            >
              <img :src="item.thumbnail" class="history-thumbnail" />
              <div class="history-info">
                <div class="history-prompt">{{ item.prompt.substring(0, 50) }}...</div>
                <div class="history-meta">
                  <span>{{ item.style }}</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              <el-button size="small" @click="loadHistory(item)">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <!-- 大图预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      :title="预览图片"
      width="80%"
      center
    >
      <img 
        :src="previewDialog.imageUrl" 
        style="width: 100%; height: auto; border-radius: 8px" 
      />
      <template #footer>
        <el-button @click="previewDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="downloadImage(previewDialog.image)">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Picture, ZoomIn, Download, Refresh } from '@element-plus/icons-vue'

// 数据状态
const positivePrompt = ref('')
const negativePrompt = ref('')
const selectedStyle = ref('realistic')
const imageSize = ref('512x512')
const samplingSteps = ref(20)
const guidanceScale = ref(7.5)
const batchCount = ref(1)
const seed = ref('-1')

const isGenerating = ref(false)
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

// 风格预设
const stylePresets = ref([
  { id: 'realistic', name: '写实', thumbnail: '/styles/realistic.jpg' },
  { id: 'anime', name: '动漫', thumbnail: '/styles/anime.jpg' },
  { id: 'oil-painting', name: '油画', thumbnail: '/styles/oil-painting.jpg' },
  { id: 'watercolor', name: '水彩', thumbnail: '/styles/watercolor.jpg' },
  { id: 'sketch', name: '素描', thumbnail: '/styles/sketch.jpg' },
  { id: 'cyberpunk', name: '赛博朋克', thumbnail: '/styles/cyberpunk.jpg' },
  { id: 'fantasy', name: '奇幻', thumbnail: '/styles/fantasy.jpg' },
  { id: 'photographic', name: '摄影', thumbnail: '/styles/photographic.jpg' }
])

// 方法
const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const generateImage = async () => {
  if (!positivePrompt.value.trim()) return

  isGenerating.value = true
  generationProgress.value = 0
  generationText.value = '正在准备生成...'

  // 模拟生成过程
  const steps = [
    { progress: 10, text: '正在解析提示词...' },
    { progress: 30, text: '正在加载模型...' },
    { progress: 50, text: '正在生成图像...' },
    { progress: 80, text: '正在优化质量...' },
    { progress: 100, text: '生成完成！' }
  ]

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    generationProgress.value = step.progress
    generationText.value = step.text
  }

  // 生成模拟图片
  const newImages = []
  for (let i = 0; i < batchCount.value; i++) {
    const image = {
      id: Date.now() + i,
      url: `https://via.placeholder.com/${imageSize.value}/FF6B6B/FFFFFF?text=AI+Generated+${i+1}`,
      prompt: positivePrompt.value,
      negativePrompt: negativePrompt.value,
      style: stylePresets.value.find(s => s.id === selectedStyle.value)?.name || '默认',
      size: imageSize.value,
      steps: samplingSteps.value,
      guidance: guidanceScale.value,
      createdAt: new Date()
    }
    newImages.push(image)
    
    // 添加到历史记录
    generationHistory.value.unshift({
      ...image,
      thumbnail: image.url
    })
  }

  generatedImages.value = [...generatedImages.value, ...newImages]
  isGenerating.value = false
}

const viewImage = (image) => {
  previewDialog.image = image
  previewDialog.imageUrl = image.url
  previewDialog.visible = true
}

const downloadImage = (image) => {
  // 模拟下载
  const link = document.createElement('a')
  link.href = image.url
  link.download = `ai-image-${Date.now()}.png`
  link.click()
}

const regenerateImage = (index) => {
  generatedImages.value.splice(index, 1)
  generateImage()
}

const loadHistory = (item) => {
  positivePrompt.value = item.prompt
  negativePrompt.value = item.negativePrompt || ''
  selectedStyle.value = stylePresets.value.find(s => s.name === item.style)?.id || 'realistic'
  imageSize.value = item.size
  samplingSteps.value = item.steps
  guidanceScale.value = item.guidance
}

onMounted(() => {
  // 加载历史记录
  const savedHistory = localStorage.getItem('aiImageHistory')
  if (savedHistory) {
    generationHistory.value = JSON.parse(savedHistory)
  }
})
</script>

<style scoped>
.ai-image-generator {
  height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.generator-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.prompt-panel,
.result-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.prompt-panel {
  width: 400px;
  overflow-y: auto;
}

.result-panel {
  flex: 1;
  overflow-y: auto;
}

.prompt-section {
  margin-bottom: 20px;
}

.prompt-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #666;
}

.style-presets {
  margin-bottom: 20px;
}

.style-presets label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #666;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  border-color: #409eff;
}

.preset-item.active {
  border-color: #409eff;
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

.parameters {
  margin-bottom: 20px;
}

.parameters h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.param-row {
  margin-bottom: 15px;
}

.param-row label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #666;
}

.generation-status {
  text-align: center;
  margin-bottom: 20px;
}

.status-text {
  margin: 10px 0 0 0;
  color: #666;
  font-size: 14px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.image-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-actions {
  display: flex;
  gap: 5px;
  padding: 10px;
  justify-content: space-between;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.history-panel h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
}

.history-thumbnail {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.history-info {
  flex: 1;
}

.history-prompt {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}
</style>