<template>
  <div class="barn-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" circle />
        <div>
          <div class="header-title-row">
            <h2>{{ barnName }}</h2>
            <el-tag :type="barnStatus === '正常' ? 'success' : 'danger'" size="small">{{ barnStatus }}</el-tag>
          </div>
          <span class="header-sub">舍内详情 · {{ factoryTypeLabel }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="selectedBarn" @change="handleBarnChange" placeholder="切换栏舍" style="width: 160px;">
          <el-option v-for="barn in barnList" :key="barn.id" :label="barn.name" :value="barn.id" />
        </el-select>
      </div>
    </div>

    <div class="pillars-stack">
      <!-- 1. 生物数据 -->
      <div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><DataLine /></el-icon> 生物数据</div>
        </div>
        <div class="bio-kpi-grid">
          <div
            v-for="item in bioKpiItems"
            :key="item.key"
            class="kpi-card"
            :class="item.cardClass"
          >
            <div class="kpi-value" :class="item.valueClass">{{ item.value }}</div>
            <div class="kpi-label">{{ item.label }}</div>
          </div>
        </div>

        <div v-if="specialMetrics.length" class="special-section">
          <div class="special-title">{{ specialSectionTitle }}</div>
          <div class="special-grid">
            <div
              v-for="item in specialMetrics"
              :key="item.key"
              class="special-card"
              :class="item.cardClass"
            >
              <div class="special-value" :class="item.valueClass">{{ item.value }}</div>
              <div class="special-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="sub-chart-wrap">
          <div class="sub-chart-title">{{ bioChartTitle }}</div>
          <div ref="bioChartRef" class="sub-chart"></div>
        </div>
      </div>

      <!-- 2. 环境数据 -->
      <div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Sunny /></el-icon> 环境数据</div>
          <span class="panel-meta">实时更新</span>
        </div>
        <div class="env-indicators">
          <div
            v-for="item in envIndicators"
            :key="item.label"
            class="env-item"
            :class="{ alarm: item.alarm }"
          >
            <div class="env-label">{{ item.label }}</div>
            <div class="env-value" :class="{ alarm: item.alarm }">{{ item.value }}</div>
            <el-tag v-if="item.alarm" type="danger" size="small" class="env-alarm-tag">异常</el-tag>
          </div>
        </div>
        <div class="sub-chart-wrap">
          <div class="sub-chart-title">近30日环境趋势</div>
          <div ref="chartRef" class="sub-chart"></div>
        </div>
      </div>

      <!-- 舍内监控 -->
      <div class="panel">
        <CameraPanel :cameras="barnCameraList" title="舍内监控" />
      </div>

      <!-- 3. 设备详情 -->
      <div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Setting /></el-icon> 设备详情</div>
          <span class="panel-meta">在线 {{ deviceOnlineCount }}/{{ deviceList.length }}</span>
        </div>
        <div class="device-grid">
          <div
            v-for="device in deviceList"
            :key="device.id"
            class="device-card"
            :class="{ offline: !device.online }"
          >
            <div class="device-card-header">
              <div class="device-info">
                <span class="device-name">{{ device.name }}</span>
                <span class="device-type">{{ device.type }}</span>
              </div>
              <el-tag :type="device.online ? 'success' : 'info'" size="small">
                {{ device.online ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="device-meta">
              <span>编号：{{ device.uuid }}</span>
              <span>{{ device.attribute }}</span>
            </div>
            <div v-if="device.controllable" class="device-control">
              <el-switch
                v-model="device.on"
                :disabled="!device.online"
                @change="handleDeviceToggle(device)"
              />
              <span class="device-run-status" :class="{ on: device.on && device.online }">
                {{ !device.online ? '离线' : device.on ? '运行中' : '已关闭' }}
              </span>
            </div>
            <div v-if="device.on && device.online && device.extra" class="device-extra">
              <div v-for="(val, key) in device.extra" :key="key" class="extra-row">
                <span>{{ extraLabelMap[key] || key }}</span>
                <span>{{ formatExtraValue(key, val) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, DataLine, Sunny, Setting } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import CameraPanel from '@/components/CameraPanel.vue'
import { useCompanyTree } from '@/composables/useCompanyTree'
import { getBarnCameras } from '@/utils/cameraMockData'

interface BarnOption {
  id: number
  name: string
  status: '正常' | '告警'
}

interface MetricItem {
  key: string
  value: string | number
  label: string
  valueClass?: string
  cardClass?: string
}

interface DeviceItem {
  id: number
  name: string
  type: string
  uuid: string
  attribute: string
  online: boolean
  controllable: boolean
  on: boolean
  extra?: Record<string, string | number>
}

const router = useRouter()
const route = useRoute()
const { selectedFactoryType, factoryTypes } = useCompanyTree()

type FactoryType = 'pig' | 'chicken' | 'aquatic' | 'feed'

const factoryType = computed<FactoryType>(() => {
  const fromQuery = route.query.factoryType as FactoryType | undefined
  if (fromQuery && ['pig', 'chicken', 'aquatic', 'feed'].includes(fromQuery)) return fromQuery
  return selectedFactoryType.value
})

const factoryTypeLabel = computed(() =>
  factoryTypes.find(t => t.value === factoryType.value)?.label ?? '栏舍'
)

const barnListByType: Record<FactoryType, BarnOption[]> = {
  pig: [
    { id: 1, name: '保育舍1', status: '正常' },
    { id: 2, name: '保育舍2', status: '正常' },
    { id: 3, name: '分娩舍1', status: '正常' },
    { id: 4, name: '保育舍4', status: '告警' },
    { id: 6, name: '分娩舍2', status: '告警' },
  ],
  chicken: [
    { id: 101, name: '蛋鸡舍1', status: '正常' },
    { id: 102, name: '蛋鸡舍2', status: '告警' },
    { id: 103, name: '肉鸡舍1', status: '正常' },
    { id: 104, name: '肉鸡舍2', status: '告警' },
  ],
  aquatic: [
    { id: 201, name: '养殖池1', status: '正常' },
    { id: 202, name: '养殖池2', status: '正常' },
    { id: 203, name: '养殖池3', status: '告警' },
  ],
  feed: [
    { id: 301, name: '猪饲料车间', status: '正常' },
    { id: 302, name: '鸡饲料车间', status: '正常' },
    { id: 303, name: '水产饲料车间', status: '告警' },
    { id: 304, name: '成品仓库', status: '正常' },
  ],
}

const barnList = computed(() => barnListByType[factoryType.value] ?? barnListByType.pig)

const selectedBarn = ref<number>(1)

const chartRef = ref<HTMLElement>()
const bioChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
let bioChartInstance: echarts.ECharts | null = null

const barnName = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.name ?? '栏舍'
})

const barnStatus = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.status ?? '正常'
})

