<template>
  <div class="glm-test-container">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <h3>GLM API 连接测试</h3>
          <el-tag :type="apiStatus === 'connected' ? 'success' : apiStatus === 'error' ? 'danger' : 'info'">
            {{ apiStatusText }}
          </el-tag>
        </div>
      </template>
      
      <div class="test-content">
        <el-form :model="testForm" label-width="120px">
          <el-form-item label="测试提示词:">
            <el-input
              v-model="testForm.prompt"
              type="textarea"
              :rows="3"
              placeholder="输入测试提示词，例如：写一篇关于春天的小红书文案"
            />
          </el-form-item>
          
          <el-form-item label="内容类型:">
            <el-select v-model="testForm.contentType" placeholder="选择内容类型">
              <el-option label="社交媒体" value="social" />
              <el-option label="文章" value="article" />
              <el-option label="教程" value="tutorial" />
              <el-option label="营销" value="marketing" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="testConnection"
              :loading="testing"
              :disabled="!testForm.prompt.trim()"
            >
              {{ testing ? '测试中...' : '测试GLM API' }}
            </el-button>
            <el-button @click="clearResult">清空结果</el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="testResult" class="test-result">
          <h4>API响应结果:</h4>
          <el-alert
            :title="testResult.success ? '测试成功' : '测试失败'"
            :type="testResult.success ? 'success' : 'error'"
            :description="testResult.message"
            show-icon
            :closable="false"
          />
          
          <div v-if="testResult.success && testResult.data" class="result-content">
            <h5>生成内容:</h5>
            <el-card class="content-card">
              <pre>{{ testResult.data }}</pre>
            </el-card>
          </div>
          
          <div v-if="testResult.error" class="error-details">
            <h5>错误详情:</h5>
            <el-card class="error-card">
              <pre>{{ testResult.error }}</pre>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { glmApiService } from '../services/glmApiService.js'

const apiStatus = ref('checking')
const apiStatusText = ref('检查中...')
const testing = ref(false)

const testForm = ref({
  prompt: '写一篇关于春天的小红书文案，要求轻松活泼，包含相关标签',
  contentType: 'social'
})

const testResult = ref(null)

// 检查API配置状态
const checkApiStatus = () => {
  if (glmApiService.isConfigured()) {
    apiStatus.value = 'connected'
    apiStatusText.value = 'API已配置'
  } else {
    apiStatus.value = 'error'
    apiStatusText.value = 'API未配置'
  }
}

// 测试API连接
const testConnection = async () => {
  if (!testForm.value.prompt.trim()) {
    ElMessage.warning('请输入测试提示词')
    return
  }
  
  testing.value = true
  testResult.value = null
  
  try {
    console.log('开始测试GLM API...')
    
    const response = await glmApiService.generateContent(
      testForm.value.prompt,
      testForm.value.contentType,
      {
        temperature: 0.8,
        maxTokens: 1024
      }
    )
    
    console.log('GLM API响应:', response)
    
    testResult.value = {
      success: true,
      message: 'GLM API连接成功，内容生成正常',
      data: response.content || response
    }
    
    ElMessage.success('GLM API测试成功！')
    
  } catch (error) {
    console.error('GLM API测试失败:', error)
    
    testResult.value = {
      success: false,
      message: `GLM API测试失败: ${error.message}`,
      error: error.stack || error.toString()
    }
    
    ElMessage.error('GLM API测试失败')
  } finally {
    testing.value = false
  }
}

// 清空结果
const clearResult = () => {
  testResult.value = null
}

onMounted(() => {
  checkApiStatus()
})
</script>

<style scoped>
.glm-test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.test-content {
  padding: 20px 0;
}

.test-result {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.test-result h4,
.test-result h5 {
  color: #303133;
  margin-bottom: 15px;
}

.result-content,
.error-details {
  margin-top: 20px;
}

.content-card,
.error-card {
  margin-top: 10px;
}

.content-card pre,
.error-card pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.content-card pre {
  color: #67c23a;
}

.error-card pre {
  color: #f56c6c;
}
</style>