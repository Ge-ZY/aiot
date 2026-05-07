<template>
  <div class="barn-detail">
    <div class="page-header">
      <div class="header-left">
        <h1>{{ barnName }} - 详情监控</h1>
      </div>
      <div class="header-right">
        <el-select v-model="selectedBarn" placeholder="请选择栏舍" @change="handleBarnChange" style="width: 200px;">
          <el-option
            v-for="barn in barnList"
            :key="barn.id"
            :label="barn.name"
            :value="barn.id"
          />
        </el-select>
      </div>
    </div>

    <div class="detail-content">
      <div class="top-section">
        <div class="panel video-panel">
          <div class="panel-header">
            <h3>视频监控</h3>
          </div>
          <div class="video-placeholder">
            <el-icon class="video-icon"><VideoCamera /></el-icon>
            <p>舍内监控画面</p>
          </div>
        </div>

        <div class="panel chart-panel">
          <div class="panel-header">
            <h3>温度趋势</h3>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="bottom-section">
        <div class="panel indicators-panel">
          <div class="panel-header">
            <h3>环境指标</h3>
          </div>
          <div class="indicators-grid">
            <div class="indicator-item">
              <div class="indicator-label">平均温度</div>
              <div class="indicator-value" style="color: #409eff;">24.5°C</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">温度一</div>
              <div class="indicator-value" style="color: #67c23a;">24.2°C</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">温度二</div>
              <div class="indicator-value" style="color: #e6a23c;">24.8°C</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">CO₂浓度</div>
              <div class="indicator-value" style="color: #f56c6c;">1250 ppm</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">舍外温度</div>
              <div class="indicator-value" style="color: #909399;">18°C</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">饮水量</div>
              <div class="indicator-value" style="color: #409eff;">1560 L</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">相对湿度</div>
              <div class="indicator-value" style="color: #67c23a;">65%</div>
            </div>
            <div class="indicator-item">
              <div class="indicator-label">光照强度</div>
              <div class="indicator-value" style="color: #e6a23c;">450 Lux</div>
            </div>
          </div>
        </div>

        <div class="panel devices-panel">
          <div class="panel-header">
            <h3>舍内设备</h3>
          </div>
          <div class="devices-grid">
            <div class="device-item">
              <div class="device-name">24变频风机</div>
              <el-switch v-model="devices.fan24" active-color="#67c23a" />
              <div class="device-status" :class="{ on: devices.fan24 }">{{ devices.fan24 ? '运行中' : '已关闭' }}</div>
            </div>
            <div class="device-item">
              <div class="device-name">吊顶小窗</div>
              <el-switch v-model="devices.ceilingWindow" active-color="#67c23a" />
              <div class="device-status" :class="{ on: devices.ceilingWindow }">{{ devices.ceilingWindow ? '已打开' : '已关闭' }}</div>
            </div>
            <div class="device-item">
              <div class="device-name">36风机</div>
              <el-switch v-model="devices.fan36" active-color="#67c23a" />
              <div class="device-status" :class="{ on: devices.fan36 }">{{ devices.fan36 ? '运行中' : '已关闭' }}</div>
            </div>
            <div class="device-item">
              <div class="device-name">50风机</div>
              <el-switch v-model="devices.fan50" active-color="#67c23a" />
              <div class="device-status" :class="{ on: devices.fan50 }">{{ devices.fan50 ? '运行中' : '已关闭' }}</div>
            </div>
            <div class="device-item">
              <div class="device-name">水帘</div>
              <el-switch v-model="devices.waterCurtain" active-color="#67c23a" />
              <div class="device-status" :class="{ on: devices.waterCurtain }">{{ devices.waterCurtain ? '运行中' : '已关闭' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { VideoCamera } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const route = useRoute()
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const barnList = ref([
  { id: 1, name: '保育舍1' },
  { id: 2, name: '保育舍2' },
  { id: 3, name: '分娩舍1' },
  { id: 4, name: '分娩舍2' }
])

const selectedBarn = ref<number>(1)
const barnName = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn ? barn.name : '保育舍'
})