const barnCameraList = computed(() => getBarnCameras(selectedBarn.value))

const bioData = ref({
  stock: 1200,
  todayMortality: 3,
  totalMortality: 28,
  mortalityRate: 0.25,
  todayFeed: 856,
  avgFeedPerHead: 0.71,
  todayWater: 12.5,
  totalFeed: 28500,
  avgWaterPerHead: 0.01,
  todayEggs: 8200,
  feedEggRatio: 2.1,
  todayBait: 320,
  todayWaterChange: 45,
  avgOxygen: 6.8,
  feedCoefficient: 1.35,
})

const envIndicators = ref([
  { label: '平均温度', value: '24.5°C', alarm: false },
  { label: '温度一', value: '24.2°C', alarm: false },
  { label: '温度二', value: '27.8°C', alarm: true },
  { label: '相对湿度', value: '65%', alarm: false },
  { label: 'CO₂浓度', value: '1250 ppm', alarm: true },
  { label: '氨气浓度', value: '12 ppm', alarm: false },
  { label: '舍外温度', value: '18°C', alarm: false },
  { label: '光照强度', value: '450 Lux', alarm: false },
])

const deviceList = ref<DeviceItem[]>([
  { id: 1, name: '24寸变频风机', type: '风机', uuid: 'DEV-FAN-024', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '2小时30分', mode: 'normal' } },
  { id: 2, name: '吊顶小窗', type: '通风窗', uuid: 'DEV-WIN-001', attribute: '进风控制', online: true, controllable: true, on: true, extra: { opening: 'half', mode: 'auto' } },
  { id: 3, name: '36寸风机', type: '风机', uuid: 'DEV-FAN-036', attribute: '通风控制', online: false, controllable: true, on: false },
  { id: 4, name: '50寸风机', type: '风机', uuid: 'DEV-FAN-050', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '1小时15分', mode: 'max' } },
  { id: 5, name: '水帘系统', type: '降温', uuid: 'DEV-WC-001', attribute: '降温控制', online: true, controllable: true, on: false, extra: { waterLevel: 75 } },
  { id: 6, name: '温度传感器-T01', type: '传感器', uuid: 'DEV-TEMP-001', attribute: '温度监测', online: true, controllable: false, on: true },
  { id: 7, name: '湿度传感器-H01', type: '传感器', uuid: 'DEV-HUMI-001', attribute: '湿度监测', online: true, controllable: false, on: true },
  { id: 8, name: 'CO₂传感器', type: '传感器', uuid: 'DEV-CO2-001', attribute: '气体监测', online: true, controllable: false, on: true },
])

