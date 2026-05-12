<template>
  <div class="home-container">
    <div class="sidebar">
      <el-card>
        <template #header>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <h4>公司列表</h4>
              <el-input v-model="filterText" placeholder="输入关键字过滤" size="small" style="width: 150px" clearable />
            </div>
            <el-select v-model="selectedFactoryType" placeholder="选择工厂类型" size="small" style="width: 100%;">
              <el-option label="猪场" value="pig" />
              <el-option label="鸡场" value="chicken" />
              <el-option label="水产" value="aquatic" />
            </el-select>
          </div>
        </template>
        <el-tree :data="companies" node-key="id" :props="{
          label: 'name',
          value: 'id',
          children: 'children'
        }" @node-click="handleNodeClick" highlight-current
          :expand-on-click-node="false" :filter-node-method="filterNode" ref="companyTree">
        </el-tree>
      </el-card>
    </div>
    <div class="main-content">
      <div class="content-header">
        <h2>{{ currentFactory || '请选择工厂' }}</h2>
      </div>
      
      <div class="top-section">
        <div class="panel overview-panel">
          <div class="panel-title">工厂概览</div>
          <div v-if="selectedFactoryType === 'aquatic'" class="stats-grid stats-grid-5">
            <div class="stat-item">
              <div class="stat-value">24</div>
              <div class="stat-label">池塘数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">3,200</div>
              <div class="stat-label">养殖面积</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">85,600</div>
              <div class="stat-label">存塘总量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">5</div>
              <div class="stat-label">离线设备</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">2</div>
              <div class="stat-label">今日告警</div>
            </div>
          </div>
          <div v-else class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">156</div>
              <div class="stat-label">栏舍总数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">12,850</div>
              <div class="stat-label">存栏总量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">5</div>
              <div class="stat-label">离线设备</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">3</div>
              <div class="stat-label">今日告警</div>
            </div>
          </div>
        </div>
        
        <div class="panel chart-panel">
          <div class="panel-header-row">
            <div class="panel-title">数据监测</div>
            <div class="panel-actions">
              <el-select v-if="selectedFactoryType === 'chicken'" v-model="chickenType" placeholder="选择品种" size="small" style="width: 120px; margin-right: 10px;">
                <el-option label="肉鸡" value="broiler" />
                <el-option label="蛋鸡" value="layer" />
              </el-select>
              <el-select v-if="selectedFactoryType === 'aquatic'" v-model="aquaticType" placeholder="选择品种" size="small" style="width: 120px; margin-right: 10px;">
                <el-option label="鱼" value="fish" />
                <el-option label="虾" value="shrimp" />
              </el-select>
            </div>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
        
        <div class="panel video-panel">
          <div class="panel-header-row">
            <div class="panel-title">视频监控</div>
            <div class="panel-actions">
              <el-select v-model="selectedCamera" placeholder="选择监控" style="width: 160px; margin-right: 10px;">
                <el-option 
                  v-for="camera in cameraList" 
                  :key="camera.id" 
                  :label="camera.name" 
                  :value="camera.id"
                />
              </el-select>
              <el-button type="primary" :icon="Refresh" circle @click="refreshVideo" />
            </div>
          </div>
          <div class="video-placeholder">
            <el-icon class="video-icon"><VideoCamera /></el-icon>
            <p>{{ currentCameraName }} - 监控画面</p>
          </div>
        </div>
      </div>
      
      <div class="bottom-section">
        <div class="panel barn-panel" v-for="barn in barnList" :key="barn.id">
          <div class="barn-header">
            <div class="barn-title">
              <span class="barn-name">{{ selectedFactoryType === 'aquatic' ? barn.name.replace('保育舍', '车间') : barn.name }}</span>
              <el-tag :type="barn.status === '正常' ? 'success' : 'warning'" size="small">
                {{ barn.status }}
              </el-tag>
            </div>
            <el-button type="primary" link @click="goToBarnDetail(barn)">查看详情</el-button>
          </div>
          <div class="barn-content">
            <div class="barn-stat">
              <span class="label">{{ selectedFactoryType === 'aquatic' ? '氧气' : '存栏' }}</span>
              <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.oxygen : barn.stock }}{{ selectedFactoryType === 'aquatic' ? '%' : '' }}</span>
            </div>
            <div class="barn-stat">
              <span class="label">温度</span>
              <span class="value">{{ barn.temp }}°C</span>
            </div>
            <div class="barn-stat">
              <span class="label">湿度</span>
              <span class="value">{{ barn.humidity }}%</span>
            </div>
            <div class="barn-stat">
              <span class="label">{{ selectedFactoryType === 'aquatic' ? 'PH值' : '通风' }}</span>
              <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.ph : barn.ventilation }}{{ selectedFactoryType === 'aquatic' ? '' : '%' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoCamera, Refresh } from '@element-plus/icons-vue'
import { sdk } from '@/utils/sdk'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const router = useRouter()

const companies = ref<any[]>([])
const filterText = ref('')
const companyTree = ref()

const currentNodeData = ref<any>(null)
const lastLeafNode = ref<any>(null) // 记录最后一次选择的叶子节点

const currentFactory = ref('')

// 工厂类型选择器
const selectedFactoryType = ref('pig')
// 鸡场品种选择
const chickenType = ref('broiler')
// 水产品种选择
const aquaticType = ref('fish')

const selectedCamera = ref(1)
const cameraList = ref([
  { id: 1, name: '大门入口' },
  { id: 2, name: '猪舍A区' },
  { id: 3, name: '猪舍B区' },
  { id: 4, name: '饲料仓库' },
  { id: 5, name: '办公区域' },
  { id: 6, name: '围墙周界' }
])

const currentCameraName = computed(() => {
  const camera = cameraList.value.find(c => c.id === selectedCamera.value)
  return camera ? camera.name : '请选择监控'
})

const refreshVideo = () => {
  ElMessage.success('刷新成功')
}

const goToBarnDetail = (barn: any) => {
  router.push({ path: '/barn-detail', query: { id: barn.id, name: barn.name } })
}

const barnList = ref([
  { id: 1, name: '保育舍1', status: '正常', stock: 1200, temp: 24, humidity: 65, ventilation: 80, oxygen: 85, ph: 7.2 },
  { id: 2, name: '保育舍2', status: '正常', stock: 1150, temp: 25, humidity: 62, ventilation: 75, oxygen: 82, ph: 7.1 },
  { id: 3, name: '保育舍3', status: '正常', stock: 1100, temp: 24, humidity: 68, ventilation: 82, oxygen: 88, ph: 7.3 },
  { id: 4, name: '保育舍4', status: '告警', stock: 1080, temp: 27, humidity: 78, ventilation: 55, oxygen: 72, ph: 6.8 },
  { id: 5, name: '分娩舍1', status: '正常', stock: 580, temp: 26, humidity: 70, ventilation: 85, oxygen: 90, ph: 7.4 },
  { id: 6, name: '分娩舍2', status: '告警', stock: 620, temp: 28, humidity: 75, ventilation: 60, oxygen: 68, ph: 6.5 },
  { id: 7, name: '分娩舍3', status: '正常', stock: 550, temp: 25, humidity: 68, ventilation: 88, oxygen: 86, ph: 7.2 },
  { id: 8, name: '分娩舍4', status: '正常', stock: 560, temp: 26, humidity: 72, ventilation: 83, oxygen: 83, ph: 7.1 }
])

// 图表相关
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const generateChartData = () => {
  const dates = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  let option: EChartsOption = {}

  if (selectedFactoryType.value === 'pig') {
    // 猪场：水耗、料耗、估重三条曲线
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 60, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330], areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: [220, 182, 191, 234, 290, 330, 310, 280, 320, 280, 290, 310], areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: [150, 232, 201, 154, 190, 330, 410, 382, 441, 484, 520, 560], areaStyle: { opacity: 0.3 } }
      ]
    }
  } else if (selectedFactoryType.value === 'chicken') {
    if (chickenType.value === 'broiler') {
      // 肉鸡：料耗、增重曲线
      option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['料耗', '增重'], bottom: 0 },
        grid: { top: 40, left: '3%', right: '4%', bottom: 60, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates },
        yAxis: { type: 'value' },
        series: [
          { name: '料耗', type: 'line', smooth: true, data: [80, 92, 101, 114, 100, 130, 145, 132, 151, 164, 170, 180], areaStyle: { opacity: 0.3 } },
          { name: '增重', type: 'line', smooth: true, data: [150, 232, 301, 354, 400, 480, 550, 620, 680, 740, 800, 850], areaStyle: { opacity: 0.3 } }
        ]
      }
    } else {
      // 蛋鸡：料耗、产蛋量曲线
      option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['料耗', '产蛋量'], bottom: 0 },
        grid: { top: 40, left: '3%', right: '4%', bottom: 60, containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates },
        yAxis: { type: 'value' },
        series: [
          { name: '料耗', type: 'line', smooth: true, data: [90, 95, 92, 88, 90, 85, 93, 89, 87, 91, 88, 92], areaStyle: { opacity: 0.3 } },
          { name: '产蛋量', type: 'line', smooth: true, data: [2000, 2200, 2150, 2100, 2250, 2180, 2300, 2220, 2190, 2240, 2200, 2280], areaStyle: { opacity: 0.3 } }
        ]
      }
    }
  } else if (selectedFactoryType.value === 'aquatic') {
    // 水产：投饵量、出苗量、出苗率、增重四条曲线
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['投饵量', '出苗量', '出苗率', '增重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 60, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: [
        { type: 'value', name: '量' },
        { type: 'value', name: '率(%)', position: 'right', max: 100 }
      ],
      series: [
        { name: '投饵量', type: 'line', smooth: true, yAxisIndex: 0, data: [150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260], areaStyle: { opacity: 0.3 } },
        { name: '出苗量', type: 'line', smooth: true, yAxisIndex: 0, data: [50, 55, 60, 70, 80, 95, 110, 125, 135, 145, 155, 170], areaStyle: { opacity: 0.3 } },
        { name: '出苗率', type: 'line', smooth: true, yAxisIndex: 1, data: [35, 38, 40, 42, 45, 48, 50, 52, 53, 54, 56, 58], areaStyle: { opacity: 0.3 } },
        { name: '增重', type: 'line', smooth: true, yAxisIndex: 0, data: [100, 150, 220, 300, 380, 460, 520, 600, 680, 750, 820, 900], areaStyle: { opacity: 0.3 } }
      ]
    }
  } else {
    // 全部：默认显示猪场数据
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 60, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330], areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: [220, 182, 191, 234, 290, 330, 310, 280, 320, 280, 290, 310], areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: [150, 232, 201, 154, 190, 330, 410, 382, 441, 484, 520, 560], areaStyle: { opacity: 0.3 } }
      ]
    }
  }
  return option
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return
  chartInstance.setOption(generateChartData(), true)
}

