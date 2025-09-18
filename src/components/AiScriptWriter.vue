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
            
            <el-form-item label="分镜脚本模式">
              <el-switch v-model="form.storyboardMode" active-text="启用分镜模式" inactive-text="标准模式" />
            </el-form-item>
            
            <el-collapse v-model="storyboardCollapse" class="storyboard-collapse" v-if="form.storyboardMode">
              <el-collapse-item title="🎬 分镜脚本设置" name="storyboard">
                <el-form-item label="画面风格描述">
                  <el-input
                    v-model="form.visualStyle"
                    type="textarea"
                    :rows="2"
                    placeholder="例如：赛博朋克霓虹灯光、电影级景深、4K超清画质"
                  />
                </el-form-item>
                <el-form-item label="镜头运动方式">
                  <el-select v-model="form.cameraMovement" placeholder="选择镜头运动" style="width: 100%;">
                    <el-option label="静态镜头" value="static" />
                    <el-option label="推拉镜头" value="push_pull" />
                    <el-option label="摇摄镜头" value="pan" />
                    <el-option label="跟拍镜头" value="tracking" />
                    <el-option label="旋转镜头" value="rotation" />
                    <el-option label="升降镜头" value="crane" />
                  </el-select>
                </el-form-item>
                <el-form-item label="光影效果">
                  <el-select v-model="form.lightingEffect" placeholder="选择光影效果" style="width: 100%;">
                    <el-option label="自然光" value="natural" />
                    <el-option label="戏剧性光影" value="dramatic" />
                    <el-option label="霓虹灯光" value="neon" />
                    <el-option label="逆光剪影" value="backlight" />
                    <el-option label="柔光滤镜" value="soft" />
                    <el-option label="硬光对比" value="hard" />
                  </el-select>
                </el-form-item>
                <el-form-item label="色彩调性">
                  <el-select v-model="form.colorTone" placeholder="选择色彩调性" style="width: 100%;">
                    <el-option label="冷色调" value="cool" />
                    <el-option label="暖色调" value="warm" />
                    <el-option label="高对比度" value="high_contrast" />
                    <el-option label="低饱和度" value="desaturated" />
                    <el-option label="赛博朋克" value="cyberpunk" />
                    <el-option label="复古胶片" value="vintage" />
                  </el-select>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
            
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
            <!-- 标准模式结果 -->
            <div v-if="!form.storyboardMode">
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
            </div>
            
            <!-- 分镜脚本模式结果 -->
            <div v-else>
              <el-row :gutter="20" style="margin-bottom: 20px;">
                <el-col :span="12">
                  <el-card class="result-card">
                    <template #header>
                      <div class="card-header-content">
                        <span>🎬 分镜脚本</span>
                        <el-button type="primary" :icon="Refresh" circle plain size="small" @click="regeneratePart('storyboard')" />
                      </div>
                    </template>
                    <div v-if="result.storyboard" class="storyboard-container">
                      <div v-for="(shot, index) in result.storyboard" :key="index" class="shot-item">
                        <div class="shot-header">
                          <span class="shot-number">镜头 {{ index + 1 }}</span>
                          <span class="shot-type">{{ shot.type }}</span>
                        </div>
                        <div class="shot-description">{{ shot.description }}</div>
                        <div class="shot-duration">时长: {{ shot.duration }}秒</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="result-card">
                    <template #header>
                      <div class="card-header-content">
                        <span>🎨 文生图提示词</span>
                        <el-button type="primary" :icon="CopyDocument" circle plain size="small" @click="copyPrompts('imagePrompts')" />
                      </div>
                    </template>
                    <div v-if="result.imagePrompts" class="prompts-container">
                      <div v-for="(prompt, index) in result.imagePrompts" :key="index" class="prompt-item">
                        <div class="prompt-title">场景 {{ index + 1 }}</div>
                        <el-input v-model="prompt.text" type="textarea" autosize readonly class="prompt-text" />
                        <el-button size="small" @click="copyPrompt(prompt.text)" style="margin-top: 5px;">
                          复制提示词
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="24">
                  <el-card class="result-card">
                    <template #header>
                      <div class="card-header-content">
                        <span>🎥 图生视频提示词</span>
                        <el-button type="primary" :icon="CopyDocument" circle plain size="small" @click="copyPrompts('videoPrompts')" />
                      </div>
                    </template>
                    <div v-if="result.videoPrompts" class="prompts-container">
                      <div v-for="(prompt, index) in result.videoPrompts" :key="index" class="prompt-item">
                        <div class="prompt-title">镜头 {{ index + 1 }}</div>
                        <div class="prompt-content">
                          <div><strong>画面描述:</strong> {{ prompt.imageDescription }}</div>
                          <div><strong>运动描述:</strong> {{ prompt.motionDescription }}</div>
                          <div><strong>相机运动:</strong> {{ prompt.cameraMovement }}</div>
                          <div><strong>时长:</strong> {{ prompt.duration }}秒</div>
                          <div><strong>完整提示词:</strong></div>
                          <el-input v-model="prompt.fullPrompt" type="textarea" autosize readonly class="prompt-text" />
                          <el-button size="small" @click="copyPrompt(prompt.fullPrompt)" style="margin-top: 5px;">
                            复制提示词
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>

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
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, FolderOpened, FolderAdd, Search, Refresh, Download, Picture, PictureRounded, VideoCamera, CopyDocument } from '@element-plus/icons-vue'
import SmartRecommendations from './SmartRecommendations.vue'
import CacheManager from './CacheManager.vue'
import * as XLSX from 'xlsx'
import { glmApiService } from '../services/glmApiService.js'