const deviceOnlineCount = computed(() => deviceList.value.filter(d => d.online).length)

const bioKpiItems = computed<MetricItem[]>(() => {
  const d = bioData.value
  if (factoryType.value === 'chicken') {
    return [
      { key: 'stock', value: d.stock, label: '存栏（羽）', cardClass: 'primary' },
      { key: 'todayMortality', value: d.todayMortality, label: '今日死淘', valueClass: 'warn' },
      { key: 'totalMortality', value: d.totalMortality, label: '累计死淘' },
      { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '死淘率' },
    ]
  }
  if (factoryType.value === 'aquatic') {
    return [
      { key: 'stock', value: `${d.avgOxygen} mg/L`, label: '当前溶氧', cardClass: 'primary' },
      { key: 'todayMortality', value: d.todayMortality, label: '今日损耗', valueClass: 'warn' },
      { key: 'totalMortality', value: d.totalMortality, label: '累计损耗' },
      { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '损耗率' },
    ]
  }
  return [
    { key: 'stock', value: d.stock, label: '存栏（头）', cardClass: 'primary' },
    { key: 'todayMortality', value: d.todayMortality, label: '今日死淘', valueClass: 'warn' },
    { key: 'totalMortality', value: d.totalMortality, label: '累计死淘' },
    { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '死淘率' },
  ]
})

const specialSectionTitle = computed(() => {
  if (factoryType.value === 'pig') return '资源消耗'
  if (factoryType.value === 'chicken') return '生产消耗'
  return '养殖消耗'
})

const specialMetrics = computed<MetricItem[]>(() => {
  const d = bioData.value
  if (factoryType.value === 'pig') {
    return [
      { key: 'todayFeed', value: d.todayFeed, label: '今日饲料消耗（kg）', cardClass: 'feed' },
      { key: 'todayWater', value: d.todayWater, label: '今日用水消耗（m³）', cardClass: 'water' },
      { key: 'totalFeed', value: d.totalFeed.toLocaleString(), label: '累计饲料消耗（kg）' },
      { key: 'avgWaterPerHead', value: d.avgWaterPerHead, label: '头均用水（m³）' },
    ]
  }
  if (factoryType.value === 'chicken') {
    return [
      { key: 'todayFeed', value: d.todayFeed, label: '今日饲料消耗（kg）', cardClass: 'feed' },
      { key: 'todayEggs', value: d.todayEggs.toLocaleString(), label: '今日产蛋量（枚）', cardClass: 'egg' },
      { key: 'feedEggRatio', value: d.feedEggRatio, label: '料蛋比' },
      { key: 'todayWater', value: d.todayWater, label: '今日饮水量（m³）', cardClass: 'water' },
    ]
  }
  return [
    { key: 'todayBait', value: d.todayBait, label: '今日投饵量（kg）', cardClass: 'feed' },
    { key: 'todayWaterChange', value: d.todayWaterChange, label: '今日换水量（m³）', cardClass: 'water' },
    { key: 'avgOxygen', value: `${d.avgOxygen} mg/L`, label: '平均溶氧' },
    { key: 'feedCoefficient', value: d.feedCoefficient, label: '饵料系数' },
  ]
})

const bioChartTitle = computed(() => {
  if (factoryType.value === 'pig') return '近7日饲料消耗 & 用水消耗'
  if (factoryType.value === 'chicken') return '近7日饲料消耗 & 产蛋趋势'
  return '近7日投饵量 & 换水量'
})

const extraLabelMap: Record<string, string> = {
  runtime: '运行时长',
  mode: '运行模式',
  opening: '开度',
  waterLevel: '水池水位',
}

