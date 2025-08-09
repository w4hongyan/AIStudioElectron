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
            <label>正向提示词</label>
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
import { Picture, ZoomIn, Download, Refresh } from '@element-plus/icons-vue'
import { stylePresets, defaultImageSize, imageSizeOptions } from '../config/imageGenerator.config.js'

const positivePrompt = ref('')
const negativePrompt = ref('')
const selectedStyle = ref('realistic')
const imageSize = ref(defaultImageSize)
const batchCount = ref(1)

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

const formatDate = (date) => new Date(date).toLocaleString()

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
      style: stylePresets.value.find(s => s.id === selectedStyle.value)?.name || '默认',
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

const loadHistory = (item) => {
  positivePrompt.value = item.prompt
  selectedStyle.value = stylePresets.value.find(s => s.name === item.style)?.id || 'realistic'
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
.prompt-section label, .style-presets label, .parameters h4, .param-row label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
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