const projectPath = ref('')
const projectSearch = ref('')
const loading = ref(false)
const result = ref(null)
const activeCollapse = ref(['1'])
const storyboardCollapse = ref([''])
const showTemplateDialog = ref(false)
const templates = ref([])

const form = reactive({
  topic: '',
  style: 'cyberpunk',
  shots: 8,
  characterBio: '',
  storyOutline: '',
  specificScenes: '',
  negativePrompt: '',
  storyboardMode: false,
  visualStyle: '',
  cameraMovement: 'static',
  lightingEffect: 'natural',
  colorTone: 'cool'
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
    ElMessage.warning('请输入故事主题！')
    return
  }

  loading.value = true
  
  try {
    // 检查GLM API配置
    if (!glmApiService.isConfigured()) {
      ElMessage.error('GLM API未配置，请联系管理员设置API密钥')
      loading.value = false
      return
    }

    if (form.storyboardMode) {
      // 分镜脚本模式 - 使用GLM API生成
      await generateStoryboardWithGLM()
    } else {
      // 标准模式 - 使用GLM API生成
      await generateStandardScriptWithGLM()
    }
    
    ElMessage.success('AI脚本生成完成！')
  } catch (error) {
    console.error('GLM API调用失败:', error)
    ElMessage.warning('AI服务暂时不可用，使用本地模板生成')
    
    // 降级到本地生成
    await generateLocalScript()
  } finally {
    loading.value = false
  }
}

// 使用GLM API生成分镜脚本
const generateStoryboardWithGLM = async () => {
  const prompt = buildStoryboardPrompt()
  
  const response = await glmApiService.generateContent(prompt, 'tutorial', {
    temperature: 0.8,
    maxTokens: 3000
  })
  
  const parsedResult = parseStoryboardResponse(response.content)
  
  result.value = {
    storyboard: parsedResult.storyboard,
    imagePrompts: parsedResult.imagePrompts,
    videoPrompts: parsedResult.videoPrompts,
    synopsis: parsedResult.synopsis,
    scenePreset: parsedResult.scenePreset,
    characterPreset: parsedResult.characterPreset,
    tableData: parsedResult.tableData
  }
  
  tableData.value = result.value.tableData
}

