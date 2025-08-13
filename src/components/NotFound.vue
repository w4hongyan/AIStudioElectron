<template>
  <div class="not-found">
    <div class="error-content">
      <div class="error-icon">
        <el-icon :size="64"><Warning /></el-icon>
      </div>
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>您访问的页面不存在或正在开发中</p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Warning, House, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.error-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 20px;
}

h1 {
  font-size: 72px;
  font-weight: bold;
  color: #f56c6c;
  margin: 0 0 10px 0;
  line-height: 1;
}

h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 15px 0;
}

p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 480px) {
  .error-actions {
    flex-direction: column;
  }
  
  .error-content {
    margin: 20px;
    padding: 30px;
  }
}
</style>