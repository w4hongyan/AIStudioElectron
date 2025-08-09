<template>
  <div class="page-container">
    <h1 class="page-title">AI 语音合成</h1>
    <p class="page-subtitle">输入文本，选择您喜欢的声音，一键生成自然流畅的音频。</p>

    <el-row :gutter="24">
      <!-- 左侧：输入与设置 -->
      <el-col :span="10">
        <el-card class="control-panel">
          <template #header>
            <div class="card-header">
              <span>合成设置</span>
            </div>
          </template>
          
          <div class="input-panel">
            <h3>文本内容</h3>
            <el-input
              v-model="textContent"
              type="textarea"
              :rows="8"
              placeholder="请输入需要合成的文本内容..."
              class="text-input"
              maxlength="5000"
              show-word-limit
            />
            <div class="quick-actions">
              <el-button @click="insertPause" size="small" :icon="Timer">插入停顿</el-button>
              <el-button @click="clearText" size="small" :icon="Delete">清空</el-button>
            </div>
          </div>

          <el-divider />

          <div class="voice-settings">
            <h3>声音配置</h3>
            <el-form label-position="top">
              <el-form-item label="选择声音">
                <el-select v-model="selectedVoice" class="voice-selector" placeholder="选择声音">
                  <el-option-group label="女声">
                    <el-option v-for="voice in femaleVoices" :key="voice.id" :label="voice.name" :value="voice.id" />
                  </el-option-group>
                  <el-option-group label="男声">
                    <el-option v-for="voice in maleVoices" :key="voice.id" :label="voice.name" :value="voice.id" />
                  </el-option-group>
                </el-select>
              </el-form-item>
              <el-form-item label="语速">
                <el-slider v-model="speed" :min="0.5" :max="2" :step="0.1" />
              </el-form-item>
              <el-form-item label="音调">
                <el-slider v-model="pitch" :min="-12" :max="12" :step="1" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：预览与历史 -->
      <el-col :span="14">
        <el-card class="result-panel">
          <template #header>
            <div class="card-header">
              <span>预览与导出</span>
            </div>
          </template>

          <div class="audio-player">
            <div class="waveform-container" v-if="isGenerated">
              <!-- 模拟波形图 -->
              <div class="waveform" :style="{ background: `linear-gradient(to right, #409eff ${playbackProgress}%, #e4e7ed ${playbackProgress}%)` }"></div>
            </div>
            <div class="time-display">
              <span>{{ formatTime(currentTime) }}</span>
              <span>{{ formatTime(totalDuration) }}</span>
            </div>
            <div class="player-controls">
              <el-button @click="playPreview" :icon="VideoPlay" circle />
              <el-button @click="pausePreview" :icon="VideoPause" circle />
              <el-button @click="stopPreview" :icon="CircleClose" circle />
            </div>
          </div>

          <div class="action-buttons">
            <el-button 
              type="primary" 
              size="large" 
              @click="generateAudio"
              :loading="isGenerating"
              :disabled="!textContent.trim()"
              style="width: 100%;"
            >
              <el-icon><Microphone /></el-icon>
              {{ isGenerating ? '生成中...' : '开始合成' }}
            </el-button>
            <el-button 
              type="success" 
              size="large" 
              @click="downloadAudio"
              :disabled="!isGenerated"
              style="width: 100%;"
            >
              <el-icon><Download /></el-icon>
              下载音频
            </el-button>
          </div>
          
          <el-divider />

          <div class="history-panel">
            <h4>历史记录</h4>
            <el-scrollbar height="300px">
              <div v-if="generationHistory.length === 0" style="text-align:center; color: #999; padding: 20px;">暂无历史记录</div>
              <div 
                v-for="(item, index) in generationHistory" 
                :key="index"
                class="history-item"
                @click="loadHistory(item)"
              >
                <div class="history-text">{{ item.text.substring(0, 60) }}...</div>
                <div class="history-info">
                  <span>{{ getVoiceName(item.voice) }}</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause, CircleClose, Microphone, Download, Timer, Delete } from '@element-plus/icons-vue'

const textContent = ref('欢迎使用AI语音合成器！这是一段示例文本，用于测试语音合成效果。')
const selectedVoice = ref('xiaoyun')
const speed = ref(1.0)
const pitch = ref(0)

const playbackProgress = ref(0)
const currentTime = ref(0)
const totalDuration = ref(0)
const isGenerated = ref(false)
const isGenerating = ref(false)

const maleVoices = ref([
  { id: 'xiaogang', name: '小刚' },
  { id: 'xiaoming', name: '小明' },
])
const femaleVoices = ref([
  { id: 'xiaoyun', name: '小云' },
  { id: 'xiaomei', name: '小美' },
])
const allVoices = [...maleVoices.value, ...femaleVoices.value];

const generationHistory = ref([])

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
const formatDate = (date) => new Date(date).toLocaleString()
const getVoiceName = (id) => allVoices.find(v => v.id === id)?.name || '未知声音'

const insertPause = () => { textContent.value += '[停顿1秒]' }
const clearText = () => { textContent.value = '' }

const generateAudio = async () => {
  if (!textContent.value.trim()) {
    ElMessage.warning('请输入文本内容');
    return;
  }
  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  isGenerated.value = true
  totalDuration.value = Math.ceil(textContent.value.length / 4)
  generationHistory.value.unshift({
    text: textContent.value,
    voice: selectedVoice.value,
    createdAt: new Date()
  })
  isGenerating.value = false
  ElMessage.success('合成成功！')
}

const playPreview = () => {
  if (!isGenerated.value) return
  // 模拟播放
  const interval = setInterval(() => {
    if (playbackProgress.value < 100) {
      playbackProgress.value += 1
      currentTime.value = (playbackProgress.value / 100) * totalDuration.value
    } else {
      clearInterval(interval)
    }
  }, totalDuration.value * 10)
}
const pausePreview = () => {}
const stopPreview = () => {
  playbackProgress.value = 0
  currentTime.value = 0
}

const downloadAudio = () => { ElMessage.info('模拟下载...') }

const loadHistory = (item) => {
  textContent.value = item.text
  selectedVoice.value = item.voice
}

onMounted(() => {
  // Load from local storage if needed
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
.input-panel h3, .voice-settings h3, .history-panel h4 {
  margin: 0 0 15px 0;
  font-weight: 600;
}
.text-input {
  margin-bottom: 10px;
}
.quick-actions {
  display: flex;
  gap: 10px;
}
.voice-selector {
  width: 100%;
}
.audio-player {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 20px;
}
.waveform-container {
  margin-bottom: 10px;
}
.waveform {
  height: 50px;
  border-radius: 4px;
  background-color: #f5f7fa;
}
.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 10px;
}
.player-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
}
.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s;
}
.history-item:hover {
  border-color: var(--accent-color);
  background-color: #ecf5ff;
}
.history-text {
  flex: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 20px;
}
.history-info {
  font-size: 12px;
  color: var(--text-color-secondary);
  text-align: right;
}
</style>