// 使用GLM API生成标准脚本
const generateStandardScriptWithGLM = async () => {
  const prompt = buildStandardScriptPrompt()
  
  const response = await glmApiService.generateContent(prompt, 'article', {
    temperature: 0.7,
    maxTokens: 2500
  })
  
  const parsedResult = parseStandardScriptResponse(response.content)
  
  result.value = {
    synopsis: parsedResult.synopsis,
    scenePreset: parsedResult.scenePreset,
    characterPreset: parsedResult.characterPreset,
    tableData: parsedResult.tableData
  }
  
  tableData.value = result.value.tableData
}

// 构建分镜脚本提示词
const buildStoryboardPrompt = () => {
  const styleTemplates = {
    'cyberpunk': {
      description: '赛博朋克风格：霓虹灯闪烁的未来都市，高科技与低生活的对比，暗黑科幻氛围',
      visualElements: '全息投影、霓虹灯光、机械义肢、飞行汽车、摩天大楼、雨夜街道',
      colorPalette: '蓝紫色调、霓虹粉、电光蓝、暗黑背景',
      atmosphere: '神秘、压抑、科技感、未来感',
      typicalScenes: '夜晚都市街道、高科技实验室、地下酒吧、摩天大楼顶层'
    },
    'sci-fi': {
      description: '科幻风格：宇宙探索，先进科技，外星文明，时空旅行',
      visualElements: '宇宙飞船、外星建筑、能量武器、传送门、机器人、星空背景',
      colorPalette: '银白色调、蓝光特效、星空深蓝、金属质感',
      atmosphere: '宏大、神秘、探索感、科技感',
      typicalScenes: '宇宙飞船内部、外星星球表面、太空站、科研基地'
    },
    'fantasy-guofeng': {
      description: '国风奇幻：古代仙侠世界，山水如画，仙气缭绕，传统文化元素',
      visualElements: '古代建筑、山水景观、仙鹤飞舞、云雾缭绕、古装服饰、法术特效',
      colorPalette: '水墨色调、青山绿水、金色装饰、白色仙气',
      atmosphere: '飘逸、古典、仙气、诗意',
      typicalScenes: '山峰云海、古代宫殿、竹林小径、瀑布仙境'
    },
    'slice-of-life': {
      description: '日常生活：温馨治愈，真实生活场景，人物情感细腻',
      visualElements: '家庭环境、学校场景、咖啡厅、公园、日常用品、温馨装饰',
      colorPalette: '暖色调、自然光线、柔和色彩、生活化配色',
      atmosphere: '温馨、治愈、真实、亲切',
      typicalScenes: '家庭客厅、学校教室、街边咖啡厅、公园长椅'
    }
  }
  
  const cameraMovements = {
    'static': '静态镜头，稳定构图，突出画面细节',
    'push_pull': '推拉镜头，景深变化，营造空间感',
    'pan': '摇摄镜头，水平移动，展现环境全貌',
    'tracking': '跟拍镜头，跟随主体，增强代入感',
    'rotation': '旋转镜头，环绕拍摄，展现立体空间',
    'crane': '升降镜头，垂直运动，营造气势感'
  }
  
  const lightingEffects = {
    'natural': '自然光照，真实光影，日常氛围',
    'dramatic': '戏剧性光影，强烈对比，情绪渲染',
    'neon': '霓虹灯光，色彩斑斓，未来科技感',
    'backlight': '逆光剪影，轮廓突出，艺术美感',
    'soft': '柔光滤镜，温和氛围，治愈感觉',
    'hard': '硬光对比，锐利边缘，紧张感'
  }
  
  const currentStyle = styleTemplates[form.style] || {
    description: form.style,
    visualElements: '根据风格设计',
    colorPalette: '符合风格的色彩',
    atmosphere: '风格化氛围',
    typicalScenes: '风格化场景'
  }
  
  // 根据故事主题和风格生成专业提示词
  const storyContext = form.storyOutline || `围绕"${form.topic}"展开的${form.style}风格故事`
  const characterContext = form.characterBio || `符合${form.style}风格的主角设定`
  
  return `你是一位专业的影视分镜脚本创作专家，请为以下项目创作一个完整的分镜脚本：

**项目概述：**
- 核心主题：${form.topic}
- 视觉风格：${currentStyle.description}
- 镜头总数：${form.shots}个
- 预估总时长：${Math.floor(form.shots * 4)}秒左右

**风格指导：**
- 视觉元素：${currentStyle.visualElements}
- 色彩基调：${currentStyle.colorPalette}
- 氛围营造：${currentStyle.atmosphere}
- 典型场景：${currentStyle.typicalScenes}

**技术参数：**
- 画面品质：${form.visualStyle || '电影级画质，4K分辨率'}
- 镜头运动：${cameraMovements[form.cameraMovement] || '自然流畅的镜头运动'}
- 光影效果：${lightingEffects[form.lightingEffect] || '自然真实的光影'}
- 色彩调性：${form.colorTone || '符合风格的自然色调'}

**故事内容：**
- 故事大纲：${storyContext}
- 角色设定：${characterContext}
- 必含场景：${form.specificScenes || '无特殊要求'}
- 避免内容：${form.negativePrompt || '无特殊限制'}

**创作要求：**
1. 严格按照电影工业标准创作分镜脚本
2. 每个镜头都要有明确的视觉描述和情绪表达
3. 镜头之间要有流畅的逻辑连接和节奏变化
4. 生成适合AI工具使用的高质量英文提示词
5. 充分体现${form.style}风格的视觉特色
6. 控制总时长在合理范围内，确保故事完整性

请严格按照以下JSON格式输出结果：

{
  "synopsis": "故事简介（180-220字，包含主题、冲突、结局）",
  "scenePreset": "场景预设（详细描述主要拍摄场景的视觉特征、氛围营造）",
  "characterPreset": "人物预设（主要角色的外观、性格、服装、特征描述）",
  "storyboard": [
    {
      "shot": 1,
      "type": "镜头类型（远景/全景/中景/近景/特写/大特写）",
      "description": "详细的场景描述（包含环境、人物动作、情绪表达）",
      "duration": "镜头时长（秒数，整数）",
      "cameraMovement": "具体的镜头运动描述",
      "lighting": "光影效果的详细描述",
      "mood": "情绪氛围和视觉感受"
    }
  ],
  "imagePrompts": [
    {
      "shot": 1,
      "prompt": "高质量的英文AI绘画提示词（包含风格、构图、光影、色彩）",
      "style": "具体的画面风格标签"
    }
  ],
  "videoPrompts": [
    {
      "shot": 1,
      "prompt": "英文AI视频生成提示词（强调运动和动态效果）",
      "motion": "具体的运动描述"
    }
  ]
}

注意：请确保返回的是完整、有效的JSON格式，不要包含任何额外的文字说明。`
}

