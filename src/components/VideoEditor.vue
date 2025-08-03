<template>
  <div class="video-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <el-button-group>
        <el-button @click="importMedia" size="small">
          <el-icon><Upload /></el-icon> 导入素材
        </el-button>
        <el-button @click="saveProject" size="small">
              <el-icon><FolderOpened /></el-icon> 保存项目
            </el-button>
        <el-button @click="exportVideo" type="primary" size="small">
          <el-icon><VideoPlay /></el-icon> 导出视频
        </el-button>
      </el-button-group>
    </div>

    <div class="editor-layout">
      <!-- 左侧素材区 -->
      <div class="media-panel">
        <h3>素材库</h3>
        <el-tabs v-model="activeTab" class="media-tabs">
          <el-tab-pane label="视频" name="video">
            <div class="media-grid">
              <div 
                v-for="video in videoAssets" 
                :key="video.id"
                class="media-item"
                draggable="true"
                @dragstart="handleDragStart($event, video)"
              >
                <video :src="video.url" @loadedmetadata="video.duration = $event.target.duration" />
                <div class="media-info">
                  <span>{{ video.name }}</span>
                  <small>{{ formatDuration(video.duration) }}</small>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="图片" name="image">
            <div class="media-grid">
              <div 
                v-for="image in imageAssets" 
                :key="image.id"
                class="media-item"
                draggable="true"
                @dragstart="handleDragStart($event, image)"
              >
                <img :src="image.url" :alt="image.name" />
                <div class="media-info">
                  <span>{{ image.name }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="音频" name="audio">
            <div class="media-grid">
              <div 
                v-for="audio in audioAssets" 
                :key="audio.id"
                class="media-item"
                draggable="true"
                @dragstart="handleDragStart($event, audio)"
              >
                <el-icon><Headset /></el-icon>
                <div class="media-info">
                  <span>{{ audio.name }}</span>
                  <small>{{ formatDuration(audio.duration) }}</small>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中央预览区 -->
      <div class="preview-area">
        <div class="video-container">
          <video 
            ref="videoPlayer" 
            :src="previewVideo" 
            controls
            @timeupdate="updateCurrentTime"
          />
        </div>
        <div class="playback-controls">
          <el-button-group>
            <el-button @click="play" size="small">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button @click="pause" size="small">
              <el-icon><VideoPause /></el-icon>
            </el-button>
            <el-button @click="stop" size="small">
              <el-icon><CircleClose /></el-icon>
            </el-button>
          </el-button-group>
          <span class="time-display">{{ formatDuration(currentTime) }} / {{ formatDuration(totalDuration) }}</span>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="properties-panel">
        <h3>属性设置</h3>
        <div v-if="selectedClip">
          <div class="property-group">
            <label>剪辑信息</label>
            <div class="property-item">
              <span>开始时间:</span>
              <el-input-number v-model="selectedClip.start" :min="0" :step="0.1" size="small" />
            </div>
            <div class="property-item">
              <span>持续时间:</span>
              <el-input-number v-model="selectedClip.duration" :min="0.1" :step="0.1" size="small" />
            </div>
          </div>
          <div class="property-group">
            <label>视觉效果</label>
            <div class="property-item">
              <span>透明度:</span>
              <el-slider v-model="selectedClip.opacity" :min="0" :max="1" :step="0.1" />
            </div>
            <div class="property-item">
              <span>缩放:</span>
              <el-slider v-model="selectedClip.scale" :min="0.1" :max="3" :step="0.1" />
            </div>
          </div>
        </div>
        <div v-else class="no-selection">
          请选择一个剪辑片段
        </div>
      </div>
    </div>

    <!-- 底部时间轴 -->
    <div class="timeline-area">
      <div class="timeline-toolbar">
        <el-button-group>
          <el-button @click="zoomIn" size="small">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button @click="zoomOut" size="small">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="timeline-container" @drop="handleDrop" @dragover.prevent>
        <div class="timeline-tracks">
          <div class="track-labels">
            <div class="track-label">视频轨道</div>
            <div class="track-label">音频轨道</div>
          </div>
          
          <div class="track-content">
            <div class="video-track track">
              <div 
                v-for="clip in videoClips" 
                :key="clip.id"
                class="timeline-clip"
                :class="{ selected: selectedClip?.id === clip.id }"
                :style="getClipStyle(clip)"
                @click="selectClip(clip)"
              >
                <span>{{ clip.name }}</span>
              </div>
            </div>
            
            <div class="audio-track track">
              <div 
                v-for="clip in audioClips" 
                :key="clip.id"
                class="timeline-clip audio-clip"
                :class="{ selected: selectedClip?.id === clip.id }"
                :style="getClipStyle(clip)"
                @click="selectClip(clip)"
              >
                <span>{{ clip.name }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="timeline-ruler">
          <div 
            v-for="mark in timelineMarks" 
            :key="mark.time"
            class="time-mark"
            :style="{ left: mark.position + 'px' }"
          >
            {{ mark.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Upload, FolderOpened, VideoPlay, VideoPause, CircleClose, Headset, ZoomIn, ZoomOut } from '@element-plus/icons-vue'

// 媒体资产
const videoAssets = ref([
  { id: 1, name: '示例视频1.mp4', url: '/sample1.mp4', duration: 120 },
  { id: 2, name: '示例视频2.mp4', url: '/sample2.mp4', duration: 180 }
])

const imageAssets = ref([
  { id: 3, name: '背景图1.jpg', url: '/bg1.jpg' },
  { id: 4, name: '背景图2.jpg', url: '/bg2.jpg' }
])

const audioAssets = ref([
  { id: 5, name: '背景音乐.mp3', url: '/music.mp3', duration: 240 }
])

// 时间轴数据
const videoClips = ref([])
const audioClips = ref([])
const selectedClip = ref(null)
const currentTime = ref(0)
const totalDuration = ref(300)
const zoomLevel = ref(1)

// 状态
const activeTab = ref('video')
const previewVideo = ref('')
const videoPlayer = ref(null)

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const importMedia = () => {
  // 模拟导入素材
  console.log('Importing media...')
}

const saveProject = () => {
  // 保存项目逻辑
  console.log('Saving project...')
}

const exportVideo = () => {
  // 导出视频逻辑
  console.log('Exporting video...')
}

const play = () => {
  if (videoPlayer.value) {
    videoPlayer.value.play()
  }
}

const pause = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
}

const stop = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
}

const updateCurrentTime = (e) => {
  currentTime.value = e.target.currentTime
}

const handleDragStart = (e, asset) => {
  e.dataTransfer.setData('application/json', JSON.stringify(asset))
}

const handleDrop = (e) => {
  const asset = JSON.parse(e.dataTransfer.getData('application/json'))
  const rect = e.target.getBoundingClientRect()
  const dropTime = ((e.clientX - rect.left) / rect.width) * totalDuration.value
  
  const newClip = {
    id: Date.now(),
    name: asset.name,
    start: dropTime,
    duration: asset.duration || 5,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    asset: asset
  }
  
  if (asset.url.includes('.mp4') || asset.url.includes('.jpg')) {
    videoClips.value.push(newClip)
  } else if (asset.url.includes('.mp3')) {
    audioClips.value.push(newClip)
  }
}

const selectClip = (clip) => {
  selectedClip.value = clip
}

const getClipStyle = (clip) => ({
  left: (clip.start / totalDuration.value * 100) + '%',
  width: (clip.duration / totalDuration.value * 100) + '%'
})

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.5, 5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.5, 0.5)
}

