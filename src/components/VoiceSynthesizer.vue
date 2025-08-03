<template>
  <div class="voice-synthesizer">
    <div class="synthesizer-layout">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <h3>文本输入</h3>
        <el-input
          v-model="textContent"
          type="textarea"
          :rows="10"
          placeholder="请输入需要合成的文本内容..."
          class="text-input"
          maxlength="5000"
          show-word-limit
        />
        
        <div class="quick-actions">
          <el-button @click="insertPause" size="small">
            <el-icon><Timer /></el-icon> 插入停顿
          </el-button>
          <el-button @click="clearText" size="small">
            <el-icon><Delete /></el-icon> 清空
          </el-button>
        </div>
      </div>

      <!-- 中间声音设置 -->
      <div class="voice-settings">
        <h3>声音设置</h3>
        
        <div class="setting-group">
          <label>选择声音</label>
          <el-select v-model="selectedVoice" class="voice-selector">
            <el-option-group label="男声">
              <el-option 
                v-for="voice in maleVoices" 
                :key="voice.id" 
                :label="voice.name" 
                :value="voice.id"
              >
                <div class="voice-option">
                  <span>{{ voice.name }}</span>
                  <el-tag size="small" :type="voice.type === 'standard' ? 'success' : 'info'">
                    {{ voice.type === 'standard' ? '标准' : '高级' }}
                  </el-tag>
                </div>
              </el-option>
            </el-option-group>
            <el-option-group label="女声">
              <el-option 
                v-for="voice in femaleVoices" 
                :key="voice.id" 
                :label="voice.name" 
                :value="voice.id"
              >
                <div class="voice-option">
                  <span>{{ voice.name }}</span>
                  <el-tag size="small" :type="voice.type === 'standard' ? 'success' : 'info'">
                    {{ voice.type === 'standard' ? '标准' : '高级' }}
                  </el-tag>
                </div>
              </el-option>
            </el-option-group>
            <el-option-group label="多角色">
              <el-option 
                v-for="voice in multiRoleVoices" 
                :key="voice.id" 
                :label="voice.name" 
                :value="voice.id"
              >
                <div class="voice-option">
                  <span>{{ voice.name }}</span>
                  <el-tag size="small" type="warning">多角色</el-tag>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </div>

        <div class="setting-group">
          <label>语速</label>
          <div class="speed-control">
            <el-slider 
              v-model="speed" 
              :min="0.5" 
              :max="2" 
              :step="0.1" 
              :marks="speedMarks"
            />
            <span class="speed-value">{{ speed }}x</span>
          </div>
        </div>

        <div class="setting-group">
          <label>音调</label>
          <div class="pitch-control">
            <el-slider 
              v-model="pitch" 
              :min="-12" 
              :max="12" 
              :step="1" 
              :marks="pitchMarks"
            />
            <span class="pitch-value">{{ pitch > 0 ? '+' : '' }}{{ pitch }}半音</span>
          </div>
        </div>

        <div class="setting-group">
          <label>音量</label>
          <div class="volume-control">
            <el-slider 
              v-model="volume" 
              :min="0" 
              :max="100" 
              :step="1"
            />
            <span class="volume-value">{{ volume }}%</span>
          </div>
        </div>

        <div class="setting-group">
          <label>情感强度</label>
          <el-radio-group v-model="emotion" class="emotion-group">
            <el-radio-button label="neutral">中性</el-radio-button>
            <el-radio-button label="happy">欢快</el-radio-button>
            <el-radio-button label="sad">悲伤</el-radio-button>
            <el-radio-button label="angry">愤怒</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 右侧预览和控制 -->
      <div class="preview-control">
        <h3>预览与控制</h3>
        
        <div class="audio-player">
          <div class="player-controls">
            <el-button-group>
              <el-button @click="playPreview" size="large" circle>
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-button @click="pausePreview" size="large" circle>
                <el-icon><VideoPause /></el-icon>
              </el-button>
              <el-button @click="stopPreview" size="large" circle>
                <el-icon><CircleClose /></el-icon>
              </el-button>
            </el-button-group>
          </div>
          
          <div class="progress-container">
            <el-slider 
              v-model="playbackProgress" 
              :max="100" 
              :disabled="!isGenerated"
              @change="seekAudio"
            />
            <div class="time-display">
              <span>{{ formatTime(currentTime) }}</span>
              <span>/</span>
              <span>{{ formatTime(totalDuration) }}</span>
            </div>
          </div>

          <div class="waveform-container" v-if="isGenerated">
            <div class="waveform" :style="{ background: `linear-gradient(90deg, #409eff ${playbackProgress}%, #e4e7ed ${playbackProgress}%)` }">
              <div class="wave-bars">
                <div 
                  v-for="(bar, index) in waveformBars" 
                  :key="index"
                  class="wave-bar"
                  :style="{ height: bar + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="generation-status" v-if="isGenerating">
          <el-progress 
            :percentage="generationProgress" 
            :status="generationStatus"
            :stroke-width="6"
          />
          <p class="status-text">{{ generationText }}</p>
        </div>

        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            @click="generateAudio"
            :loading="isGenerating"
            :disabled="!textContent.trim()"
          >
            <el-icon><Microphone /></el-icon>
            {{ isGenerating ? '生成中...' : '开始合成' }}
          </el-button>
          
          <el-button 
            type="success" 
            size="large" 
            @click="downloadAudio"
            :disabled="!isGenerated"
          >
            <el-icon><Download /></el-icon>
            下载音频
          </el-button>
        </div>

        <div class="history-panel">
          <h4>历史记录</h4>
          <el-scrollbar height="200px">
            <div 
              v-for="(item, index) in generationHistory" 
              :key="index"
              class="history-item"
            >
              <div class="history-text">{{ item.text.substring(0, 50) }}...</div>
              <div class="history-info">
                <span>{{ item.voice }}</span>
                <span>{{ formatDate(item.createdAt) }}</span>
              </div>
              <el-button size="small" @click="loadHistory(item)">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { VideoPlay, VideoPause, CircleClose, Microphone, Download, Timer, Delete, Refresh } from '@element-plus/icons-vue'