// 构建标准脚本提示词
const buildStandardScriptPrompt = () => {
  const genreTemplates = {
    'cyberpunk': {
      description: '赛博朋克：未来科技都市，霓虹灯光，高科技低生活',
      themes: '科技与人性、阶级分化、身份认同、反抗与自由',
      plotElements: '黑客入侵、企业阴谋、义体改造、虚拟现实、地下反抗',
      characterTypes: '黑客、企业特工、改造人、AI、底层民众',
      conflictTypes: '人机对抗、阶级冲突、身份危机、道德选择'
    },
    'sci-fi': {
      description: '科幻：太空探索，先进文明，科技奇观',
      themes: '探索未知、文明冲突、科技伦理、时空概念',
      plotElements: '星际旅行、外星接触、时间旅行、科技发明、宇宙奥秘',
      characterTypes: '宇航员、科学家、外星人、AI、未来人类',
      conflictTypes: '文明冲突、科技危机、时空悖论、道德抉择'
    },
    'fantasy-guofeng': {
      description: '国风奇幻：古代仙侠，山水诗意，传统文化',
      themes: '修仙悟道、情义恩仇、天人合一、传统美德',
      plotElements: '修炼升级、门派争斗、寻宝历险、情缘纠葛、天劫考验',
      characterTypes: '修仙者、门派弟子、妖魔、仙人、凡人',
      conflictTypes: '正邪对立、情理冲突、天人考验、道心磨练'
    },
    'slice-of-life': {
      description: '日常治愈：温馨生活，真实情感，细腻描写',
      themes: '成长蜕变、人际关系、生活感悟、情感治愈',
      plotElements: '日常互动、情感交流、生活挑战、温馨时刻、成长体验',
      characterTypes: '学生、上班族、家庭成员、朋友、邻居',
      conflictTypes: '内心成长、人际矛盾、生活压力、情感困扰'
    }
  }
  
  const currentGenre = genreTemplates[form.style] || {
    description: form.style,
    themes: '符合风格的主题',
    plotElements: '风格化情节元素',
    characterTypes: '风格化角色类型',
    conflictTypes: '风格化冲突类型'
  }
  
  // 智能分析用户输入，生成更精准的提示词
  const storyContext = form.storyOutline || `以"${form.topic}"为核心的${form.style}风格故事`
  const characterContext = form.characterBio || `${form.style}风格的主角，与"${form.topic}"主题相关`
  const sceneRequirements = form.specificScenes ? `必须包含以下场景：${form.specificScenes}` : '场景设计自由发挥'
  const contentRestrictions = form.negativePrompt ? `避免以下内容：${form.negativePrompt}` : '无特殊内容限制'
  
  return `你是一位资深的影视编剧，擅长创作${form.style}类型的作品。请为以下项目创作一个完整的影视脚本：

**项目基础信息：**
- 核心主题：${form.topic}
- 类型风格：${currentGenre.description}
- 预计镜头：${form.shots}个场景
- 目标时长：${Math.floor(form.shots * 4)}秒左右

**类型特色指导：**
- 核心主题：${currentGenre.themes}
- 情节元素：${currentGenre.plotElements}
- 角色类型：${currentGenre.characterTypes}
- 冲突设计：${currentGenre.conflictTypes}

**创作素材：**
- 故事背景：${storyContext}
- 角色设定：${characterContext}
- 场景要求：${sceneRequirements}
- 内容限制：${contentRestrictions}

**专业要求：**
1. 故事结构完整：开端-发展-高潮-结局的经典三幕式结构
2. 角色塑造立体：主角要有明确的目标、障碍和成长弧线
3. 冲突设计合理：外在冲突与内在冲突相结合
4. 视觉化表达：每个场景都要具有强烈的画面感
5. 情感共鸣：符合${form.style}类型的情感基调
6. 节奏控制：张弛有度，符合影视节奏规律

请严格按照以下JSON格式创作脚本：

{
  "synopsis": "故事简介（150-200字）：包含主角、目标、障碍、转折、结局的完整故事概述",
  "scenePreset": "场景设定：详细描述主要拍摄场景的视觉特征、氛围营造、${form.style}风格体现",
  "characterPreset": "角色设定：主要角色的外观、性格、背景、动机、成长弧线的详细描述",
  "tableData": [
    {
      "shot": 1,
      "content": "场景内容：具体的情节发展、角色行为、情感变化、视觉呈现",
      "duration": "时长（秒数，整数）",
      "notes": "制作备注：镜头类型、情绪基调、重点表现、技术要求"
    }
  ]
}

**创作重点：**
- 确保故事逻辑清晰，情节发展自然
- 每个场景都要推进故事发展或深化角色
- 充分体现${form.style}类型的特色和魅力
- 场景描述要具有强烈的视觉冲击力
- 对话和行为要符合角色性格设定
- 整体节奏要符合${Math.floor(form.shots * 4)}秒的时长要求

注意：请确保返回完整有效的JSON格式，不要包含任何额外说明文字。`
}

