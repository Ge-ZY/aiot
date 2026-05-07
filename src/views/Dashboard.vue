<template>
  <div class="dashboard" :class="{ fullscreen: isFullscreen }">
    <div class="dashboard-header">
      <div class="header-left">
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">返回</el-button>
      </div>
      <div class="header-center">
        <h1>正芯农牧智慧监控管理平台</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="FullScreen" @click="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏' }}</el-button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="grid-container">
        <div class="panel farm-panel">
          <div class="panel-header">
            <h3>农场看板</h3>
          </div>
          <div class="farm-indicators">
            <div class="indicator">
              <div class="indicator-card">
                <div class="indicator-label">栏舍总数</div>
                <div class="indicator-value">{{ barnCount }}</div>
              </div>
            </div>
            <div class="indicator">
              <div class="indicator-card">
                <div class="indicator-label">存栏总量</div>
                <div class="indicator-value">{{ livestockCount }}</div>
              </div>
            </div>
          </div>
          <div class="map-container">
            <svg viewBox="0 0 800 600" class="china-map">
              <path d="M 100 100 L 200 80 L 300 120 L 400 100 L 500 150 L 600 120 L 700 200 L 650 300 L 550 350 L 450 320 L 350 380 L 250 350 L 150 400 L 100 300 L 80 200 Z" fill="rgba(64, 158, 255, 0.3)" stroke="#409eff" stroke-width="2" />
              <g v-for="(province, index) in provinces" :key="index">
                <circle :cx="province.x" :cy="province.y" r="12" :fill="province.color" :class="{'has-factory': province.hasFactory}" />
                <text :x="province.x" :y="province.y - 20" text-anchor="middle" fill="#fff" font-size="12">{{ province.name }}</text>
              </g>
            </svg>
          </div>
        </div>

        <div class="panel device-panel">
          <div class="panel-header">
            <h3>设备统计</h3>
          </div>
          <div class="device-list">
            <div class="device-item" v-for="(device, index) in devices" :key="index">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-count" :style="{ color: device.color }">{{ device.count }}</div>
            </div>
          </div>
        </div>

        <div class="bottom-left-container">
          <div class="panel energy-panel">
            <div class="panel-header">
              <h3>能源监控</h3>
            </div>
            <div class="panel-content">
              <div class="energy-item">
                <div class="energy-label">当日总水耗</div>
                <div class="energy-value">8,450 m³</div>
              </div>
              <div class="energy-item">
                <div class="energy-label">当日总电耗</div>
                <div class="energy-value">12,580 kWh</div>
              </div>
              <div class="energy-item">
                <div class="energy-label">当日总气耗</div>
                <div class="energy-value">3,200 m³</div>
              </div>
            </div>
          </div>

          <div class="panel security-panel">
            <div class="panel-header">
              <h3>安防监控</h3>
            </div>
            <div class="panel-content">
              <div class="video-container">
                <div class="video-placeholder">
                  <el-icon class="video-icon"><VideoCamera /></el-icon>
                  <p>{{ currentCamera }} 监控画面</p>
                </div>
              </div>
              <div class="camera-selector">
                <el-select v-model="currentCamera" placeholder="选择摄像头" style="width: 100%">
                  <el-option 
                    v-for="camera in cameras" 
                    :key="camera.id" 
                    :label="camera.name" 
                    :value="camera.name"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </div>

        <div class="panel alarm-panel">
          <div class="panel-header">
            <h3>栏舍报警趋势</h3>
          </div>
          <div class="panel-content">
            <div ref="alarmChartRef" class="alarm-chart"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FullScreen, VideoCamera } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const router = useRouter()
const isFullscreen = ref(false)
const alarmChartRef = ref<HTMLElement | null>(null)
let alarmChart: echarts.ECharts | null = null

const barnCount = ref(156)
const livestockCount = ref(12850)

const provinces = ref([
  { name: '黑龙江', x: 450, y: 120, color: '#67c23a', hasFactory: true },
  { name: '内蒙古', x: 300, y: 150, color: '#e6a23c', hasFactory: true },
  { name: '新疆', x: 150, y: 200, color: '#409eff', hasFactory: true },
  { name: '四川', x: 280, y: 300, color: '#67c23a', hasFactory: true },
  { name: '广东', x: 420, y: 420, color: '#f56c6c', hasFactory: true },
  { name: '山东', x: 500, y: 220, color: '#67c23a', hasFactory: true },
  { name: '河南', x: 450, y: 260, color: '#e6a23c', hasFactory: false }
])

const devices = ref([
  { name: '保温灯', count: 2340, color: '#e6a23c' },
  { name: '智能花洒', count: 1890, color: '#409eff' },
  { name: '环控器', count: 560, color: '#67c23a' },
  { name: '智能网关', count: 120, color: '#909399' },
  { name: '智能水表', count: 890, color: '#409eff' },
  { name: '智能电表', count: 1230, color: '#e6a23c' },
  { name: '在线', count: 5870, color: '#67c23a' },
  { name: '离线', count: 160, color: '#f56c6c' }
])