// 数据
const textContent = ref('')
const selectedVoice = ref('xiaoyun')
const speed = ref(1.0)
const pitch = ref(0)
const volume = ref(80)
const emotion = ref('neutral')

const playbackProgress = ref(0)
const currentTime = ref(0)
const totalDuration = ref(0)
const isGenerated = ref(false)
const isGenerating = ref(false)
const generationProgress = ref(0)
const generationStatus = ref('')
const generationText = ref('')

// 声音选项
const maleVoices = ref([
  { id: 'xiaogang', name: '小刚', type: 'standard' },
  { id: 'xiaoming', name: '小明', type: 'standard' },
  { id: 'xiaowang', name: '小王', type: 'premium' }
])

const femaleVoices = ref([
  { id: 'xiaoyun', name: '小云', type: 'standard' },
  { id: 'xiaomei', name: '小美', type: 'standard' },
  { id: 'xiaoli', name: '小丽', type: 'premium' }
])

const multiRoleVoices = ref([
  { id: 'storyteller', name: '故事讲述者' },
  { id: 'newsreader', name: '新闻播报员' },
  { id: 'commentator', name: '解说员' }
])

const generationHistory = ref([])

// 配置
const speedMarks = ref({
  0.5: '0.5x',
  1: '1.0x',
  1.5: '1.5x',
  2: '2.0x'
})

const pitchMarks = ref({
  '-12': '-12',
  '-6': '-6',
  0: '0',
  6: '+6',
  12: '+12'
})

const waveformBars = ref([])

// 方法
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const insertPause = () => {
  textContent.value += '[停顿2秒]'
}

const clearText = () => {
  textContent.value = ''
}

