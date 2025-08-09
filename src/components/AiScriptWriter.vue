<template>
  <div class="page-container">
    <h1 class="page-title">AI 影视化脚本创作</h1>
    <p class="page-subtitle">从一个想法到导演级分镜脚本，AI 全程助力。</p>

    <el-row :gutter="24">
      <!-- Left Column: Control Panel -->
      <el-col :span="7">
        <el-card class="feature-card control-panel">
          <template #header>
            <div class="card-header">
              <span>创作设置</span>
            </div>
          </template>
          
          <!-- 模板选择对话框 -->
          <el-dialog v-model="showTemplateDialog" title="选择模板" width="500px">
            <div v-if="templates.length === 0" style="text-align: center; color: #999">
              暂无保存的模板
            </div>
            <div v-else>
              <div 
                v-for="template in templates" 
                :key="template.timestamp"
                class="template-item"
                @click="applyTemplate(template)"
                style="padding: 10px; border: 1px solid #eee; margin-bottom: 10px; border-radius: 4px; cursor: pointer"
              >
                <div style="font-weight: bold">{{ template.name }}</div>
                <div style="font-size: 12px; color: #666">
                  {{ new Date(template.timestamp).toLocaleString() }}
                </div>
              </div>
            </div>
          </el-dialog>
    
          <el-alert
            title="⚠️ 演示模式：当前为模拟生成，实际使用时将连接真实AI服务"
            type="warning"
            :closable="false"
            style="margin-bottom: 15px"
          />
          
          <el-form :model="form" label-position="top">
            <el-form-item label="项目文件夹">
              <el-input v-model="projectPath" placeholder="未设置" readonly>
                <template #append>
                  <el-button @click="selectProjectFolder">选择...</el-button>
                </template>
              </el-input>
              <div style="margin-top: 10px">
                <el-input 
                  v-model="projectSearch" 
                  placeholder="搜索项目..." 
                  :prefix-icon="Search"
                  clearable
                />
              </div>
            </el-form-item>
            <el-form-item label="故事核心主题">
              <el-input
                v-model="form.topic"
                type="textarea"
                :rows="3"
                placeholder="例如：一个程序员在赛博朋克都市中寻找丢失的数字猫"
              >
                <template #append>
                  <el-button @click="optimizeTitle" :icon="MagicStick">AI优化</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="热门标签推荐">
              <div style="display: flex; gap: 5px; flex-wrap: wrap">
                <el-tag
                  v-for="tag in recommendedTags"
                  :key="tag"
                  effect="plain"
                  style="cursor: pointer"
                  @click="addTag(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-form-item>

            <el-collapse v-model="activeCollapse" class="details-collapse">
              <el-collapse-item title="高级创作参数" name="1">
                <el-form-item label="主角设定 (可选)">
                  <el-input
                    v-model="form.characterBio"
                    type="textarea"
                    :rows="3"
                    placeholder="主角姓名、身份、性格、目标等"
                  />
                </el-form-item>
                <el-form-item label="故事大纲 (可选)">
                  <el-input
                    v-model="form.storyOutline"
                    type="textarea"
                    :rows="5"
                    placeholder="故事的起因、经过、高潮、结局"
                  />
                </el-form-item>
                <el-form-item label="指定场景 (可选)">
                  <el-input
                    v-model="form.specificScenes"
                    type="textarea"
                    :rows="3"
                    placeholder="希望必须出现的具体场景或情节，每行一个"
                  />
                </el-form-item>
                <el-form-item label="负向提示词 (可选)">
                  <el-input
                    v-model="form.negativePrompt"
                    type="textarea"
                    :rows="2"
                    placeholder="例如：避免出现暴力、血腥内容"
                  />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>

            <el-form-item label="选择视频风格">
              <el-select v-model="form.style" placeholder="请选择风格" style="width: 100%;">
                <el-option label="赛博朋克" value="cyberpunk" />
                <el-option label="科幻未来" value="sci-fi" />
                <el-option label="国风奇幻" value="fantasy-guofeng" />
                <el-option label="温情日常" value="slice-of-life" />
              </el-select>
            </el-form-item>
            <el-form-item label="预估镜头数">
              <el-input-number v-model="form.shots" :min="3" :max="20" style="width: 100%;" />
            </el-form-item>
            
            <el-form-item>
              <el-row :gutter="10" style="width: 100%;">
                <el-col :span="12">
                  <el-button :icon="FolderOpened" @click="loadProject" style="width: 100%;">加载项目</el-button>
                </el-col>
                <el-col :span="12">
                  <el-button type="primary" :icon="FolderAdd" @click="saveProject" style="width: 100%;">保存项目</el-button>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="generateScript" :loading="loading" size="large" style="width: 100%;">
                <el-icon style="margin-right: 8px;"><MagicStick /></el-icon>
                {{ loading ? 'AI 正在全力创作中...' : '生成导演级脚本' }}
              </el-button>
              <div style="margin-top: 10px; display: flex; gap: 5px">
                <el-button @click="saveAsTemplate" type="warning" plain style="flex: 1">
                  保存模板
                </el-button>
                <el-button @click="loadTemplate" type="info" plain style="flex: 1">
                  加载模板
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- Right Column: Results -->
      <el-col :span="17">
        <div class="result-container" v-loading="loading" element-loading-text="AI思考中，请稍候...">
          <div v-if="!result" class="placeholder">
            <el-empty description="在左侧输入创作要求，开始您的AI影视之旅" />
          </div>
          <div v-else>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="result-card">
                  <template #header>
                    <div class="card-header-content">
                      <span>故事简介</span>
                      <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('synopsis')" />
                    </div>
                  </template>
                  <el-input v-model="result.synopsis" type="textarea" autosize class="result-text-input" />
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="result-card">
                  <template #header>
                    <div class="card-header-content">
                      <span>场景预设</span>
                      <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('scenePreset')" />
                    </div>
                  </template>
                  <el-input v-model="result.scenePreset" type="textarea" autosize class="result-text-input" />
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="result-card">
                  <template #header>
                    <div class="card-header-content">
                      <span>人物预设</span>
                      <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('characterPreset')" />
                    </div>
                  </template>
                  <el-input v-model="result.characterPreset" type="textarea" autosize class="result-text-input" />
                </el-card>
              </el-col>
            </el-row>

            <el-card class="table-card">
              <template #header>
                <div class="card-header-content">
                  <span>📋 分镜脚本</span>
                  <div>
                    <el-button :icon="Refresh" @click="regenerateTable">重新生成</el-button>
                    <el-button :icon="Download" @click="exportTable">导出表格</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="tableData" style="width: 100%" border>
                <el-table-column prop="shot" label="镜头" width="80" align="center" />
                <el-table-column prop="scene" label="场景描述" min-width="200" />
                <el-table-column prop="duration" label="时长" width="80" align="center" />
                <el-table-column prop="camera" label="运镜" width="100" />
                <el-table-column prop="effect" label="特效" width="100" />
                <el-table-column label="画面" width="180" align="center">
                  <template #default="scope">
                    <div class="media-container">
                      <el-image 
                        v-if="scope.row.imageUrl" 
                        :src="scope.row.imageUrl" 
                        class="shot-image" 
                        fit="cover"
                      >
                        <template #error>
                          <div class="image-slot">
                            <el-icon><Picture /></el-icon>
                          </div>
                        </template>
                      </el-image>
                      <div v-else class="shot-image">
                        <el-icon><Picture /></el-icon>
                      </div>
                      <div class="media-overlay">
                        <div class="media-actions">
                          <el-button 
                            size="small" 
                            :icon="PictureRounded" 
                            circle 
                            @click="generateImage(scope.$index)"
                          />
                          <el-button 
                            size="small" 
                            :icon="VideoCamera" 
                            circle 
                            @click="generateVideo(scope.$index)"
                          />
                        </div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <div class="optimization-panel">
              <h3 class="optimization-title">优化工具</h3>
              <el-row :gutter="20">
                <el-col :span="12"><SmartRecommendations /></el-col>
                <el-col :span="12"><CacheManager /></el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, FolderOpened, FolderAdd, Search, Refresh, Download, Picture, PictureRounded, VideoCamera } from '@element-plus/icons-vue'