// 解析分镜脚本响应
const parseStoryboardResponse = (content) => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // 转换为组件需要的格式
      const tableData = parsed.storyboard?.map(shot => ({
        shot: shot.shot,
        content: shot.description,
        duration: shot.duration,
        notes: `${shot.type}，${shot.mood || ''}`
      })) || []
      
      return {
        synopsis: parsed.synopsis || `${form.topic}的${form.style}风格分镜脚本`,
        scenePreset: parsed.scenePreset || `${form.style}风格场景设定`,
        characterPreset: parsed.characterPreset || '角色设定',
        storyboard: parsed.storyboard || [],
        imagePrompts: parsed.imagePrompts || [],
        videoPrompts: parsed.videoPrompts || [],
        tableData
      }
    }
  } catch (e) {
    console.warn('无法解析JSON格式，使用文本解析')
  }
  
  // 文本解析降级方案
  return parseTextResponse(content, true)
}

// 解析标准脚本响应
const parseStandardScriptResponse = (content) => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        synopsis: parsed.synopsis || `${form.topic}的${form.style}风格故事`,
        scenePreset: parsed.scenePreset || `${form.style}风格场景`,
        characterPreset: parsed.characterPreset || '角色设定',
        tableData: parsed.tableData || []
      }
    }
  } catch (e) {
    console.warn('无法解析JSON格式，使用文本解析')
  }
  
  return parseTextResponse(content, false)
}

