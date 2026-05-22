<template>
  <LayoutWithSidebar>
    <div class="farm-detail-content">
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
            <div class="stat-item stat-clickable" @click="goToDeviceDetail">
              <div class="stat-value">5</div>
              <div class="stat-label">离线设备</div>
            </div>
            <div class="stat-item stat-clickable" @click="goToAlarmDetail">
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
            <div class="stat-item stat-clickable" @click="goToDeviceDetail">
              <div class="stat-value">5</div>
              <div class="stat-label">离线设备</div>
            </div>
            <div class="stat-item stat-clickable" @click="goToAlarmDetail">
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
              <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.oxygen : barn.stock }}{{ selectedFactoryType === 'aquatic' ? '' : '' }}</span>
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
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoCamera, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'
import { useCompanyTree } from '@/composables/useCompanyTree'

const router = useRouter()

// 使用 useCompanyTree 获取选中的工厂类型和数据（现在是单例，与 LayoutWithSidebar 共享）
const { selectedFactoryType, currentFactory } = useCompanyTree()

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

const goToDeviceDetail = () => {
  router.push({ path: '/farm/device-detail' })
}

const goToAlarmDetail = () => {
  router.push({ path: '/farm/alarm-detail' })
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

const generateChartData = (factoryType: string) => {
  // 生成近30天的日期
  const dates = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    dates.push(`${month}-${day}`)
  }
  
  let option: EChartsOption = {}

  if (factoryType === 'pig') {
    // 猪场：水耗、料耗、估重三条曲线
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: dates,
        axisLabel: {
          fontSize: 10,
          rotate: 45
        }
      },
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: generateRandomData(30, 100, 350), areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 200, 350), areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: generateRandomData(30, 150, 600), areaStyle: { opacity: 0.3 } }
      ]
    }
  } else if (factoryType === 'chicken') {
    if (chickenType.value === 'broiler') {
      // 肉鸡：料耗、增重曲线
      option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['料耗', '增重'], bottom: 0 },
        grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
        xAxis: { 
          type: 'category', 
          boundaryGap: false, 
          data: dates,
          axisLabel: {
            fontSize: 10,
            rotate: 45
          }
        },
        yAxis: { type: 'value' },
        series: [
          { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 70, 200), areaStyle: { opacity: 0.3 } },
          { name: '增重', type: 'line', smooth: true, data: generateRandomData(30, 150, 900), areaStyle: { opacity: 0.3 } }
        ]
      }
    } else {
      // 蛋鸡：料耗、产蛋量曲线
      option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['料耗', '产蛋量'], bottom: 0 },
        grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
        xAxis: { 
          type: 'category', 
          boundaryGap: false, 
          data: dates,
          axisLabel: {
            fontSize: 10,
            rotate: 45
          }
        },
        yAxis: { type: 'value' },
        series: [
          { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 80, 100), areaStyle: { opacity: 0.3 } },
          { name: '产蛋量', type: 'line', smooth: true, data: generateRandomData(30, 2000, 2400), areaStyle: { opacity: 0.3 } }
        ]
      }
    }
  } else if (factoryType === 'aquatic') {
    // 水产：投饵量、出苗量、出苗率、增重四条曲线
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['投饵量', '出苗量', '出苗率', '增重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: dates,
        axisLabel: {
          fontSize: 10,
          rotate: 45
        }
      },
      yAxis: [
        { type: 'value', name: '量' },
        { type: 'value', name: '率(%)', position: 'right', max: 100 }
      ],
      series: [
        { name: '投饵量', type: 'line', smooth: true, yAxisIndex: 0, data: generateRandomData(30, 150, 280), areaStyle: { opacity: 0.3 } },
        { name: '出苗量', type: 'line', smooth: true, yAxisIndex: 0, data: generateRandomData(30, 50, 180), areaStyle: { opacity: 0.3 } },
        { name: '出苗率', type: 'line', smooth: true, yAxisIndex: 1, data: generateRandomData(30, 35, 60), areaStyle: { opacity: 0.3 } },
        { name: '增重', type: 'line', smooth: true, yAxisIndex: 0, data: generateRandomData(30, 100, 950), areaStyle: { opacity: 0.3 } }
      ]
    }
  } else {
    // 全部：默认显示猪场数据
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: { 
        type: 'category', 
        boundaryGap: false, 
        data: dates,
        axisLabel: {
          fontSize: 10,
          rotate: 45
        }
      },
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: generateRandomData(30, 100, 350), areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 200, 350), areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: generateRandomData(30, 150, 600), areaStyle: { opacity: 0.3 } }
      ]
    }
  }
  return option
}

// 生成随机数据的辅助函数
const generateRandomData = (count: number, min: number, max: number) => {
  const data = []
  for (let i = 0; i < count; i++) {
    const value = Math.floor(Math.random() * (max - min + 1)) + min
    data.push(value)
  }
  return data
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return
  
  console.log('updateChart 执行，当前类型:', selectedFactoryType.value)
  
  // 先清除图表，确保完全更新
  chartInstance.clear()
  
  // 使用 notMerge: true 强制完全替换配置，而不是合并
  chartInstance.setOption(generateChartData(selectedFactoryType.value), { 
    notMerge: true,
    lazyUpdate: false
  })
}

// 监听相关参数变化
watch([selectedFactoryType, chickenType, aquaticType], (newValues) => {
  console.log('监听到参数变化，更新图表:', newValues)
  updateChart()
}, { immediate: false, deep: true })

onMounted(() => {
  setTimeout(initChart, 100)
  
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<style scoped>
.farm-detail-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  margin-bottom: 20px;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.bottom-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  padding-bottom: 5px;
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

.stat-clickable {
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-clickable:hover {
  background: rgba(24, 144, 255, 0.1);
  transform: scale(1.05);
}

.stat-clickable:hover .stat-value {
  color: #409eff;
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
