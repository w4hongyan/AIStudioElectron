<template>
  <div class="cover-designer">
    <div class="designer-layout">
      <!-- 左侧模板列表 -->
      <div class="template-panel">
        <h3>封面模板</h3>
        <div class="template-grid">
          <div 
            v-for="template in templates" 
            :key="template.id"
            class="template-item"
            :class="{ active: currentTemplate?.id === template.id }"
            @click="selectTemplate(template)"
          >
            <img :src="template.preview" :alt="template.name" />
            <span>{{ template.name }}</span>
          </div>
        </div>
      </div>

      <!-- 中央编辑画布 -->
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <el-button-group>
            <el-button @click="addText" size="small">
              <el-icon><Edit /></el-icon> 添加文字
            </el-button>
            <el-button @click="addImage" size="small">
              <el-icon><Picture /></el-icon> 添加图片
            </el-button>
            <el-button @click="undo" size="small">
              <el-icon><RefreshLeft /></el-icon> 撤销
            </el-button>
            <el-button @click="redo" size="small">
              <el-icon><RefreshRight /></el-icon> 重做
            </el-button>
          </el-button-group>
        </div>
        
        <div class="canvas-container" ref="canvasContainer">
          <div 
            class="design-canvas"
            :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
          >
            <div
              v-for="element in elements"
              :key="element.id"
              class="canvas-element"
              :class="{ selected: selectedElement?.id === element.id }"
              :style="getElementStyle(element)"
              @mousedown="startDrag($event, element)"
            >
              <img v-if="element.type === 'image'" :src="element.content" />
              <div v-else-if="element.type === 'text'" class="text-element">
                {{ element.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧样式设置 -->
      <div class="style-panel">
        <h3>样式设置</h3>
        <div v-if="selectedElement" class="style-controls">
          <div v-if="selectedElement.type === 'text'">
            <div class="control-group">
              <label>字体</label>
              <el-select v-model="selectedElement.style.fontFamily" size="small">
                <el-option label="微软雅黑" value="Microsoft YaHei" />
                <el-option label="宋体" value="SimSun" />
                <el-option label="黑体" value="SimHei" />
                <el-option label="Arial" value="Arial" />
              </el-select>
            </div>
            <div class="control-group">
              <label>字号</label>
              <el-input-number 
                v-model="selectedElement.style.fontSize" 
                :min="12" 
                :max="72" 
                size="small"
              />
            </div>
            <div class="control-group">
              <label>颜色</label>
              <el-color-picker v-model="selectedElement.style.color" size="small" />
            </div>
            <div class="control-group">
              <label>粗体</label>
              <el-switch v-model="selectedElement.style.fontWeight" active-value="bold" inactive-value="normal" />
            </div>
          </div>
          <div class="control-group">
            <label>位置</label>
            <div class="position-controls">
              <el-input-number v-model="selectedElement.x" :min="0" size="small" />
              <el-input-number v-model="selectedElement.y" :min="0" size="small" />
            </div>
          </div>
          <div class="control-group">
            <label>大小</label>
            <div class="size-controls">
              <el-input-number v-model="selectedElement.width" :min="10" size="small" />
              <el-input-number v-model="selectedElement.height" :min="10" size="small" />
            </div>
          </div>
        </div>
        <div v-else class="no-selection">
          请选择一个元素进行编辑
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-toolbar">
      <el-button type="primary" @click="exportCover">
        <el-icon><Download /></el-icon> 导出封面
      </el-button>
      <el-button @click="saveProject">
        <el-icon><FolderOpened /></el-icon> 保存项目
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Edit, Picture, RefreshLeft, RefreshRight, Download, FolderOpened } from '@element-plus/icons-vue'

const templates = ref([
  { id: 1, name: '简约科技', preview: '/templates/tech.jpg' },
  { id: 2, name: '清新文艺', preview: '/templates/art.jpg' },
  { id: 3, name: '商务专业', preview: '/templates/business.jpg' },
  { id: 4, name: '活力运动', preview: '/templates/sport.jpg' }
])

const currentTemplate = ref(null)
const elements = ref([])
const selectedElement = ref(null)
const canvasWidth = ref(1280)
const canvasHeight = ref(720)

const getElementStyle = (element) => ({
  left: element.x + 'px',
  top: element.y + 'px',
  width: element.width + 'px',
  height: element.height + 'px',
  ...element.style
})

const selectTemplate = (template) => {
  currentTemplate.value = template
  // 根据模板初始化画布
  elements.value = []
}

const addText = () => {
  const newText = {
    id: Date.now(),
    type: 'text',
    content: '双击编辑文字',
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    style: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 24,
      color: '#333',
      fontWeight: 'normal'
    }
  }
  elements.value.push(newText)
  selectedElement.value = newText
}

const addImage = () => {
  // 模拟选择图片
  const newImage = {
    id: Date.now(),
    type: 'image',
    content: '/placeholder.jpg',
    x: 200,
    y: 200,
    width: 300,
    height: 200,
    style: {}
  }
  elements.value.push(newImage)
  selectedElement.value = newImage
}

const startDrag = (e, element) => {
  selectedElement.value = element
  const startX = e.clientX - element.x
  const startY = e.clientY - element.y

  const handleMouseMove = (e) => {
    element.x = e.clientX - startX
    element.y = e.clientY - startY
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const undo = () => {
  // 实现撤销逻辑
  console.log('Undo')
}

const redo = () => {
  // 实现重做逻辑
  console.log('Redo')
}

const exportCover = () => {
  // 实现导出逻辑
  console.log('Exporting cover...')
}

const saveProject = () => {
  // 实现保存项目逻辑
  console.log('Saving project...')
}
</script>

<style scoped>
.cover-designer {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.designer-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.template-panel {
  width: 200px;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.template-grid {
  display: grid;
  gap: 10px;
  margin-top: 15px;
}

.template-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.template-item:hover,
.template-item.active {
  border-color: #409eff;
}

.template-item img {
  width: 100%;
  height: 80px;
  object-fit: cover;
}

.template-item span {
  display: block;
  text-align: center;
  padding: 5px;
  font-size: 12px;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.canvas-toolbar {
  margin-bottom: 15px;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.design-canvas {
  background: white;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.canvas-element {
  position: absolute;
  cursor: move;
  border: 1px solid transparent;
}

.canvas-element:hover {
  border-color: #409eff;
}

.canvas-element.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.text-element {
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-all;
}

.style-panel {
  width: 250px;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
}

.position-controls,
.size-controls {
  display: flex;
  gap: 10px;
}

.no-selection {
  text-align: center;
  color: #999;
  margin-top: 50px;
}

.bottom-toolbar {
  padding: 15px 20px;
  background: #f5f5f5;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>