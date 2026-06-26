import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useCompanyTree } from '@/composables/useCompanyTree'
import { useChartResize } from '@/composables/useChartResize'
import { usePermission } from '@/composables/usePermission'
import { getBarnCameras } from '@/utils/cameraMockData'
import {
  getBatchInfo,
  getDeviceMaintenance,
  getBreedingProductionExtra,
  getFeedingIntake,
  getIntakeAlarms,
  getBioPrevention,
  getBioPreventionTempLabel,
  getProductionOutput,
  getFeedProductionDetail,
  stockAlertTagType,
  getDeviceFaultAlarms,
  getEnergyMonitoring,
  pollutionStatusTagType,
  energyUsageRate,
  getProductionSafety,
  emergencyResourceStatusTag,
  emergencyHandleStatusTag,
  type SafetyOverlimitCategory,
} from '@/utils/farmOperationsMock'

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
  faultCount: number
  nextMaintainDate: string
  maintainStatus: '正常' | '即将到期' | '已超期'
}

export function useBarnDetail() {
const router = useRouter()
const route = useRoute()
const { can, canAny, PERMISSION } = usePermission()
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
const breedingProdTab = ref<'breeding' | 'production'>('breeding')

let envChartEl: HTMLElement | null = null
let bioChartEl: HTMLElement | null = null
let batchChartEl: HTMLElement | null = null
let chartInstance: echarts.ECharts | null = null
let bioChartInstance: echarts.ECharts | null = null
let batchChartInstance: echarts.ECharts | null = null

const barnName = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.name ?? '栏舍'
})

const barnStatus = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.status ?? '正常'
})

const barnCameraList = computed(() => getBarnCameras(selectedBarn.value))

const batchInfo = computed(() => getBatchInfo(factoryType.value, barnName.value))
const breedingExtra = computed(() => getBreedingProductionExtra(factoryType.value))
const feedingIntake = computed(() => getFeedingIntake(factoryType.value))
const intakeAlarms = computed(() => getIntakeAlarms(factoryType.value, barnName.value))
const bioPrevention = computed(() => getBioPrevention(factoryType.value, barnName.value))
const bioTempLabel = computed(() => getBioPreventionTempLabel(factoryType.value))
const productionOutput = computed(() => getProductionOutput(factoryType.value))
const feedProduction = computed(() => getFeedProductionDetail(barnName.value))

const qcTagType = (result: string) => {
  if (result === '合格') return 'success'
  if (result === '不合格') return 'danger'
  return 'info'
}

const epidemicStatusTag = (status: string) => {
  if (status === '已关闭') return 'success'
  if (status === '处理中') return 'warning'
  return 'danger'
}

const tempStatusTag = (status: string) => {
  if (status === '正常') return 'success'
  if (status === '偏高') return 'danger'
  return 'warning'
}

const envComplianceRate = computed(() => (barnStatus.value === '告警' ? 82 : 96))
const envRates = computed(() => ({
  temp: barnStatus.value === '告警' ? 78 : 94,
  humidity: barnStatus.value === '告警' ? 85 : 92,
  gas: barnStatus.value === '告警' ? 72 : 88,
}))
const envDeviationDuration = computed(() => barnStatus.value === '告警' ? '2小时15分' : '18分')

const maintainTagType = (s: DeviceItem['maintainStatus']) => {
  if (s === '已超期') return 'danger'
  if (s === '即将到期') return 'warning'
  return 'success'
}

const withMaintenance = (devices: Omit<DeviceItem, 'faultCount' | 'nextMaintainDate' | 'maintainStatus'>[]): DeviceItem[] =>
  devices.map(d => {
    const m = getDeviceMaintenance(d.online, d.id)
    return { ...d, ...m }
  })

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

