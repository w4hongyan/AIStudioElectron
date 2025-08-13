<template>
  <div class="strategy-management">
    <div class="management-header">
      <h1>内容策略管理</h1>
      <p>制定和优化您的内容发布策略</p>
    </div>
    
    <div class="management-content">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="strategy-form">
            <template #header>
              <div class="card-header">
                <span>策略制定</span>
                <el-button type="primary" @click="saveStrategy">
                  <el-icon><Check /></el-icon>
                  保存策略
                </el-button>
              </div>
            </template>
            
            <el-form :model="strategyForm" label-width="100px">
              <el-form-item label="策略名称">
                <el-input v-model="strategyForm.name" placeholder="输入策略名称" />
              </el-form-item>
              
              <el-form-item label="发布平台">
                <el-checkbox-group v-model="strategyForm.platforms">
                  <el-checkbox label="微信公众号" />
                  <el-checkbox label="微博" />
                  <el-checkbox label="抖音" />
                  <el-checkbox label="小红书" />
                  <el-checkbox label="B站" />
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="内容类型">
                <el-select v-model="strategyForm.contentType" multiple placeholder="选择内容类型">
                  <el-option label="图文" value="image-text" />
                  <el-option label="视频" value="video" />
                  <el-option label="直播" value="live" />
                  <el-option label="音频" value="audio" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="发布频率">
                <el-select v-model="strategyForm.frequency" placeholder="选择发布频率">
                  <el-option label="每日" value="daily" />
                  <el-option label="每周3-5次" value="frequent" />
                  <el-option label="每周1-2次" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="目标受众">
                <el-input
                  type="textarea"
                  :rows="3"
                  v-model="strategyForm.targetAudience"
                  placeholder="描述您的目标受众特征..."
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="strategy-tips">
            <template #header>
              <span>策略建议</span>
            </template>
            
            <div class="tips-content">
              <el-timeline>
                <el-timeline-item timestamp="周一" type="primary">
                  <p>发布行业资讯类内容</p>
                </el-timeline-item>
                <el-timeline-item timestamp="周三" type="success">
                  <p>发布教程或干货分享</p>
                </el-timeline-item>
                <el-timeline-item timestamp="周五" type="warning">
                  <p>发布互动或娱乐内容</p>
                </el-timeline-item>
                <el-timeline-item timestamp="周日" type="info">
                  <p>发布总结或预告内容</p>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check } from '@element-plus/icons-vue'

const strategyForm = ref({
  name: '',
  platforms: [],
  contentType: [],
  frequency: 'weekly',
  targetAudience: ''
})

const saveStrategy = () => {
  console.log('保存策略:', strategyForm.value)
}
</script>

<style scoped>
.strategy-management {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.management-header {
  text-align: center;
  margin-bottom: 30px;
}

.management-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.management-header p {
  font-size: 16px;
  color: var(--text-color-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips-content {
  padding: 10px 0;
}
</style>