// 文本解析降级方案
const parseTextResponse = (content, isStoryboard) => {
  const lines = content.split('\n').filter(line => line.trim())
  
  const synopsis = lines.find(line => line.includes('简介') || line.includes('故事'))?.replace(/.*[:：]/, '') || 
                  `这是一个关于${form.topic}的${form.style}风格故事`
  
  const scenePreset = lines.find(line => line.includes('场景') || line.includes('设定'))?.replace(/.*[:：]/, '') || 
                     `${form.style}风格的视觉场景设定`
  
  const characterPreset = lines.find(line => line.includes('角色') || line.includes('人物'))?.replace(/.*[:：]/, '') || 
                         `${form.topic}相关的角色设定`
  
  const tableData = Array.from({ length: form.shots }, (_, i) => ({
    shot: i + 1,
    content: `第${i + 1}个镜头：${form.topic}的${form.style}风格场景`,
    duration: Math.floor(Math.random() * 5) + 3,
    notes: `${form.style}风格镜头`
  }))
  
  const result = {
    synopsis,
    scenePreset, 
    characterPreset,
    tableData
  }
  
  if (isStoryboard) {
    result.storyboard = tableData.map(item => ({
      shot: item.shot,
      type: ['远景', '中景', '近景', '特写'][Math.floor(Math.random() * 4)],
      description: item.content,
      duration: item.duration
    }))
    result.imagePrompts = []
    result.videoPrompts = []
  }
  
  return result
}