const generateAudio = async () => {
  if (!textContent.value.trim()) return
  
  isGenerating.value = true
  generationProgress.value = 0
  generationText.value = '正在准备合成...'
  
  // 模拟生成过程
  const steps = [
    { progress: 20, text: '正在分析文本...' },
    { progress: 40, text: '正在处理语音...' },
    { progress: 70, text: '正在合成音频...' },
    { progress: 90, text: '正在优化质量...' },
    { progress: 100, text: '合成完成！' }
  ]
  
  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 800))
    generationProgress.value = step.progress
    generationText.value = step.text
  }
  
  isGenerating.value = false
  isGenerated.value = true
  totalDuration.value = Math.ceil(textContent.value.length / 5) // 模拟时长
  
  // 生成波形数据
  waveformBars.value = Array.from({ length: 100 }, () => Math.random() * 80 + 10)
  
  // 添加到历史记录
  generationHistory.value.unshift({
    text: textContent.value,
    voice: selectedVoice.value,
    speed: speed.value,
    pitch: pitch.value,
    volume: volume.value,
    emotion: emotion.value,
    createdAt: new Date()
  })
}

const playPreview = () => {
  if (!isGenerated.value) return
  
  // 模拟播放
  const interval = setInterval(() => {
    playbackProgress.value += 1
    currentTime.value = (playbackProgress.value / 100) * totalDuration.value
    
    if (playbackProgress.value >= 100) {
      clearInterval(interval)
      playbackProgress.value = 0
      currentTime.value = 0
    }
  }, totalDuration.value * 10)
}

const pausePreview = () => {
  // 模拟暂停
  console.log('Pause preview')
}

const stopPreview = () => {
  playbackProgress.value = 0
  currentTime.value = 0
}

const seekAudio = (progress) => {
  currentTime.value = (progress / 100) * totalDuration.value
}

const downloadAudio = () => {
  // 模拟下载
  const blob = new Blob([textContent.value], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `语音合成_${new Date().getTime()}.wav`
  a.click()
  URL.revokeObjectURL(url)
}

const loadHistory = (item) => {
  textContent.value = item.text
  selectedVoice.value = item.voice
  speed.value = item.speed
  pitch.value = item.pitch
  volume.value = item.volume
  emotion.value = item.emotion
}

onMounted(() => {
  // 初始化示例数据
  textContent.value = '欢迎使用AI语音合成器！这是一段示例文本，用于测试语音合成效果。'
  
  // 生成示例波形
  waveformBars.value = Array.from({ length: 100 }, () => Math.random() * 80 + 10)
})
</script>

<style scoped>
.voice-synthesizer {
  height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.synthesizer-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.input-panel,
.voice-settings,
.preview-control {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.input-panel {
  width: 300px;
}

.voice-settings {
  width: 350px;
}

.preview-control {
  width: 350px;
}

.input-panel h3,
.voice-settings h3,
.preview-control h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.text-input {
  margin-bottom: 15px;
}

.quick-actions {
  display: flex;
  gap: 10px;
}

.setting-group {
  margin-bottom: 25px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #666;
}

.voice-selector {
  width: 100%;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speed-control,
.pitch-control,
.volume-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.speed-value,
.pitch-value,
.volume-value {
  min-width: 60px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.emotion-group {
  width: 100%;
}

.audio-player {
  margin-bottom: 20px;
}

.player-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.progress-container {
  margin-bottom: 15px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.waveform-container {
  margin-bottom: 15px;
}

.waveform {
  height: 60px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.wave-bars {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 1px;
  padding: 5px;
}

.wave-bar {
  flex: 1;
  background: #409eff;
  min-height: 2px;
  border-radius: 1px;
  transition: height 0.1s;
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

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
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
  border-radius: 4px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.history-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 159, 255, 0.2);
}

.history-text {
  flex: 1;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-info {
  display: flex;
  flex-direction: column;
  font-size: 11px;
  color: #999;
}

.history-info span:first-child {
  font-weight: bold;
  color: #333;
}
</style>