const timelineMarks = computed(() => {
  const marks = []
  const step = 30
  for (let i = 0; i <= totalDuration.value; i += step) {
    marks.push({
      time: i,
      label: formatDuration(i),
      position: (i / totalDuration.value * 100) * zoomLevel.value
    })
  }
  return marks
})

onMounted(() => {
  // 初始化一些示例数据
  videoClips.value = [
    { id: 1, name: '视频片段1', start: 0, duration: 60, x: 0, y: 0, scale: 1, opacity: 1 },
    { id: 2, name: '视频片段2', start: 70, duration: 50, x: 0, y: 0, scale: 1, opacity: 1 }
  ]
})
</script>

<style scoped>
.video-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.editor-toolbar {
  padding: 10px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.editor-layout {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px;
}

.media-panel {
  width: 250px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.media-panel h3 {
  margin: 0;
  padding: 15px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.media-tabs {
  height: calc(100% - 60px);
}

.media-grid {
  display: grid;
  gap: 10px;
  padding: 15px;
  max-height: 100%;
  overflow-y: auto;
}

.media-item {
  cursor: grab;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.media-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 159, 255, 0.2);
}

.media-item img,
.media-item video {
  width: 100%;
  height: 80px;
  object-fit: cover;
}

.media-info {
  padding: 8px;
  font-size: 12px;
}

.media-info span {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  padding: 15px;
}

.video-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-container video {
  max-width: 100%;
  max-height: 100%;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.time-display {
  font-family: monospace;
  font-size: 14px;
  color: #666;
}

.properties-panel {
  width: 250px;
  background: white;
  border-radius: 8px;
  padding: 15px;
}

.properties-panel h3 {
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.property-group {
  margin-bottom: 20px;
}

.property-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.property-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.timeline-area {
  height: 200px;
  background: white;
  border-radius: 8px;
  margin: 0 10px 10px;
  overflow: hidden;
}

.timeline-toolbar {
  padding: 10px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.timeline-container {
  height: calc(100% - 50px);
  position: relative;
  overflow-x: auto;
}

.timeline-tracks {
  display: flex;
  height: 100%;
}

.track-labels {
  width: 100px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.track-label {
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
  color: #666;
}

.track-content {
  flex: 1;
  position: relative;
}

.track {
  height: 50%;
  position: relative;
  border-bottom: 1px solid #e4e7ed;
}

.timeline-clip {
  position: absolute;
  top: 5px;
  bottom: 5px;
  background: #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
}

.timeline-clip:hover {
  background: #66b1ff;
}

.timeline-clip.selected {
  background: #3a8ee6;
  box-shadow: 0 0 0 2px #409eff;
}

.timeline-clip span {
  display: block;
  padding: 5px;
  font-size: 12px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.audio-clip {
  background: #67c23a;
}

.audio-clip:hover {
  background: #85ce61;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 100px;
  right: 0;
  height: 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.time-mark {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 1px solid #dcdfe6;
  font-size: 10px;
  color: #666;
  padding-left: 2px;
}

.no-selection {
  text-align: center;
  color: #999;
  margin-top: 50px;
}
</style>