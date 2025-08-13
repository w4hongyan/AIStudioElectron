<template>
  <div class="ai-writer">
    <div class="writer-header">
      <h1>AI写作助手</h1>
      <p>智能生成高质量文章，支持多种写作场景</p>
    </div>
    
    <div class="writer-content">
      <el-card class="writing-panel">
        <template #header>
          <div class="card-header">
            <span>内容创作</span>
            <el-tag type="success">AI智能</el-tag>
          </div>
        </template>
        
        <div class="writing-form">
          <el-form :model="form" label-width="80px">
            <el-form-item label="写作类型">
              <el-select v-model="form.type" placeholder="选择写作类型">
                <el-option label="新闻报道" value="news" />
                <el-option label="产品介绍" value="product" />
                <el-option label="博客文章" value="blog" />
                <el-option label="社交媒体" value="social" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="关键词">
              <el-input v-model="form.keywords" placeholder="输入关键词，用逗号分隔" />
            </el-form-item>
            
            <el-form-item label="字数要求">
              <el-slider v-model="form.wordCount" :min="100" :max="5000" :step="100" />
              <span>{{ form.wordCount }} 字</span>
            </el-form-item>
            
            <el-form-item label="语气风格">
              <el-radio-group v-model="form.tone">
                <el-radio label="正式">正式</el-radio>
                <el-radio label="轻松">轻松</el-radio>
                <el-radio label="幽默">幽默</el-radio>
                <el-radio label="专业">专业</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          
          <div class="form-actions">
            <el-button type="primary" @click="generateContent" :loading="loading">
              生成内容
            </el-button>
            <el-button @click="clearForm">清空</el-button>
          </div>
        </div>
      </el-card>
      
      <el-card v-if="generatedContent" class="result-panel">
        <template #header>
          <div class="card-header">
            <span>生成结果</span>
            <el-button-group>
              <el-button size="small" @click="copyContent">复制</el-button>
              <el-button size="small" @click="saveContent">保存</el-button>
            </el-button-group>
          </div>
        </template>
        
        <div class="content-result">
          <el-input
            v-model="generatedContent"
            type="textarea"
            :rows="15"
            placeholder="生成内容将显示在这里..."
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({
  type: 'blog',
  keywords: '',
  wordCount: 1000,
  tone: '正式'
})

const loading = ref(false)
const generatedContent = ref('')

const generateContent = async () => {
  if (!form.value.keywords.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  
  loading.value = true
  
  // 模拟AI生成过程
  setTimeout(() => {
    generatedContent.value = `【${form.value.type}】关于"${form.value.keywords}"的${form.value.tone}风格内容：

在这个${form.value.tone}的内容中，我们将深入探讨"${form.value.keywords}"相关的话题。通过AI技术的智能分析，我们为您生成了一篇约${form.value.wordCount}字的高质量文章。

这篇文章采用了${form.value.tone}的写作风格，适合${form.value.type}场景使用。内容结构清晰，逻辑严谨，能够有效传达您想要表达的核心观点。

AI写作助手基于最新的自然语言处理技术，能够理解上下文语境，生成符合要求的专业内容。您可以根据需要进一步调整和完善。

---
生成时间: ${new Date().toLocaleString()}
字数统计: ${form.value.wordCount}字
写作类型: ${form.value.type}
语气风格: ${form.value.tone}`
    
    loading.value = false
    ElMessage.success('内容生成完成！')
  }, 2000)
}

const clearForm = () => {
  form.value = {
    type: 'blog',
    keywords: '',
    wordCount: 1000,
    tone: '正式'
  }
  generatedContent.value = ''
}

const copyContent = () => {
  navigator.clipboard.writeText(generatedContent.value)
  ElMessage.success('内容已复制到剪贴板')
}

const saveContent = () => {
  // 模拟保存功能
  ElMessage.success('内容已保存')
}
</script>

<style scoped>
.ai-writer {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.writer-header {
  text-align: center;
  margin-bottom: 30px;
}

.writer-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.writer-header p {
  font-size: 16px;
  color: var(--text-color-secondary);
}

.writer-content {
  display: grid;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}

.content-result {
  position: relative;
}

@media (max-width: 768px) {
  .ai-writer {
    padding: 10px;
  }
}
</style>