const modeMap: Record<string, string> = {
  min: '最小', normal: '常规', max: '最大', emergency: '紧急',
  manual: '手动', auto: '自动', timer: '定时',
  full: '全开', close: '全关', half: '半开', moving: '正在动作',
}

const formatExtraValue = (key: string, val: string | number) => {
  if (key === 'mode' || key === 'opening') return modeMap[String(val)] ?? val
  if (key === 'waterLevel') return `${val}%`
  return val
}

const goBack = () => router.push('/farm')

const handleDeviceToggle = (_device: DeviceItem) => {
  // mock: 设备开关
}

const generateDateData = (days: number) => {
  const dates: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
  }
  return dates
}

const rand = (min: number, max: number, fixed?: number) => {
  const v = min + Math.random() * (max - min)
  return fixed !== undefined ? Number(v.toFixed(fixed)) : Math.round(v)
}

const lightChartBase = {
  tooltip: { trigger: 'axis' as const },
  grid: { left: '3%', right: '4%', bottom: '14%', top: '12%', containLabel: true },
  splitLine: { lineStyle: { color: '#ebeef5' } },
  axisLabel: { color: '#909399', fontSize: 11 },
  axisLine: { lineStyle: { color: '#dcdfe6' } },
  legendText: { color: '#606266', fontSize: 12 },
}

const initBioChart = () => {
  if (!bioChartRef.value) return
  bioChartInstance?.dispose()
  bioChartInstance = echarts.init(bioChartRef.value)
  const dates = generateDateData(7)
  const type = factoryType.value

  let legend: string[]
  let series: EChartsOption['series']

  if (type === 'pig') {
    legend = ['饲料消耗', '用水消耗']
    series = [
      { name: '饲料消耗', type: 'bar', data: dates.map(() => rand(780, 920)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '用水消耗', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(10, 16, 1)), lineStyle: { color: '#67c23a' }, itemStyle: { color: '#67c23a' } },
    ]
  } else if (type === 'chicken') {
    legend = ['饲料消耗', '产蛋量']
    series = [
      { name: '饲料消耗', type: 'bar', data: dates.map(() => rand(700, 900)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '产蛋量', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(7500, 8800)), lineStyle: { color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } },
    ]
  } else {
    legend = ['投饵量', '换水量']
    series = [
      { name: '投饵量', type: 'bar', data: dates.map(() => rand(280, 360)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '换水量', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(35, 55)), lineStyle: { color: '#67c23a' }, itemStyle: { color: '#67c23a' } },
    ]
  }

  const yAxisRightName = type === 'pig' ? 'm³' : type === 'chicken' ? '枚' : 'm³'

  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: legend, bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: {
      type: 'category', data: dates,
      axisLabel: lightChartBase.axisLabel,
      axisLine: lightChartBase.axisLine,
    },
    yAxis: [
      { type: 'value', name: 'kg', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: yAxisRightName, nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series,
  }
  bioChartInstance.setOption(option)
}

const initEnvChart = () => {
  if (!chartRef.value) return
  if (chartRef.value.offsetWidth === 0) {
    setTimeout(initEnvChart, 50)
    return
  }
  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  const dates = generateDateData(30)
  const avgTemp = dates.map((_, i) => (24 + Math.sin(i / 5) * 1 + (Math.random() - 0.5)).toFixed(1))
  const humidity = dates.map(() => rand(58, 72))
  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: ['平均温度', '湿度'], bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: {
      type: 'category', boundaryGap: false, data: dates,
      axisLabel: { ...lightChartBase.axisLabel, interval: 5 },
      axisLine: lightChartBase.axisLine,
    },
    yAxis: [
      { type: 'value', name: '°C', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: '%', max: 100, nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series: [
      { name: '平均温度', type: 'line', smooth: true, data: avgTemp, lineStyle: { color: '#409eff', width: 2 }, areaStyle: { color: 'rgba(64,158,255,0.12)' }, itemStyle: { color: '#409eff' } },
      { name: '湿度', type: 'line', yAxisIndex: 1, smooth: true, data: humidity, lineStyle: { color: '#67c23a', width: 2 }, itemStyle: { color: '#67c23a' } },
    ],
  }
  chartInstance.setOption(option)
}

const refreshBarnData = () => {
  bioData.value = {
    stock: rand(1000, 1300),
    todayMortality: rand(1, 5),
    totalMortality: rand(20, 40),
    mortalityRate: rand(0.1, 0.4, 2),
    todayFeed: rand(780, 920),
    avgFeedPerHead: rand(0.6, 0.85, 2),
    todayWater: rand(10, 16, 1),
    totalFeed: rand(26000, 30000),
    avgWaterPerHead: rand(0.008, 0.012, 3),
    todayEggs: rand(7500, 8800),
    feedEggRatio: rand(1.9, 2.3, 1),
    todayBait: rand(280, 360),
    todayWaterChange: rand(35, 55),
    avgOxygen: rand(6.2, 7.5, 1),
    feedCoefficient: rand(1.2, 1.5, 2),
  }

  deviceList.value = deviceList.value.map(d => ({
    ...d,
    online: Math.random() > 0.15,
    on: d.controllable ? Math.random() > 0.4 : d.on,
  }))

  initBioChart()
  initEnvChart()
}

const handleBarnChange = () => refreshBarnData()

const initSelectedBarn = () => {
  const idFromRoute = Number(route.query.id)
  const nameFromRoute = route.query.name as string
  const list = barnList.value
  if (idFromRoute && list.some(b => b.id === idFromRoute)) {
    selectedBarn.value = idFromRoute
    return
  }
  if (nameFromRoute) {
    const barn = list.find(b => b.name === nameFromRoute)
    if (barn) {
      selectedBarn.value = barn.id
      return
    }
  }
  selectedBarn.value = list[0]?.id ?? 1
}

watch(factoryType, () => {
  initSelectedBarn()
  refreshBarnData()
})

const handleResize = () => {
  chartInstance?.resize()
  bioChartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initSelectedBarn()
      initBioChart()
      initEnvChart()
    }, 100)
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  bioChartInstance?.dispose()
})
</script>