const currentCamera = ref('大门入口')
const cameras = ref([
  { id: 1, name: '大门入口' },
  { id: 2, name: '猪舍A区' },
  { id: 3, name: '猪舍B区' },
  { id: 4, name: '饲料仓库' },
  { id: 5, name: '办公区域' },
  { id: 6, name: '围墙周界' }
])

// 生成近30天数据
const generateLast30Days = () => {
  const dates: string[] = []
  const values: number[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    dates.push(`${month}-${day}`)
    values.push(Math.floor(Math.random() * 30) + 5)
  }
  return { dates, values }
}

const chartDates = ref<string[]>([])

const initAlarmChart = () => {
  if (!alarmChartRef.value) return
  
  alarmChart = echarts.init(alarmChartRef.value)
  const { dates, values } = generateLast30Days()
  chartDates.value = dates
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#409eff',
      textStyle: {
        color: '#fff'
      },
      enterable: true
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10,
        interval: 4
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '报警数量',
      nameTextStyle: {
        color: 'rgba(255, 255, 255, 0.7)'
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.3)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '报警数量',
        type: 'line',
        smooth: true,
        data: values,
        symbolSize: 5,
        symbol: 'circle',
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff',
          borderColor: '#fff',
          borderWidth: 1
        },
      }
    ]
  }
  
  alarmChart.setOption(option)
  
  alarmChart.getZr().on('click', (params: any) => {
    const pointInPixel = [params.offsetX, params.offsetY]
    if (alarmChart) {
      const pointInGrid = alarmChart.convertFromPixel('grid', pointInPixel)
      if (pointInGrid) {
        const dataIndex = Math.round(pointInGrid[0])
        if (dataIndex >= 0 && dataIndex < dates.length) {
          const year = new Date().getFullYear()
          const dateStr = `${year}-${dates[dataIndex]}`
          router.push({
            path: '/alarm-detail',
            query: { date: dateStr }
          })
        }
      }
    }
  })
  
  alarmChart.on('click', (params: any) => {
    const year = new Date().getFullYear()
    const dateStr = `${year}-${params.name}`
    router.push({
      path: '/alarm-detail',
      query: { date: dateStr }
    })
  })
}

const goBack = () => {
  router.push('/')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const handleResize = () => {
  alarmChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initAlarmChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  alarmChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
  z-index: 9999;
}

.dashboard.fullscreen {
  padding: 10px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-center h1 {
  margin: 0;
  font-size: 28px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-content {
  display: flex;
  height: calc(100vh - 80px);
}

.grid-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.bottom-left-container {
  display: flex;
  gap: 20px;
}

.bottom-left-container .panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  padding: 20px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #409eff;
}

.farm-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.device-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.alarm-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.farm-indicators {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 20px;
}

.indicator {
  text-align: center;
}

.indicator-card {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.3) 0%, rgba(64, 158, 255, 0.3) 100%);
  border: 2px solid rgba(103, 194, 58, 0.6);
  border-radius: 12px;
  padding: 15px 40px;
  box-shadow: 0 0 20px rgba(103, 194, 58, 0.4), inset 0 0 15px rgba(103, 194, 58, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.indicator-card:hover {
  transform: scale(1.05);
  box-shadow: 0 0 35px rgba(103, 194, 58, 0.6), inset 0 0 20px rgba(103, 194, 58, 0.2);
}

.indicator-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
  font-weight: 500;
}

.indicator-value {
  font-size: 36px;
  font-weight: bold;
  color: #67c23a;
  text-shadow: 0 0 20px rgba(103, 194, 58, 0.8);
  line-height: 1;
}

.map-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
}

.china-map {
  width: 100%;
  height: 100%;
  max-height: 400px;
}

.china-map circle.has-factory {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
}

.device-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.device-count {
  font-size: 20px;
  font-weight: bold;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.energy-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.energy-label {
  color: rgba(255, 255, 255, 0.7);
}

.energy-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.video-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.video-placeholder {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.video-icon {
  font-size: 48px;
  margin-bottom: 8px;
  color: #409eff;
}

.video-placeholder p {
  margin: 0;
  font-size: 14px;
}

.camera-selector {
  width: 100%;
}

.alarm-chart {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.dashboard::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.dashboard::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 3px;
}

.dashboard::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.3);
  border-radius: 3px;
}

.dashboard::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.5);
}

.dashboard::-webkit-scrollbar-corner {
  background: rgba(30, 41, 59, 0.3);
}

.panel-content::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.25);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.4);
}
</style>