// 监听相关参数变化
watch([selectedFactoryType, chickenType, aquaticType], () => {
  updateChart()
})

watch(filterText, (val) => {
  companyTree.value?.filter(val)
})

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.name.includes(value) || data.code.includes(value)
}

onMounted(async () => {
  await loadCompanys()
  setTimeout(initChart, 100)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})

async function loadCompanys() {
  try {
    const res = await sdk.company.treenode()
    if (res.data && res.data.data) {
      companies.value = res.data.data.map((group: any) => ({
        ...group,
        children: [] // 初始化空子节点
      }))
    }
  } catch (err) {
    console.error('Failed to load groups:', err)
  }
}

const handleNodeClick = async (data: any) => {
  currentNodeData.value = data
  // 如果节点有子节点但未加载，则从API获取
  if (data.children.length === 0) {
    refreshNodeData()
  }

  // 判断是否为叶子节点（没有子节点）
  const isLeafNode = !data.children || data.children.length === 0
  
  if (isLeafNode) {
    // 如果是叶子节点，更新显示
    lastLeafNode.value = data
    currentFactory.value = data.name
    console.log('点击叶子节点，:', data)
    // let res = await sdk.factory.info.get(data.id)
    // console.log('获取工厂详情，:', res)
  } else {
    // 如果不是叶子节点，保持显示最后一次选择的叶子节点
    if (lastLeafNode.value) {
      currentFactory.value = lastLeafNode.value.name
    }
  }
}

