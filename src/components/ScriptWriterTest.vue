<template>
  <div class="script-writer-test">
    <div class="test-header">
      <h2>AI影视脚本创作 - GLM集成测试</h2>
      <p>测试GLM API在影视脚本创作中的应用效果</p>
    </div>
    
    <div class="test-scenarios">
      <div class="scenario-card" v-for="scenario in testScenarios" :key="scenario.id">
        <h3>{{ scenario.title }}</h3>
        <div class="scenario-params">
          <div class="param-item">
            <label>主题：</label>
            <span>{{ scenario.topic }}</span>
          </div>
          <div class="param-item">
            <label>风格：</label>
            <span>{{ scenario.style }}</span>
          </div>
          <div class="param-item">
            <label>镜头数：</label>
            <span>{{ scenario.shots }}</span>
          </div>
          <div class="param-item">
            <label>模式：</label>
            <span>{{ scenario.storyboardMode ? '分镜脚本' : '标准脚本' }}</span>
          </div>
        </div>
        
        <div class="test-actions">
          <el-button 
            type="primary" 
            @click="runTest(scenario)"
            :loading="scenario.testing"
            :disabled="!apiConfigured"
          >
            {{ scenario.testing ? '测试中...' : '开始测试' }}
          </el-button>
          
          <el-button 
            v-if="scenario.result"
            type="success" 
            @click="viewResult(scenario)"
          >
            查看结果
          </el-button>
        </div>
        
        <div v-if="scenario.error" class="error-message">
          <el-alert type="error" :title="scenario.error" show-icon />
        </div>
        
        <div v-if="scenario.result" class="test-result">
          <div class="result-summary">
            <div class="summary-item">
              <label>生成时间：</label>
              <span>{{ scenario.duration }}ms</span>
            </div>
            <div class="summary-item">
              <label>故事简介长度：</label>
              <span>{{ scenario.result.synopsis?.length || 0 }}字</span>
            </div>
            <div class="summary-item">
              <label>场景数量：</label>
              <span>{{ scenario.result.tableData?.length || 0 }}个</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="api-status">
      <h3>API状态检查</h3>
      <div class="status-info">
        <div class="status-item">
          <label>GLM API配置：</label>
          <el-tag :type="apiConfigured ? 'success' : 'danger'">
            {{ apiConfigured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
        <div class="status-item">
          <label>连接测试：</label>
          <el-button size="small" @click="testConnection" :loading="connectionTesting">
            {{ connectionTesting ? '测试中...' : '测试连接' }}
          </el-button>
          <el-tag v-if="connectionStatus" :type="connectionStatus.success ? 'success' : 'danger'">
            {{ connectionStatus.message }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <!-- 结果详情对话框 -->
    <el-dialog v-model="resultDialogVisible" title="测试结果详情" width="80%" top="5vh">
      <div v-if="selectedResult" class="result-detail">
        <div class="detail-section">
          <h4>故事简介</h4>
          <p>{{ selectedResult.synopsis }}</p>
        </div>
        
        <div class="detail-section">
          <h4>场景预设</h4>
          <p>{{ selectedResult.scenePreset }}</p>
        </div>
        
        <div class="detail-section">
          <h4>角色预设</h4>
          <p>{{ selectedResult.characterPreset }}</p>
        </div>
        
        <div class="detail-section" v-if="selectedResult.tableData">
          <h4>脚本内容</h4>
          <el-table :data="selectedResult.tableData" border>
            <el-table-column prop="shot" label="镜头" width="80" />
            <el-table-column prop="content" label="内容" />
            <el-table-column prop="duration" label="时长(秒)" width="100" />
            <el-table-column prop="notes" label="备注" />
          </el-table>
        </div>
        
        <div class="detail-section" v-if="selectedResult.storyboard">
          <h4>分镜脚本</h4>
          <div v-for="shot in selectedResult.storyboard" :key="shot.shot" class="storyboard-item">
            <h5>镜头 {{ shot.shot }} - {{ shot.type }}</h5>
            <p><strong>描述：</strong>{{ shot.description }}</p>
            <p><strong>时长：</strong>{{ shot.duration }}秒</p>
            <p><strong>镜头运动：</strong>{{ shot.cameraMovement }}</p>
            <p><strong>光影：</strong>{{ shot.lighting }}</p>
            <p><strong>情绪：</strong>{{ shot.mood }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { glmApiService } from '../services/glmApiService.js'

const apiConfigured = ref(false)
const connectionTesting = ref(false)
const connectionStatus = ref(null)
const resultDialogVisible = ref(false)
const selectedResult = ref(null)

const testScenarios = ref([
  {
    id: 1,
    title: '赛博朋克短片测试',
    topic: '未来都市中的黑客反抗',
    style: 'cyberpunk',
    shots: 8,
    storyboardMode: true,
    testing: false,
    result: null,
    error: null,
    duration: 0
  },
  {
    id: 2,
    title: '科幻探索标准脚本',
    topic: '星际探索发现外星文明',
    style: 'sci-fi',
    shots: 10,
    storyboardMode: false,
    testing: false,
    result: null,
    error: null,
    duration: 0
  },
  {
    id: 3,
    title: '国风奇幻分镜脚本',
    topic: '修仙者的成长历程',
    style: 'fantasy-guofeng',
    shots: 12,
    storyboardMode: true,
    testing: false,
    result: null,
    error: null,
    duration: 0
  },
  {
    id: 4,
    title: '日常治愈短片',
    topic: '校园友谊的温暖故事',
    style: 'slice-of-life',
    shots: 6,
    storyboardMode: false,
    testing: false,
    result: null,
    error: null,
    duration: 0
  }
])

onMounted(() => {
  checkApiConfiguration()
})

const checkApiConfiguration = () => {
  apiConfigured.value = glmApiService.isConfigured()
}

const testConnection = async () => {
  connectionTesting.value = true
  connectionStatus.value = null
  
  try {
    const response = await glmApiService.generateContent('测试连接', 'test', {
      temperature: 0.1,
      maxTokens: 50
    })
    
    connectionStatus.value = {
      success: true,
      message: '连接成功'
    }
    ElMessage.success('GLM API连接测试成功')
  } catch (error) {
    connectionStatus.value = {
      success: false,
      message: `连接失败: ${error.message}`
    }
    ElMessage.error('GLM API连接测试失败')
  } finally {
    connectionTesting.value = false
  }
}

const runTest = async (scenario) => {
  scenario.testing = true
  scenario.error = null
  scenario.result = null
  
  const startTime = Date.now()
  
  try {
    // 构建测试表单数据
    const testForm = {
      topic: scenario.topic,
      style: scenario.style,
      shots: scenario.shots,
      storyboardMode: scenario.storyboardMode,
      visualStyle: '电影级画质',
      cameraMovement: 'tracking',
      lightingEffect: 'dramatic',
      colorTone: '电影色调',
      characterBio: '',
      storyOutline: '',
      specificScenes: '',
      negativePrompt: ''
    }
    
    let result
    if (scenario.storyboardMode) {
      result = await generateStoryboardTest(testForm)
    } else {
      result = await generateStandardScriptTest(testForm)
    }
    
    scenario.result = result
    scenario.duration = Date.now() - startTime
    
    ElMessage.success(`${scenario.title} 测试完成`)
  } catch (error) {
    scenario.error = error.message
    ElMessage.error(`${scenario.title} 测试失败: ${error.message}`)
  } finally {
    scenario.testing = false
  }
}

const generateStoryboardTest = async (form) => {
  const prompt = buildTestStoryboardPrompt(form)
  const response = await glmApiService.generateContent(prompt, 'tutorial', {
    temperature: 0.8,
    maxTokens: 3000
  })
  
  return parseTestResponse(response.content, true, form)
}

const generateStandardScriptTest = async (form) => {
  const prompt = buildTestStandardPrompt(form)
  const response = await glmApiService.generateContent(prompt, 'article', {
    temperature: 0.7,
    maxTokens: 2500
  })
  
  return parseTestResponse(response.content, false, form)
}

const buildTestStoryboardPrompt = (form) => {
  return `请为影视项目创作分镜脚本：

主题：${form.topic}
风格：${form.style}
镜头数：${form.shots}个

请返回JSON格式：
{
  "synopsis": "故事简介",
  "scenePreset": "场景预设",
  "characterPreset": "角色预设",
  "storyboard": [{"shot": 1, "type": "远景", "description": "场景描述", "duration": "5"}],
  "tableData": [{"shot": 1, "content": "内容", "duration": "5", "notes": "备注"}]
}`
}

const buildTestStandardPrompt = (form) => {
  return `请为影视项目创作标准脚本：

主题：${form.topic}
风格：${form.style}
镜头数：${form.shots}个

请返回JSON格式：
{
  "synopsis": "故事简介",
  "scenePreset": "场景预设", 
  "characterPreset": "角色预设",
  "tableData": [{"shot": 1, "content": "内容", "duration": "5", "notes": "备注"}]
}`
}

const parseTestResponse = (content, isStoryboard, form) => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    }
  } catch (e) {
    console.warn('JSON解析失败，使用降级方案')
  }
  
  // 降级方案
  return {
    synopsis: `${form.topic}的${form.style}风格测试脚本`,
    scenePreset: `${form.style}风格场景设定`,
    characterPreset: `${form.style}风格角色设定`,
    tableData: Array.from({ length: form.shots }, (_, i) => ({
      shot: i + 1,
      content: `第${i + 1}个镜头：${form.topic}场景`,
      duration: Math.floor(Math.random() * 5) + 3,
      notes: `${form.style}风格`
    }))
  }
}

const viewResult = (scenario) => {
  selectedResult.value = scenario.result
  resultDialogVisible.value = true
}
</script>

<style scoped>
.script-writer-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.test-scenarios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.scenario-card {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.scenario-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.scenario-params {
  margin-bottom: 15px;
}

.param-item {
  display: flex;
  margin-bottom: 8px;
}

.param-item label {
  font-weight: bold;
  width: 80px;
  color: #666;
}

.test-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.error-message {
  margin-bottom: 15px;
}

.test-result {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
}

.summary-item label {
  font-weight: bold;
  width: 120px;
  color: #666;
}

.api-status {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.api-status h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-item label {
  font-weight: bold;
  width: 120px;
  color: #666;
}

.result-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: #2c3e50;
  margin-bottom: 10px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.storyboard-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.storyboard-item h5 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.storyboard-item p {
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>