// 本地降级生成
const generateLocalScript = async () => {
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  if (form.storyboardMode) {
    // 分镜脚本模式
    const storyboard = generateStoryboard(form.topic, form.style, form.shots)
    const imagePrompts = generateImagePrompts(storyboard, form.style, form.visualStyle, form.cameraMovement, form.lightingEffect, form.colorTone)
    const videoPrompts = generateVideoPrompts(storyboard, form.style, form.cameraMovement, form.lightingEffect)
    
    result.value = {
      storyboard,
      imagePrompts,
      videoPrompts,
      synopsis: `这是一个关于${form.topic}的${form.style}风格故事，采用分镜脚本模式，共${form.shots}个镜头。`,
      scenePreset: `整体风格：${getStyleDescription(form.style)}，画面风格：${form.visualStyle || '默认'}，镜头运动：${form.cameraMovement}，光影效果：${form.lightingEffect}，色彩调性：${form.colorTone}`,
      characterPreset: `主题：${form.topic}，风格：${form.style}，镜头数：${form.shots}`,
      tableData: storyboard.map((shot, index) => ({
        shot: index + 1,
        content: shot.description,
        duration: shot.duration,
        notes: `${shot.type}镜头，${form.style}风格`
      }))
    }
  } else {
    // 标准模式
    result.value = {
      synopsis: `这是一个关于${form.topic}的${form.style}风格故事。主角在${form.style === 'cyberpunk' ? '霓虹闪烁的未来都市' : form.style === 'sci-fi' ? '浩瀚无垠的宇宙' : form.style === 'fantasy-guofeng' ? '仙气缭绕的古代世界' : '温馨治愈的日常生活'}中展开了一段惊心动魄的冒险。`,
      scenePreset: `${form.style === 'cyberpunk' ? '赛博朋克都市：高楼林立，霓虹闪烁，全息广告在空中漂浮，飞行汽车穿梭于楼宇之间' : form.style === 'sci-fi' ? '太空场景：宇宙飞船在星空中航行，外星文明的建筑充满未来感，高科技设备随处可见' : form.style === 'fantasy-guofeng' ? '古风场景：亭台楼阁，山水如画，仙气缭绕，古代建筑与自然完美融合' : '日常场景：温馨的家庭环境，阳光透过窗户洒进来，生活气息浓厚'}。`,
      characterPreset: `主角：${form.characterBio || '一个勇敢而智慧的年轻人'}，${form.style === 'cyberpunk' ? '在未来科技社会中寻找自我' : form.style === 'sci-fi' ? '在星际探索中发现宇宙奥秘' : form.style === 'fantasy-guofeng' ? '在修仙世界中追求大道' : '在日常生活中发现美好'}。`,
      tableData: Array.from({ length: form.shots }, (_, i) => ({
        shot: i + 1,
        content: `第${i + 1}个镜头：${form.topic}的${form.style}风格场景`,
        duration: Math.floor(Math.random() * 5) + 1,
        notes: `${form.style}风格，${form.characterBio ? '体现主角性格' : '突出主题'}`
      }))
    }
  }
  
  tableData.value = result.value.tableData
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

// 复制提示词功能
const copyPrompt = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('提示词已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

const copyPrompts = (type) => {
  if (!result.value || !result.value[type]) return
  
  const prompts = result.value[type].map(p => p.text || p.fullPrompt).join('\n\n')
  copyPrompt(prompts)
}

// 生成分镜脚本
const generateStoryboard = (topic, style, shots) => {
  const storyboard = []
  const shotTypes = ['远景', '中景', '近景', '特写', '全景', '俯拍', '仰拍']
  const sceneDescriptions = {
    'cyberpunk': [
      '霓虹灯闪烁的未来都市夜景',
      '高楼大厦间的全息投影广告',
      '阴暗小巷中的霓虹灯光',
      '科技感十足的建筑外观',
      '充满未来感的交通工具',
      '赛博朋克风格的室内场景',
      '高科技设备与古老建筑的对比',
      '霓虹灯下的雨夜街道'
    ],
    'sci-fi': [
      '宇宙飞船的驾驶舱',
      '外星球的奇特地貌',
      '高科技实验室',
      '太空站的全景',
      '未来城市的天际线',
      '机器人的特写镜头',
      '星际旅行的场景',
      '时间隧道的视觉效果'
    ],
    'fantasy-guofeng': [
      '古代宫殿的宏伟建筑',
      '山水间的诗意画面',
      '仙侠世界的奇幻场景',
      '古代街道的热闹景象',
      '传统建筑的精美细节',
      '自然风光的壮丽景色',
      '古代服饰的华美展示',
      '神话传说的场景再现'
    ],
    'slice-of-life': [
      '温馨的家居环境',
      '日常生活的真实瞬间',
      '人物的自然表情',
      '温暖的光影效果',
      '生活细节的特写',
      '人物互动的温馨场景',
      '日常用品的精美展示',
      '生活场景的真实记录'
    ]
  }

  for (let i = 0; i < shots; i++) {
    const sceneArray = sceneDescriptions[style] || sceneDescriptions['cyberpunk']
    const sceneDesc = sceneArray[i % sceneArray.length]
    const shotType = shotTypes[i % shotTypes.length]
    
    storyboard.push({
      type: shotType,
      description: `${sceneDesc}，${getStyleDescription(style)}`,
      duration: Math.floor(Math.random() * 5) + 2
    })
  }
  
  return storyboard
}

// 生成文生图提示词
const generateImagePrompts = (storyboard, style, visualStyle, cameraMovement, lightingEffect, colorTone) => {
  const baseStyles = {
    'cyberpunk': 'cyberpunk style, neon lights, futuristic city, high tech, dark atmosphere, neon glow, sci-fi',
    'sci-fi': 'science fiction style, futuristic technology, space theme, advanced civilization, high tech',
    'fantasy-guofeng': 'Chinese fantasy style, ancient architecture, traditional elements, oriental aesthetics, mythological',
    'slice-of-life': 'daily life style, warm atmosphere, natural lighting, realistic, documentary style'
  }
  
  const lightingStyles = {
    'natural': 'natural lighting, soft light',
    'dramatic': 'dramatic lighting, strong contrast, cinematic',
    'neon': 'neon lights, colorful glow, cyberpunk lighting',
    'backlight': 'backlighting, silhouette effect, rim light',
    'soft': 'soft lighting, diffused light, gentle shadows',
    'hard': 'hard lighting, strong shadows, high contrast'
  }
  
  const colorStyles = {
    'cool': 'cool color palette, blue tones, cyan, teal',
    'warm': 'warm color palette, orange tones, golden hour, cozy',
    'high_contrast': 'high contrast, vivid colors, saturated',
    'desaturated': 'desaturated colors, muted tones, vintage',
    'cyberpunk': 'cyberpunk colors, neon pink and cyan, electric blue',
    'vintage': 'vintage colors, film look, nostalgic, retro'
  }

  return storyboard.map((shot, index) => ({
    text: `${shot.description}, ${baseStyles[style] || baseStyles['cyberpunk']}, ${lightingStyles[lightingEffect] || lightingStyles['natural']}, ${colorStyles[colorTone] || colorStyles['cool']}, ${visualStyle || ''}, ${cameraMovement} camera movement, ${shot.type} shot, 4K resolution, high quality, detailed, cinematic`
  }))
}

// 生成图生视频提示词
const generateVideoPrompts = (storyboard, style, cameraMovement, lightingEffect) => {
  const movementDescriptions = {
    'static': 'static camera, fixed position',
    'push_pull': 'smooth push in/pull out camera movement',
    'pan': 'smooth panning camera movement',
    'tracking': 'tracking shot, following the subject',
    'rotation': 'rotating camera movement, 360 degree view',
    'crane': 'crane shot, smooth vertical movement'
  }

  return storyboard.map((shot, index) => {
    const motionDesc = getMotionDescription(shot.type)
    const cameraDesc = movementDescriptions[cameraMovement] || movementDescriptions['static']
    
    return {
      imageDescription: shot.description,
      motionDescription: motionDesc,
      cameraMovement: cameraDesc,
      duration: shot.duration,
      fullPrompt: `${shot.description}, ${motionDesc}, ${cameraDesc}, ${lightingEffect} lighting, ${style} style, smooth motion, high quality video, cinematic, 4K`
    }
  })
}

// 辅助函数
const getStyleDescription = (style) => {
  const descriptions = {
    'cyberpunk': '充满科技感的赛博朋克风格',
    'sci-fi': '科幻未来的太空风格',
    'fantasy-guofeng': '中国传统仙侠风格',
    'slice-of-life': '温馨治愈的日常生活风格'
  }
  return descriptions[style] || descriptions['cyberpunk']
}

const getMotionDescription = (shotType) => {
  const motions = {
    '远景': '展现宏大场景的全景运动',
    '中景': '突出主体的平稳运动',
    '近景': '细腻的人物表情变化',
    '特写': '强调细节特写的缓慢运动',
    '全景': '展示完整场景的全方位运动',
    '俯拍': '从上往下的俯瞰视角运动',
    '仰拍': '从下往上的仰视视角运动'
  }
  return motions[shotType] || '自然的镜头运动'
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