async function refreshNodeData() {
  if (!currentNodeData.value) return
  
  try {
    // const res = await axios.get(`/api/tenant/groups/${currentNodeData.value.id}/children`)
    const res = await sdk.company.treenode(currentNodeData.value.id)
    if (res.data && res.data.data) {
      currentNodeData.value.children = res.data.data.map((child: any) => ({
        ...child,
        children: [] // 初始化空子节点
      }))
      companyTree.value?.updateKeyChildren(currentNodeData.value.id, currentNodeData.value.children)
      // 展开当前节点
    }
  } catch (err) {
    console.error('Failed to refresh node data:', err)
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  overflow: auto;
  border-right: 1px solid #e6e6e6;
}

/* 树节点样式 */
.sidebar :deep(.el-tree) {
  background: transparent;
}

.sidebar :deep(.el-tree-node__content) {
  height: 36px;
}

.sidebar :deep(.el-tree-node__content:hover) {
  background-color: #f0f7ff;
}

.sidebar :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
  color: #1890ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  margin: 0;
  color: #333;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.bottom-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  flex: 1;
  align-content: center;
}

.stats-grid-5 {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto;
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.video-placeholder {
  height: 180px;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.video-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #1890ff;
}

.chart-container {
  height: 180px;
  width: 100%;
  flex: 1;
}

.barn-panel {
  position: relative;
  overflow: hidden;
}

.barn-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
}

.barn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.barn-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.barn-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.barn-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.barn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  transition: all 0.2s;
}

.barn-stat:hover {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  transform: scale(1.02);
}

.barn-stat .label {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  font-weight: 500;
}

.barn-stat .value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}
</style>