import SmartRecommendations from './SmartRecommendations.vue'
import CacheManager from './CacheManager.vue'

const projectPath = ref('')
const projectSearch = ref('')
const loading = ref(false)
const result = ref(null)
const activeCollapse = ref(['1'])
const showTemplateDialog = ref(false)
const templates = ref([])

const form = reactive({
  topic: '',
  style: 'cyberpunk',
  shots: 8,
  characterBio: '',
  storyOutline: '',
  specificScenes: '',
  negativePrompt: ''
})

const recommendedTags = ref([
  '#科幻', '#赛博朋克', '#AI', '#未来', '#科技', '#都市', '#奇幻', '#冒险'
])

const tableData = ref([])

const addTag = (tag) => {
  if (!form.topic.includes(tag)) {
    form.topic += ' ' + tag
  }
}

const optimizeTitle = () => {
  if (!form.topic.trim()) {
    ElMessage.warning('请先输入故事主题')
    return
  }
  
  const optimizations = [
    '程序员找回数字猫的赛博朋克之旅',
    '霓虹都市下的代码与温情：寻找AI伙伴',
    '当代码遇见情感：数字世界的寻猫奇遇'
  ]
  
  form.topic = optimizations[Math.floor(Math.random() * optimizations.length)]
  ElMessage.success('标题已优化！')
}

