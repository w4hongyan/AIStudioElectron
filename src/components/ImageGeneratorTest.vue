<template>
  <div class="test-container">
    <h1>GLM AI绘图功能测试</h1>
    <p class="test-subtitle">测试GLM API在AI绘图场景下的集成效果</p>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="test-panel">
          <template #header>
            <span>API连接状态</span>
          </template>
          
          <div class="status-item">
            <span>GLM API状态：</span>
            <el-tag :type="apiStatus.type">{{ apiStatus.text }}</el-tag>
            <el-button size="small" @click="checkApiStatus" :loading="checking">检查</el-button>
          </div>
        </el-card>

        <el-card class="test-panel" style="margin-top: 20px;">
          <template #header>
            <span>测试场景</span>
          </template>
          
          <div class="test-scenarios">
            <div 
              v-for="scenario in testScenarios" 
              :key="scenario.id"
              class="scenario-item"
              :class="{ active: selectedScenario === scenario.id }"
              @click="selectScenario(scenario)"
            >
              <h4>{{ scenario.name }}</h4>
              <p>{{ scenario.description }}</p>
              <div class="scenario-params">
                <el-tag size="small">{{ scenario.style }}</el-tag>
                <el-tag size="small" type="info">{{ scenario.size }}</el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="test-panel">
          <template #header>
            <span>测试操作</span>
          </template>
          
          <div class="test-operations">
            <el-button 
              type="primary" 
              @click="runPromptOptimization"
              :loading="testing"
              :disabled="!selectedScenario"
            >
              测试提示词优化
            </el-button>
            
            <el-button 
              type="success" 
              @click="runSmartGeneration"
              :loading="testing"
              :disabled="!selectedScenario"
            >
              测试智能生成
            </el-button>
            
            <el-button 
              @click="clearResults"
              :disabled="!testResults.length"
            >
              清空结果
            </el-button>
          </div>

          <div class="test-results" v-if="testResults.length > 0">
            <h4>测试结果</h4>
            <div 
              v-for="(result, index) in testResults" 
              :key="index"
              class="result-item"
            >
              <div class="result-header">
                <span class="result-type">{{ result.type }}</span>
                <el-tag :type="result.success ? 'success' : 'danger'">
                  {{ result.success ? '成功' : '失败' }}
                </el-tag>
              </div>
              <div class="result-content">
                <p><strong>输入：</strong>{{ result.input }}</p>
                <p><strong>输出：</strong>{{ result.output }}</p>
                <p><strong>耗时：</strong>{{ result.duration }}ms</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { glmApiService } from '../services/glmApiService.js'

const apiStatus = reactive({
  type: 'info',
  text: '未检查'
})

const checking = ref(false)
const testing = ref(false)
const selectedScenario = ref(null)
const testResults = ref([])

const testScenarios = [
  {
    id: 1,
    name: '写实人像优化',
    description: '测试写实风格人像提示词的优化效果',
    input: '美丽的女孩',
    style: '写实风格',
    size: '512x768'
  },
  {
    id: 2,
    name: '动漫角色生成',
    description: '测试动漫风格角色的智能提示词生成',
    input: '可爱的猫娘',
    style: '动漫风格',
    size: '512x512'
  },
  {
    id: 3,
    name: '风景画创作',
    description: '测试油画风格风景的提示词优化',
    input: '夕阳下的山峦',
    style: '油画风格',
    size: '768x512'
  },
  {
    id: 4,
    name: '赛博朋克场景',
    description: '测试赛博朋克风格的智能提示词生成',
    input: '未来城市',
    style: '赛博朋克',
    size: '768x512'
  }
]

const checkApiStatus = async () => {
  checking.value = true
  try {
    const isConfigured = await glmApiService.checkConfiguration()
    if (isConfigured) {
      apiStatus.type = 'success'
      apiStatus.text = '已连接'
    } else {
      apiStatus.type = 'warning'
      apiStatus.text = '未配置'
    }
  } catch (error) {
    apiStatus.type = 'danger'
    apiStatus.text = '连接失败'
  } finally {
    checking.value = false
  }
}

const selectScenario = (scenario) => {
  selectedScenario.value = scenario.id
}

const runPromptOptimization = async () => {
  if (!selectedScenario.value) return
  
  const scenario = testScenarios.find(s => s.id === selectedScenario.value)
  testing.value = true
  
  const startTime = Date.now()
  try {
    const optimizationPrompt = buildOptimizationPrompt(scenario)
    const result = await glmApiService.generateContent(optimizationPrompt, {
      temperature: 0.7,
      max_tokens: 800
    })
    
    const duration = Date.now() - startTime
    
    testResults.value.unshift({
      type: '提示词优化',
      success: result.success,
      input: scenario.input,
      output: result.success ? result.content.substring(0, 200) + '...' : result.error || '优化失败',
      duration
    })
    
    ElMessage.success('提示词优化测试完成')
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.value.unshift({
      type: '提示词优化',
      success: false,
      input: scenario.input,
      output: error.message,
      duration
    })
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

const runSmartGeneration = async () => {
  if (!selectedScenario.value) return
  
  const scenario = testScenarios.find(s => s.id === selectedScenario.value)
  testing.value = true
  
  const startTime = Date.now()
  try {
    const smartPrompt = buildSmartPrompt(scenario)
    const result = await glmApiService.generateContent(smartPrompt, {
      temperature: 0.8,
      max_tokens: 1000
    })
    
    const duration = Date.now() - startTime
    
    testResults.value.unshift({
      type: '智能生成',
      success: result.success,
      input: scenario.input,
      output: result.success ? result.content.substring(0, 200) + '...' : result.error || '生成失败',
      duration
    })
    
    ElMessage.success('智能生成测试完成')
  } catch (error) {
    const duration = Date.now() - startTime
    testResults.value.unshift({
      type: '智能生成',
      success: false,
      input: scenario.input,
      output: error.message,
      duration
    })
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

const buildOptimizationPrompt = (scenario) => {
  return `请优化以下AI绘图提示词：

原始描述：${scenario.input}
风格要求：${scenario.style}
图片尺寸：${scenario.size}

请生成专业的英文提示词，包含详细的视觉描述、风格关键词和质量提升词汇。`
}

const buildSmartPrompt = (scenario) => {
  return `基于用户描述生成专业的AI绘图提示词：

用户描述：${scenario.input}
风格：${scenario.style}
尺寸：${scenario.size}

请生成JSON格式的结果：
{
  "positive": "详细的正向提示词",
  "negative": "相应的负向提示词"
}`
}

const clearResults = () => {
  testResults.value = []
}

onMounted(() => {
  checkApiStatus()
})
</script>

<style scoped>
.test-container {
  padding: 20px;
}

.test-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.test-panel {
  height: fit-content;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.test-scenarios {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.scenario-item {
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.scenario-item:hover {
  border-color: #409eff;
}

.scenario-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.scenario-item h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.scenario-item p {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.scenario-params {
  display: flex;
  gap: 8px;
}

.test-operations {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.test-results {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.result-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-type {
  font-weight: 600;
  color: #303133;
}

.result-content p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}
</style>