const deviceList = ref<DeviceItem[]>(withMaintenance([
  { id: 1, name: '24寸变频风机', type: '风机', uuid: 'DEV-FAN-024', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '2小时30分', mode: 'normal' } },
  { id: 2, name: '吊顶小窗', type: '通风窗', uuid: 'DEV-WIN-001', attribute: '进风控制', online: true, controllable: true, on: true, extra: { opening: 'half', mode: 'auto' } },
  { id: 3, name: '36寸风机', type: '风机', uuid: 'DEV-FAN-036', attribute: '通风控制', online: false, controllable: true, on: false },
  { id: 4, name: '50寸风机', type: '风机', uuid: 'DEV-FAN-050', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '1小时15分', mode: 'max' } },
  { id: 5, name: '水帘系统', type: '降温', uuid: 'DEV-WC-001', attribute: '降温控制', online: true, controllable: true, on: false, extra: { waterLevel: 75 } },
  { id: 6, name: '温度传感器-T01', type: '传感器', uuid: 'DEV-TEMP-001', attribute: '温度监测', online: true, controllable: false, on: true },
  { id: 7, name: '湿度传感器-H01', type: '传感器', uuid: 'DEV-HUMI-001', attribute: '湿度监测', online: true, controllable: false, on: true },
  { id: 8, name: 'CO₂传感器', type: '传感器', uuid: 'DEV-CO2-001', attribute: '气体监测', online: true, controllable: false, on: true },
]))

const deviceOnlineCount = computed(() => deviceList.value.filter(d => d.online).length)

const deviceOnlineRate = computed(() => {
  const total = deviceList.value.length
  if (!total) return 100
  return Math.round((deviceOnlineCount.value / total) * 1000) / 10
})

const offlineDevices = computed(() =>
  deviceList.value
    .filter(d => !d.online)
    .map(d => ({
      name: d.name,
      type: d.type,
      uuid: d.uuid,
      attribute: d.attribute,
      offlineSince: d.id === 3 ? '2小时15分' : '45分',
    }))
)

const deviceFaultAlarms = computed(() => getDeviceFaultAlarms(factoryType.value, barnName.value))
const energyMonitoring = computed(() => getEnergyMonitoring(factoryType.value, barnName.value))
const productionSafety = computed(() => getProductionSafety(factoryType.value, barnName.value))

const overlimitCategories: { key: SafetyOverlimitCategory; label: string }[] = [
  { key: '环控', label: '环控超限' },
  { key: '设备', label: '设备超限' },
  { key: '其他', label: '其他安全指标' },
]

const overlimitAlarmsByCategory = (category: SafetyOverlimitCategory) =>
  productionSafety.value.overlimitAlarms.filter(a => a.category === category)

const fireEmergencyResources = computed(() =>
  productionSafety.value.emergencyResources.filter(r => r.category === '消防设备')
)

const supplyEmergencyResources = computed(() =>
  productionSafety.value.emergencyResources.filter(r => r.category === '应急物资')
)

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

const sensorReadings: Record<number, Record<string, string>> = {
  6: { 当前温度: '24.5°C' },
  7: { 当前湿度: '65%' },
  8: { 'CO₂浓度': '1250 ppm' },
}

const deviceRunningParams = computed(() => {
  const rows: {
    deviceName: string
    deviceType: string
    paramName: string
    paramValue: string
    runStatus: string
  }[] = []

  for (const d of deviceList.value) {
    if (!d.online) continue
    const runStatus = d.controllable ? (d.on ? '开' : '关') : '监测中'

    if (d.extra && d.on) {
      for (const [key, val] of Object.entries(d.extra)) {
        rows.push({
          deviceName: d.name,
          deviceType: d.type,
          paramName: extraLabelMap[key] || key,
          paramValue: String(formatExtraValue(key, val)),
          runStatus,
        })
      }
    }

    const readings = sensorReadings[d.id]
    if (readings) {
      for (const [paramName, paramValue] of Object.entries(readings)) {
        rows.push({ deviceName: d.name, deviceType: d.type, paramName, paramValue, runStatus: '监测中' })
      }
    }
  }
  return rows
})