const generateScript = async () => {
  if (!form.topic.trim()) {
    ElMessage.warning('请输入故事主题')
    return
  }

  loading.value = true
  
  // 模拟AI生成过程
  setTimeout(() => {
    result.value = {
      synopsis: `在一个${form.style === 'cyberpunk' ? '霓虹闪烁的未来都市' : '奇幻世界'}中，${form.topic}的故事展开。主角将经历一段充满挑战与发现的旅程，最终找到内心的答案。`,
      scenePreset: `故事发生在${form.style === 'cyberpunk' ? '高楼林立的赛博朋克都市，霓虹灯映照下的雨夜街道' : '充满魔法与科技的奇幻王国'}，营造出${form.style === 'cyberpunk' ? '冷峻而充满希望' : '神秘而温馨'}的氛围。`,
      characterPreset: `主角是一位${form.characterBio || '勇敢而富有同情心的探索者'}，在寻找${form.topic.split('寻找')[1] || '失落的记忆'}的过程中逐渐成长。`
    }

    // 生成分镜脚本
    tableData.value = Array.from({ length: form.shots }, (_, i) => ({
      shot: i + 1,
      scene: `第${i + 1}个镜头：${form.topic.substring(0, 20)}...`,
      duration: `${Math.floor(Math.random() * 5) + 3}秒`,
      camera: ['推镜', '拉镜', '摇摄', '移摄', '跟拍'][Math.floor(Math.random() * 5)],
      effect: ['淡入淡出', '闪白', '缩放', '旋转', '静止'][Math.floor(Math.random() * 5)],
      imageUrl: ''
    }))

    loading.value = false
    ElMessage.success('AI脚本生成完成！')
  }, 2000)
}

const regeneratePart = (part) => {
  const variations = {
    synopsis: [
      '这是一个关于勇气与发现的故事，主角在未知的旅程中找到了真正的自我。',
      '在科技与情感的交织中，故事展现了人性最美好的一面。',
      '一段跨越时空的冒险，最终回归内心的平静与成长。'
    ],
    scenePreset: [
      '光影交错的视觉效果，营造出梦幻而真实的氛围。',
      '细腻的环境刻画，让每个场景都充满生命力。',
      '色彩与构图的完美结合，呈现出电影般的质感。'
    ],
    characterPreset: [
      '角色的内心变化贯穿始终，展现人性的复杂与美好。',
      '每个角色都有独特的个性和动人的成长轨迹。',
      '通过角色的眼睛，我们看到了更广阔的世界。'
    ]
  }
  
  if (result.value && variations[part]) {
    const options = variations[part]
    result.value[part] = options[Math.floor(Math.random() * options.length)]
  }
}

const regenerateTable = () => {
  tableData.value = Array.from({ length: form.shots }, (_, i) => ({
    shot: i + 1,
    scene: `重新生成的第${i + 1}个镜头内容`,
    duration: `${Math.floor(Math.random() * 5) + 3}秒`,
    camera: ['推镜', '拉镜', '摇摄', '移摄', '跟拍'][Math.floor(Math.random() * 5)],
    effect: ['淡入淡出', '闪白', '缩放', '旋转', '静止'][Math.floor(Math.random() * 5)],
    imageUrl: ''
  }))
}