const devices = ref({
  fan24: true,
  ceilingWindow: true,
  fan36: false,
  fan50: true,
  waterCurtain: false
})

const handleBarnChange = () => {
  // 切换栏舍时重新生成数据
  if (chartInstance) {
    const dates = generateDateData()
    const { avgTemp, heatTemp, coolTemp, targetTemp } = generateTempData()
    const option = chartInstance.getOption() as any
    option.xAxis[0].data = dates
    option.series[0].data = avgTemp
    option.series[1].data = heatTemp
    option.series[2].data = coolTemp
    option.series[3].data = targetTemp
    chartInstance.setOption(option)
  }
  // 随机更新设备状态
  devices.value = {
    fan24: Math.random() > 0.5,
    ceilingWindow: Math.random() > 0.5,
    fan36: Math.random() > 0.5,
    fan50: Math.random() > 0.5,
    waterCurtain: Math.random() > 0.5
  }
}

// 初始化选择默认选中栏舍
const initSelectedBarn = () => {
  const nameFromRoute = route.query.name as string
  if (nameFromRoute) {
    const barn = barnList.value.find(b => b.name === nameFromRoute)
    if (barn) {
      selectedBarn.value = barn.id
      return
    }
  }
  // 如果没有找到，默认选中第一个
  selectedBarn.value = barnList.value[0].id
}

const generateDateData = () => {
  const dates = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push(`${month}-${day}`)
  }
  return dates
}

const generateTempData = () => {
  const avgTemp = []
  const heatTemp = []
  const coolTemp = []
  const targetTemp = []
  
  for (let i = 0; i < 30; i++) {
    const baseTemp = 24 + Math.sin(i / 5) * 1
    avgTemp.push((baseTemp + (Math.random() - 0.5) * 2).toFixed(1))
    heatTemp.push((baseTemp + 1.5 + (Math.random() - 0.5) * 1).toFixed(1))
    coolTemp.push((baseTemp - 1.5 + (Math.random() - 0.5) * 1).toFixed(1))
    targetTemp.push((24 + Math.sin(i / 5) * 0.5).toFixed(1))
  }
  
  return { avgTemp, heatTemp, coolTemp, targetTemp }
}

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  const dates = generateDateData()
  const { avgTemp, heatTemp, coolTemp, targetTemp } = generateTempData()

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: '#409eff',
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      data: ['平均温度', '加热温度', '制冷温度', '目标温度'],
      textStyle: {
        color: 'rgba(255, 255, 255, 0.8)'
      }
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
        fontSize: 11,
        interval: 4
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '温度(°C)',
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
        name: '平均温度',
        type: 'line',
        smooth: true,
        data: avgTemp,
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '加热温度',
        type: 'line',
        smooth: true,
        data: heatTemp,
        lineStyle: {
          color: '#e6a23c',
          width: 2
        },
        itemStyle: {
          color: '#e6a23c'
        }
      },
      {
        name: '制冷温度',
        type: 'line',
        smooth: true,
        data: coolTemp,
        lineStyle: {
          color: '#67c23a',
          width: 2
        },
        itemStyle: {
          color: '#67c23a'
        }
      },
      {
        name: '目标温度',
        type: 'line',
        smooth: true,
        data: targetTemp,
        lineStyle: {
          color: '#f56c6c',
          width: 2
        },
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initSelectedBarn()
    initChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.barn-detail {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 100px);
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 300px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 300px;
}

.panel {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  padding: 20px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.video-placeholder {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.video-icon {
  font-size: 48px;
  margin-bottom: 10px;
  color: #409eff;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 250px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.indicator-item {
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
}

.indicator-item:hover {
  background: rgba(64, 158, 255, 0.2);
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.3);
}

.indicator-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.indicator-value {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 15px currentColor;
}

.devices-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.device-item {
  background: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.device-item:hover {
  background: rgba(103, 194, 58, 0.2);
  box-shadow: 0 0 20px rgba(103, 194, 58, 0.3);
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.device-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.device-status.on {
  color: #67c23a;
  text-shadow: 0 0 10px #67c23a;
}
</style>