const goBack = () => router.push('/farm')

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

const initBioChart = (el?: HTMLElement) => {
  if (el) bioChartEl = el
  if (!bioChartEl) return
  bioChartInstance?.dispose()
  bioChartInstance = echarts.init(bioChartEl)
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

const initBatchChart = (el?: HTMLElement) => {
  if (el) batchChartEl = el
  if (!batchChartEl) return
  batchChartInstance?.dispose()
  batchChartInstance = echarts.init(batchChartEl)
  const days = batchInfo.value.ageDays
  const count = Math.min(days, 30)
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const stockBase = batchInfo.value.currentStock
  const stockData = dates.map((_, i) => stockBase + rand(-30, 10) + Math.floor(i * 0.5))
  const deadData = dates.map(() => rand(0, 4))
  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: ['存栏', '死淘'], bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: { type: 'category', data: dates, axisLabel: { ...lightChartBase.axisLabel, interval: Math.floor(count / 6) }, axisLine: lightChartBase.axisLine },
    yAxis: [
      { type: 'value', name: '头', axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: '头', axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series: [
      { name: '存栏', type: 'line', smooth: true, data: stockData, lineStyle: { color: '#409eff', width: 2 }, areaStyle: { color: 'rgba(64,158,255,0.1)' }, itemStyle: { color: '#409eff' } },
      { name: '死淘', type: 'bar', yAxisIndex: 1, data: deadData, itemStyle: { color: '#f56c6c' }, barMaxWidth: 16 },
    ],
  }
  batchChartInstance.setOption(option)
}

const initEnvChart = (el?: HTMLElement) => {
  if (el) envChartEl = el
  if (!envChartEl) return
  if (envChartEl.offsetWidth === 0) {
    setTimeout(() => initEnvChart(), 50)
    return
  }
  chartInstance?.dispose()
  chartInstance = echarts.init(envChartEl)
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
    ...getDeviceMaintenance(Math.random() > 0.15, d.id),
  }))

  initBioChart()
  initBatchChart()
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

const { resizeCharts, observeContainers } = useChartResize(
  () => [chartInstance, bioChartInstance, batchChartInstance],
  () => [envChartEl, bioChartEl, batchChartEl].filter(Boolean) as HTMLElement[]
)

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initSelectedBarn()
      observeContainers()
      resizeCharts()
    }, 100)
  })
})

onUnmounted(() => {
  chartInstance?.dispose()
  bioChartInstance?.dispose()
  batchChartInstance?.dispose()
})

  return {
    can,
    canAny,
    PERMISSION,
    factoryType,
    factoryTypeLabel,
    barnList,
    selectedBarn,
    breedingProdTab,
    barnName,
    barnStatus,
    barnCameraList,
    batchInfo,
    breedingExtra,
    feedingIntake,
    intakeAlarms,
    bioPrevention,
    bioTempLabel,
    productionOutput,
    feedProduction,
    qcTagType,
    epidemicStatusTag,
    tempStatusTag,
    envComplianceRate,
    envRates,
    envDeviationDuration,
    maintainTagType,
    bioData,
    envIndicators,
    deviceList,
    deviceOnlineCount,
    deviceOnlineRate,
    offlineDevices,
    deviceFaultAlarms,
    energyMonitoring,
    productionSafety,
    overlimitCategories,
    overlimitAlarmsByCategory,
    fireEmergencyResources,
    supplyEmergencyResources,
    bioKpiItems,
    specialSectionTitle,
    specialMetrics,
    bioChartTitle,
    extraLabelMap,
    formatExtraValue,
    deviceRunningParams,
    goBack,
    handleBarnChange,
    initBioChart,
    initBatchChart,
    initEnvChart,
    observeChartContainers: observeContainers,
    resizeCharts,
    stockAlertTagType,
    pollutionStatusTagType,
    energyUsageRate,
    emergencyResourceStatusTag,
    emergencyHandleStatusTag,
  }
}
