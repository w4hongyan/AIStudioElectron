<template>
  <div class="strategy-manager">
    <el-alert
      title="🎯 策略管理：AI驱动的智能运营决策系统"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <!-- 策略概览卡片 -->
    <div class="strategy-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="strategy-card">
            <div class="card-content">
              <div class="icon">📊</div>
              <div class="data">
                <div class="number">{{ activeStrategies }}</div>
                <div class="label">活跃策略</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="strategy-card">
            <div class="card-content">
              <div class="icon">🎯</div>
              <div class="data">
                <div class="number">{{ avgImprovement }}%</div>
                <div class="label">平均提升</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="strategy-card">
            <div class="card-content">
              <div class="icon">⚡</div>
              <div class="data">
                <div class="number">{{ automatedTasks }}</div>
                <div class="label">自动化任务</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="strategy-card">
            <div class="card-content">
              <div class="icon">🔄</div>
              <div class="data">
                <div class="number">{{ runningTests }}</div>
                <div class="label">A/B测试中</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 策略类型选择 -->
    <div class="strategy-types">
      <el-card>
        <template #header>
          <span>🎯 策略类型</span>
          <el-button type="primary" size="small" @click="createStrategy" style="float: right">
            <el-icon><Plus /></el-icon> 创建策略
          </el-button>
        </template>
        
        <el-tabs v-model="activeTab" class="strategy-tabs">
          <el-tab-pane label="内容策略" name="content">
            <div class="strategy-list">
              <div v-for="strategy in contentStrategies" :key="strategy.id" class="strategy-item">
                <div class="strategy-info">
                  <h4>{{ strategy.name }}</h4>
                  <p>{{ strategy.description }}</p>
                  <div class="metrics">
                    <el-tag size="small" :type="strategy.status === 'active' ? 'success' : 'info'">
                      {{ strategy.status === 'active' ? '运行中' : '已暂停' }}
                    </el-tag>
                    <span class="improvement">提升: {{ strategy.improvement }}%</span>
                  </div>
                </div>
                <div class="actions">
                  <el-button size="small" @click="toggleStrategy(strategy)">
                    {{ strategy.status === 'active' ? '暂停' : '启动' }}
                  </el-button>
                  <el-button size="small" type="primary" @click="viewDetails(strategy)">
                    详情
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="发布策略" name="publish">
            <div class="strategy-list">
              <div v-for="strategy in publishStrategies" :key="strategy.id" class="strategy-item">
                <div class="strategy-info">
                  <h4>{{ strategy.name }}</h4>
                  <p>{{ strategy.description }}</p>
                  <div class="metrics">
                    <el-tag size="small" :type="strategy.status === 'active' ? 'success' : 'info'">
                      {{ strategy.status === 'active' ? '运行中' : '已暂停' }}
                    </el-tag>
                    <span class="improvement">最佳时段: {{ strategy.optimalTime }}</span>
                  </div>
                </div>
                <div class="actions">
                  <el-button size="small" @click="toggleStrategy(strategy)">
                    {{ strategy.status === 'active' ? '暂停' : '启动' }}
                  </el-button>
                  <el-button size="small" type="primary" @click="viewDetails(strategy)">
                    详情
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="A/B测试" name="abtest">
            <div class="abtest-section">
              <el-button type="success" @click="createABTest">
                <el-icon><Plus /></el-icon> 新建A/B测试
              </el-button>
              
              <div class="test-list">
                <el-card v-for="test in abTests" :key="test.id" class="test-card">
                  <template #header>
                    <span>{{ test.name }}</span>
                    <el-progress 
                      :percentage="test.progress" 
                      style="width: 200px; float: right"
                    />
                  </template>
                  <div class="test-content">
                    <p>{{ test.description }}</p>
                    <div class="test-stats">
                      <span>测试组A: {{ test.groupA.views }} 次观看</span>
                      <span>测试组B: {{ test.groupB.views }} 次观看</span>
                    </div>
                    <div class="winner" v-if="test.winner">
                      🏆 胜出: {{ test.winner === 'A' ? test.groupA.name : test.groupB.name }}
                    </div>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 策略详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="策略详情" width="600px">
      <div v-if="selectedStrategy" class="strategy-detail">
        <h3>{{ selectedStrategy.name }}</h3>
        <p>{{ selectedStrategy.description }}</p>
        
        <div class="detail-section">
          <h4>📊 数据表现</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="metric-item">
                <div class="metric-label">平均提升</div>
                <div class="metric-value">{{ selectedStrategy.improvement }}%</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="metric-item">
                <div class="metric-label">应用次数</div>
                <div class="metric-value">{{ selectedStrategy.applications }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="detail-section">
          <h4>⚙️ 配置参数</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="策略类型">
              {{ selectedStrategy.type }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ selectedStrategy.createdAt }}
            </el-descriptions-item>
            <el-descriptions-item label="最后更新">
              {{ selectedStrategy.updatedAt }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 创建策略对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建新策略" width="500px">
      <el-form :model="newStrategy" label-width="100px">
        <el-form-item label="策略名称">
          <el-input v-model="newStrategy.name" placeholder="输入策略名称" />
        </el-form-item>
        <el-form-item label="策略类型">
          <el-select v-model="newStrategy.type" placeholder="选择策略类型">
            <el-option label="内容优化" value="content" />
            <el-option label="发布时间" value="publish" />
            <el-option label="标签优化" value="tags" />
            <el-option label="互动策略" value="engagement" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newStrategy.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStrategy">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, TrendCharts, Clock, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const activeStrategies = ref(8)
const avgImprovement = ref(35)
const automatedTasks = ref(12)
const runningTests = ref(3)
const activeTab = ref('content')
const detailDialogVisible = ref(false)
const createDialogVisible = ref(false)
const selectedStrategy = ref(null)

// 策略数据
const contentStrategies = ref([
  {
    id: 1,
    name: '标题情感优化',
    description: '基于情感分析优化标题，提升点击率',
    status: 'active',
    improvement: 28,
    type: '内容优化',
    applications: 156,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  },
  {
    id: 2,
    name: '热门标签推荐',
    description: 'AI推荐当前热门标签，提升曝光量',
    status: 'active',
    improvement: 42,
    type: '标签优化',
    applications: 89,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-19'
  }
])

const publishStrategies = ref([
  {
    id: 3,
    name: '黄金时段发布',
    description: '基于受众活跃时间智能选择发布时间',
    status: 'active',
    improvement: 35,
    optimalTime: '19:30-21:00',
    type: '发布时间',
    applications: 234,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-20'
  },
  {
    id: 4,
    name: '周末特殊时段',
    description: '针对周末用户行为调整发布策略',
    status: 'paused',
    improvement: 22,
    optimalTime: '10:00-11:30',
    type: '发布时间',
    applications: 45,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-15'
  }
])

const abTests = ref([
  {
    id: 1,
    name: '封面A/B测试',
    description: '测试不同封面风格对点击率的影响',
    progress: 65,
    groupA: { name: '明亮风格', views: 1250 },
    groupB: { name: '暗色风格', views: 1180 },
    winner: null
  },
  {
    id: 2,
    name: '标题长度测试',
    description: '测试短标题vs长标题的表现差异',
    progress: 100,
    groupA: { name: '15字以内', views: 890 },
    groupB: { name: '25字以上', views: 1200 },
    winner: 'B'
  }
])

const newStrategy = reactive({
  name: '',
  type: '',
  description: ''
})

// 方法
const createStrategy = () => {
  createDialogVisible.value = true
}

const saveStrategy = () => {
  const strategy = {
    id: Date.now(),
    name: newStrategy.name,
    description: newStrategy.description,
    status: 'active',
    improvement: Math.floor(Math.random() * 30) + 10,
    type: newStrategy.type,
    applications: 0,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  }

  if (newStrategy.type === 'content' || newStrategy.type === 'tags') {
    contentStrategies.value.push(strategy)
  } else {
    publishStrategies.value.push(strategy)
  }

  ElMessage.success('策略创建成功！')
  createDialogVisible.value = false
  
  // 重置表单
  newStrategy.name = ''
  newStrategy.type = ''
  newStrategy.description = ''
}

const toggleStrategy = (strategy) => {
  strategy.status = strategy.status === 'active' ? 'paused' : 'active'
  ElMessage.success(strategy.status === 'active' ? '策略已启动' : '策略已暂停')
}

const viewDetails = (strategy) => {
  selectedStrategy.value = strategy
  detailDialogVisible.value = true
}

const createABTest = () => {
  ElMessageBox.prompt('请输入A/B测试名称', '创建A/B测试', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    abTests.value.push({
      id: Date.now(),
      name: value,
      description: '新创建的A/B测试',
      progress: 0,
      groupA: { name: '测试组A', views: 0 },
      groupB: { name: '测试组B', views: 0 },
      winner: null
    })
    ElMessage.success('A/B测试创建成功！')
  })
}
</script>

<style scoped>
.strategy-manager {
  padding: 20px;
}

.strategy-overview {
  margin-bottom: 30px;
}

.strategy-card {
  text-align: center;
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.icon {
  font-size: 32px;
}

.data .number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.data .label {
  font-size: 14px;
  color: #666;
}

.strategy-list {
  padding: 20px 0;
}

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.strategy-item:last-child {
  border-bottom: none;
}

.strategy-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.strategy-info p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.metrics {
  display: flex;
  align-items: center;
  gap: 15px;
}

.improvement {
  color: #67c23a;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 10px;
}

.abtest-section {
  padding: 20px;
}

.test-list {
  margin-top: 20px;
}

.test-card {
  margin-bottom: 20px;
}

.test-content {
  padding: 15px 0;
}

.test-stats {
  display: flex;
  gap: 20px;
  margin: 10px 0;
  font-size: 14px;
}

.winner {
  color: #67c23a;
  font-weight: bold;
  margin-top: 10px;
}

.strategy-detail {
  padding: 20px;
}

.detail-section {
  margin: 20px 0;
}

.detail-section h4 {
  margin-bottom: 15px;
  color: #333;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
</style>