const exportTable = () => {
  const data = tableData.value.map(row => ({
    镜头: row.shot,
    场景描述: row.scene,
    时长: row.duration,
    运镜: row.camera,
    特效: row.effect
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '分镜脚本')
  XLSX.writeFile(wb, `${form.topic || 'AI脚本'}.xlsx`)
}

const generateImage = (index) => {
  ElMessage.info(`正在生成第${index + 1}个镜头的图片...`)
  tableData.value[index].imageUrl = `https://via.placeholder.com/160x100?text=镜头${index + 1}`
}

const generateVideo = (index) => {
  ElMessage.info(`正在生成第${index + 1}个镜头的视频预览...`)
}

const saveAsTemplate = () => {
  if (!form.topic.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  const template = {
    name: form.topic,
    form: { ...form },
    timestamp: Date.now()
  }
  
  templates.value.push(template)
  localStorage.setItem('aiScriptTemplates', JSON.stringify(templates.value))
  ElMessage.success('模板已保存！')
}

const loadTemplate = () => {
  showTemplateDialog.value = true
}

const applyTemplate = (template) => {
  Object.assign(form, template.form)
  showTemplateDialog.value = false
  ElMessage.success(`模板 "${template.name}" 已应用`)
}

const saveProject = () => {
  if (!form.topic && !result.value) {
    ElMessage.warning('没有可保存的内容！')
    return
  }
  try {
    const projectData = {
      form: form,
      result: result.value,
      tableData: tableData.value
    }
    const dataStr = JSON.stringify(projectData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const sanitizeFilename = (name) => {
      if (!name) return 'ai-project'
      return name.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 50)
    }
    link.href = url
    link.download = `${sanitizeFilename(form.topic)}.aiproj.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('项目已保存！')
  } catch (error) {
    console.error('Failed to save project:', error)
    ElMessage.error('项目保存失败！')
  }
}

const loadProject = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.aiproj.json,application/json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (res) => {
      try {
        const projectData = JSON.parse(res.target.result)
        if (projectData.form && projectData.result) {
          Object.assign(form, projectData.form)
          result.value = projectData.result
          tableData.value = projectData.tableData || []
          ElMessage.success(`项目 "${form.topic}" 已加载！`)
        } else {
          ElMessage.error('无效的项目文件格式！')
        }
      } catch (error) {
        console.error('Failed to load project:', error)
        ElMessage.error('加载项目失败！')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const selectProjectFolder = async () => {
  const path = await window.electronAPI.selectDirectory()
  if (path) {
    projectPath.value = path
    ElMessage.success(`项目文件夹已设置为：${path}`)
  }
}

onMounted(() => {
  const savedTemplates = localStorage.getItem('aiScriptTemplates')
  if (savedTemplates) {
    templates.value = JSON.parse(savedTemplates)
  }

  // Load last session from localStorage
  const savedForm = localStorage.getItem('aiScriptWriterForm')
  if (savedForm) {
    Object.assign(form, JSON.parse(savedForm))
    ElMessage.success('已恢复上次的编辑内容')
  }
})

// Debounce function
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Watch for form changes and save to localStorage
watch(form, debounce((newForm) => {
  localStorage.setItem('aiScriptWriterForm', JSON.stringify(newForm))
}, 500))
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
.control-panel, .result-container {
  display: flex;
  flex-direction: column;
}
.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.card-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.result-card {
  margin-bottom: 20px;
}
.result-text-input .el-textarea__inner {
  box-shadow: none !important;
  border: 1px solid transparent;
  background-color: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color-primary);
  resize: none;
}
.result-text-input .el-textarea__inner:hover {
  border-color: var(--border-color);
}
.result-text-input .el-textarea__inner:focus {
  border-color: var(--accent-color);
}
.table-card {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.el-table {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: #fafafa;
  --el-table-tr-bg-color: var(--card-bg-color);
  --el-table-row-hover-bg-color: #ecf5ff;
  --el-table-header-text-color: var(--text-color-secondary);
  border-radius: 8px;
  overflow: hidden;
}
.el-table th.el-table__cell {
  font-weight: 600;
  color: var(--text-color-secondary);
}
.media-container {
  position: relative;
  width: 160px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
}
.shot-image, .shot-video {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  object-fit: cover;
}
.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.media-container:hover .media-overlay {
  opacity: 1;
}
.media-actions {
  display: flex;
  gap: 10px;
}
.image-slot {
  font-size: 24px;
  color: #c0c4cc;
}
.details-collapse {
  margin-bottom: 18px;
  border-top: none;
  border-bottom: none;
}
.details-collapse .el-collapse-item__header {
  border-bottom: none;
  font-size: 14px;
  font-weight: 500;
}
.details-collapse .el-collapse-item__wrap {
  border-bottom: none;
}
.details-collapse .el-collapse-item__content {
  padding-bottom: 0;
}
.optimization-panel {
  margin-top: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}
.optimization-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}
</style>