<style scoped>
.barn-detail {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  padding-bottom: 32px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-sub {
  font-size: 13px;
  color: #909399;
}

/* 垂直堆叠 */
.pillars-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-meta {
  font-size: 12px;
  color: #909399;
}

/* 生物 KPI */
.bio-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
}

.kpi-card.primary {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.kpi-card.highlight {
  background: #fdf6ec;
  border-color: #faecd8;
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;
}

.kpi-card.primary .kpi-value {
  color: #409eff;
}

.kpi-card.highlight .kpi-value {
  color: #e6a23c;
}

.kpi-value.warn {
  color: #f56c6c;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* 舍内专览指标 */
.special-section {
  margin-bottom: 16px;
  padding: 14px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.special-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.special-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.special-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 10px;
  text-align: center;
}

.special-card.feed {
  border-color: #d9ecff;
  background: #ecf5ff;
}

.special-card.water {
  border-color: #e1f3d8;
  background: #f0f9eb;
}

.special-card.egg {
  border-color: #faecd8;
  background: #fdf6ec;
}

.special-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.special-card.feed .special-value {
  color: #409eff;
}

.special-card.water .special-value {
  color: #67c23a;
}

.special-card.egg .special-value {
  color: #e6a23c;
}

.special-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* 环境指标 */
.env-indicators {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.env-item {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  position: relative;
}

.env-item.alarm {
  border-color: #fde2e2;
  background: #fef0f0;
}

.env-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.env-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.env-value.alarm {
  color: #f56c6c;
}

.env-alarm-tag {
  position: absolute;
  top: 6px;
  right: 6px;
}

/* 图表 */
.sub-chart-wrap {
  margin-top: 4px;
}

.sub-chart-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.sub-chart {
  width: 100%;
  height: 280px;
}

/* 设备网格 */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.device-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  transition: box-shadow 0.2s;
}

.device-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.device-card.offline {
  background: #fafafa;
  border-color: #e4e7ed;
  opacity: 0.85;
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.device-type {
  font-size: 12px;
  color: #909399;
}

.device-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.device-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-run-status {
  font-size: 12px;
  color: #909399;
}

.device-run-status.on {
  color: #67c23a;
}

.device-extra {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extra-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
}

.extra-row span:last-child {
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .bio-kpi-grid,
  .special-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .env-indicators {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .bio-kpi-grid,
  .special-grid {
    grid-template-columns: 1fr 1fr;
  }

  .env-indicators {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
