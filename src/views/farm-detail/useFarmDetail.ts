import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useCompanyTree } from '@/composables/useCompanyTree'
import { useChartResize } from '@/composables/useChartResize'
import { usePermission } from '@/composables/usePermission'
import { factoryCameras } from '@/utils/cameraMockData'
import {
  getTodayProduction,
  getEnvCompliance,
  getOrderFulfillment,
  getBusinessBenefit,
  type AlarmHandleStatus,
} from '@/utils/farmOperationsMock'

interface BarnItem {
  id: number
  name: string
  status: '正常' | '告警'
  stock: number
  temp: number
  humidity: number
  ventilation: number
  oxygen: number
  ph: number
  alarmCount: number
  deviceOnline: number
  deviceTotal: number
  dailyDead: number
  totalDead: number
  sickCount: number
  deadFromDisease: number
  relapseCount: number
  medicineUsed: number
  pigFeedOutput: number
  chickenFeedOutput: number
  aquaticFeedOutput: number
  pigFeedShipment: number
  chickenFeedShipment: number
  aquaticFeedShipment: number
}

interface FactoryAlarm {
  id: number
  barnId: number
  barnName: string
  type: string
  description: string
  level: '严重' | '一般' | '提示'
  time: string
  processed: boolean
  assignee: string
  handleStatus: AlarmHandleStatus
  duration: string
  respondedAt?: string
}

interface FactoryOrder {
  id: string
  orderNo: string
  orderTime: string
  deliveryTime: string
  overdueTime: string | null
  overdueDays: number
  contactName: string
  contactPhone: string
  status: '正常' | '即将到期' | '已逾期'
}

type KpiFilter = 'barnTotal' | 'abnormalBarn' | 'total' | 'severe' | 'offline' | 'bio' | 'dailyDead' | 'totalDead' | 'mortalityRate' | 'morbidityRate' | 'caseFatalityRate' | 'relapseRate' | 'medicineUsed' | 'pigFeedOutput' | 'chickenFeedOutput' | 'aquaticFeedOutput' | 'pigFeedShipment' | 'chickenFeedShipment' | 'aquaticFeedShipment' | 'totalFeedOutput' | 'totalFeedShipment'

export function useFarmDetail() {
const router = useRouter()
const route = useRoute()
const { can, PERMISSION } = usePermission()

const {
  selectedFactoryType,
  currentFactory,
  factoryTypes,
} = useCompanyTree()

const chickenType = ref('broiler')
const aquaticType = ref('fish')
const selectedBarnFilter = ref<number | ''>('')
const activeKpiFilter = ref<KpiFilter>('total')
let chartEl: HTMLElement | null = null
let chartInstance: echarts.ECharts | null = null

const hasFactory = computed(() => !!currentFactory.value)

const factoryTypeLabel = computed(() =>
  factoryTypes.find(t => t.value === selectedFactoryType.value)?.label ?? '工厂'
)

const barnSectionTitle = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return '养殖池列表'
  if (selectedFactoryType.value === 'chicken') return '鸡舍列表'
  if (selectedFactoryType.value === 'feed') return '生产车间列表'
  return '栏舍列表'
})

const bioLabel = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return '溶氧'
  if (selectedFactoryType.value === 'feed') return '产量'
  return '存栏'
})

const envLabel4 = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return 'PH值'
  if (selectedFactoryType.value === 'feed') return '出货量'
  return '通风'
})

const displayBarnName = (name: string) => {
  if (selectedFactoryType.value === 'aquatic') return name.replace('保育舍', '养殖池').replace('分娩舍', '车间')
  if (selectedFactoryType.value === 'feed') return name.replace('保育舍', '车间').replace('分娩舍', '仓库')
  return name
}
// 按场类型的 mock 舍数据
const barnDataByType: Record<string, BarnItem[]> = {
  pig: [
    { id: 1, name: '保育舍1', status: '正常', stock: 1200, temp: 24, humidity: 65, ventilation: 80, oxygen: 85, ph: 7.2, alarmCount: 0, deviceOnline: 12, deviceTotal: 12, dailyDead: 2, totalDead: 35, sickCount: 15, deadFromDisease: 8, relapseCount: 3, medicineUsed: 120, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 2, name: '保育舍2', status: '正常', stock: 1150, temp: 25, humidity: 62, ventilation: 75, oxygen: 82, ph: 7.1, alarmCount: 0, deviceOnline: 11, deviceTotal: 12, dailyDead: 1, totalDead: 28, sickCount: 12, deadFromDisease: 5, relapseCount: 2, medicineUsed: 98, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 3, name: '保育舍3', status: '正常', stock: 1100, temp: 24, humidity: 68, ventilation: 82, oxygen: 88, ph: 7.3, alarmCount: 0, deviceOnline: 12, deviceTotal: 12, dailyDead: 0, totalDead: 42, sickCount: 8, deadFromDisease: 12, relapseCount: 1, medicineUsed: 75, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 4, name: '保育舍4', status: '告警', stock: 1080, temp: 27, humidity: 78, ventilation: 55, oxygen: 72, ph: 6.8, alarmCount: 2, deviceOnline: 10, deviceTotal: 12, dailyDead: 5, totalDead: 58, sickCount: 35, deadFromDisease: 18, relapseCount: 8, medicineUsed: 256, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 5, name: '分娩舍1', status: '正常', stock: 580, temp: 26, humidity: 70, ventilation: 85, oxygen: 90, ph: 7.4, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 1, totalDead: 15, sickCount: 5, deadFromDisease: 3, relapseCount: 1, medicineUsed: 45, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 6, name: '分娩舍2', status: '告警', stock: 620, temp: 28, humidity: 75, ventilation: 60, oxygen: 68, ph: 6.5, alarmCount: 1, deviceOnline: 7, deviceTotal: 8, dailyDead: 3, totalDead: 22, sickCount: 18, deadFromDisease: 7, relapseCount: 4, medicineUsed: 135, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 7, name: '分娩舍3', status: '正常', stock: 550, temp: 25, humidity: 68, ventilation: 88, oxygen: 86, ph: 7.2, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 18, sickCount: 4, deadFromDisease: 4, relapseCount: 0, medicineUsed: 38, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 8, name: '分娩舍4', status: '正常', stock: 560, temp: 26, humidity: 72, ventilation: 83, oxygen: 83, ph: 7.1, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 2, totalDead: 20, sickCount: 6, deadFromDisease: 5, relapseCount: 2, medicineUsed: 52, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  chicken: [
    { id: 101, name: '蛋鸡舍1', status: '正常', stock: 8000, temp: 22, humidity: 60, ventilation: 90, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 10, deviceTotal: 10, dailyDead: 15, totalDead: 380, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 102, name: '蛋鸡舍2', status: '告警', stock: 7800, temp: 26, humidity: 72, ventilation: 65, oxygen: 0, ph: 0, alarmCount: 2, deviceOnline: 8, deviceTotal: 10, dailyDead: 28, totalDead: 450, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 103, name: '肉鸡舍1', status: '正常', stock: 12000, temp: 23, humidity: 58, ventilation: 88, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 14, deviceTotal: 14, dailyDead: 35, totalDead: 680, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 104, name: '肉鸡舍2', status: '告警', stock: 11500, temp: 27, humidity: 75, ventilation: 55, oxygen: 0, ph: 0, alarmCount: 1, deviceOnline: 12, deviceTotal: 14, dailyDead: 42, totalDead: 720, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 105, name: '育雏舍1', status: '正常', stock: 6000, temp: 28, humidity: 65, ventilation: 80, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 20, totalDead: 320, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  aquatic: [
    { id: 201, name: '养殖池1', status: '正常', stock: 0, temp: 24, humidity: 0, ventilation: 0, oxygen: 6.8, ph: 7.2, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 202, name: '养殖池2', status: '正常', stock: 0, temp: 25, humidity: 0, ventilation: 0, oxygen: 7.1, ph: 7.0, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 203, name: '养殖池3', status: '告警', stock: 0, temp: 26, humidity: 0, ventilation: 0, oxygen: 4.2, ph: 8.5, alarmCount: 2, deviceOnline: 5, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 204, name: '养殖池4', status: '正常', stock: 0, temp: 24, humidity: 0, ventilation: 0, oxygen: 6.5, ph: 7.1, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  feed: [
    { id: 301, name: '猪饲料车间', status: '正常', stock: 0, temp: 25, humidity: 45, ventilation: 70, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 2500, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 2300, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 302, name: '鸡饲料车间', status: '正常', stock: 0, temp: 24, humidity: 42, ventilation: 75, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 3200, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 3000, aquaticFeedShipment: 0 },
    { id: 303, name: '水产饲料车间', status: '告警', stock: 0, temp: 26, humidity: 50, ventilation: 60, oxygen: 0, ph: 0, alarmCount: 1, deviceOnline: 6, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 1800, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 1650 },
    { id: 304, name: '成品仓库', status: '正常', stock: 0, temp: 23, humidity: 40, ventilation: 65, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 4, deviceTotal: 4, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
}

const alarmDataByType: Record<string, FactoryAlarm[]> = {
  pig: [
    { id: 1, barnId: 4, barnName: '保育舍4', type: '温度异常', description: '温度超过阈值，当前27°C', level: '严重', time: '10:32', processed: false, assignee: '张工', handleStatus: '待处理', duration: '2小时15分' },
    { id: 2, barnId: 4, barnName: '保育舍4', type: '通风不足', description: '通风量低于标准值', level: '一般', time: '10:15', processed: false, assignee: '李主管', handleStatus: '处理中', duration: '45分', respondedAt: '10:05' },
    { id: 3, barnId: 6, barnName: '分娩舍2', type: '湿度异常', description: '湿度过高，当前75%', level: '严重', time: '09:48', processed: false, assignee: '王巡检', handleStatus: '待处理', duration: '1小时30分' },
  ],
  chicken: [
    { id: 11, barnId: 102, barnName: '蛋鸡舍2', type: '氨气超标', description: '氨气浓度超标', level: '严重', time: '10:20', processed: false, assignee: '张工', handleStatus: '待处理', duration: '2小时05分' },
    { id: 12, barnId: 102, barnName: '蛋鸡舍2', type: '温度异常', description: '温度26°C超限', level: '一般', time: '09:55', processed: false, assignee: '李主管', handleStatus: '处理中', duration: '30分', respondedAt: '09:50' },
    { id: 13, barnId: 104, barnName: '肉鸡舍2', type: '通风故障', description: '风机运行异常', level: '严重', time: '09:30', processed: false, assignee: '赵技术员', handleStatus: '待处理', duration: '3小时10分' },
  ],
  aquatic: [
    { id: 21, barnId: 203, barnName: '养殖池3', type: '溶氧偏低', description: '溶氧量4.2mg/L', level: '严重', time: '10:10', processed: false, assignee: '周工', handleStatus: '待处理', duration: '1小时50分' },
    { id: 22, barnId: 203, barnName: '养殖池3', type: 'pH异常', description: 'pH值8.5超出范围', level: '一般', time: '09:40', processed: false, assignee: '吴主管', handleStatus: '处理中', duration: '20分', respondedAt: '09:35' },
  ],
  feed: [
    { id: 31, barnId: 301, barnName: '制粒车间1', type: '温度异常', description: '制粒机出口温度超限', level: '严重', time: '10:25', processed: false, assignee: '陈工', handleStatus: '待处理', duration: '1小时40分' },
    { id: 32, barnId: 302, barnName: '混合车间2', type: '粉尘超标', description: '车间粉尘浓度偏高', level: '一般', time: '09:50', processed: false, assignee: '刘主管', handleStatus: '处理中', duration: '35分', respondedAt: '09:42' },
    { id: 33, barnId: 303, barnName: '成品仓', type: '湿度异常', description: '成品仓湿度超过标准', level: '提示', time: '08:30', processed: true, assignee: '系统自动', handleStatus: '已关闭', duration: '—' },
  ],
}

const orderDataByType: Record<string, FactoryOrder[]> = {
  pig: [
    { id: '1', orderNo: 'PO-202505-001', orderTime: '2025-05-08 09:30', deliveryTime: '2025-05-20 18:00', overdueTime: '2025-05-20 18:00', overdueDays: 1, contactName: '张经理', contactPhone: '138-0013-8001', status: '已逾期' },
    { id: '2', orderNo: 'PO-202505-002', orderTime: '2025-05-10 14:20', deliveryTime: '2025-05-22 12:00', overdueTime: null, overdueDays: 0, contactName: '李主管', contactPhone: '139-0013-9002', status: '即将到期' },
    { id: '3', orderNo: 'PO-202505-003', orderTime: '2025-05-12 11:00', deliveryTime: '2025-05-28 17:00', overdueTime: null, overdueDays: 0, contactName: '王采购', contactPhone: '137-0013-7003', status: '正常' },
    { id: '4', orderNo: 'PO-202504-018', orderTime: '2025-04-25 16:45', deliveryTime: '2025-05-15 10:00', overdueTime: '2025-05-15 10:00', overdueDays: 6, contactName: '赵主任', contactPhone: '136-0013-6004', status: '已逾期' },
  ],
  chicken: [
    { id: '11', orderNo: 'PO-202505-011', orderTime: '2025-05-09 08:15', deliveryTime: '2025-05-21 16:00', overdueTime: null, overdueDays: 0, contactName: '陈场长', contactPhone: '135-0013-5005', status: '正常' },
    { id: '12', orderNo: 'PO-202505-012', orderTime: '2025-05-11 10:30', deliveryTime: '2025-05-23 09:00', overdueTime: null, overdueDays: 0, contactName: '刘供应', contactPhone: '134-0013-4006', status: '即将到期' },
    { id: '13', orderNo: 'PO-202504-022', orderTime: '2025-04-20 13:00', deliveryTime: '2025-05-18 14:00', overdueTime: '2025-05-18 14:00', overdueDays: 3, contactName: '孙经理', contactPhone: '133-0013-3007', status: '已逾期' },
  ],
  aquatic: [
    { id: '21', orderNo: 'PO-202505-021', orderTime: '2025-05-07 15:20', deliveryTime: '2025-05-25 11:00', overdueTime: null, overdueDays: 0, contactName: '周技术员', contactPhone: '132-0013-2008', status: '正常' },
    { id: '22', orderNo: 'PO-202505-022', orderTime: '2025-05-13 09:40', deliveryTime: '2025-05-21 08:00', overdueTime: null, overdueDays: 0, contactName: '吴采购', contactPhone: '131-0013-1009', status: '即将到期' },
    { id: '23', orderNo: 'PO-202504-015', orderTime: '2025-04-18 11:30', deliveryTime: '2025-05-10 17:00', overdueTime: '2025-05-10 17:00', overdueDays: 11, contactName: '郑主任', contactPhone: '130-0013-0010', status: '已逾期' },
  ],
  feed: [
    { id: '31', orderNo: 'SO-202505-031', orderTime: '2025-05-06 10:00', deliveryTime: '2025-05-21 14:00', overdueTime: null, overdueDays: 0, contactName: '饲料销售部', contactPhone: '138-0013-8031', status: '即将到期' },
    { id: '32', orderNo: 'SO-202505-032', orderTime: '2025-05-10 16:30', deliveryTime: '2025-05-28 09:00', overdueTime: null, overdueDays: 0, contactName: '华东经销', contactPhone: '139-0013-9032', status: '正常' },
    { id: '33', orderNo: 'SO-202504-028', orderTime: '2025-04-22 11:15', deliveryTime: '2025-05-15 17:00', overdueTime: '2025-05-15 17:00', overdueDays: 6, contactName: '华南客户', contactPhone: '137-0013-7033', status: '已逾期' },
  ],
}

const barnList = computed(() => barnDataByType[selectedFactoryType.value] ?? [])
const factoryAlarms = computed(() => alarmDataByType[selectedFactoryType.value] ?? [])
const factoryOrders = computed(() => orderDataByType[selectedFactoryType.value] ?? [])
const overdueOrderCount = computed(() => factoryOrders.value.filter(o => o.status === '已逾期').length)
const factoryCameraList = factoryCameras

const todayDate = new Date().toLocaleDateString('zh-CN')
const todayProduction = computed(() => getTodayProduction(selectedFactoryType.value))
const envCompliance = computed(() => {
  const abnormal = barnList.value.filter(b => b.status === '告警')
  return getEnvCompliance(abnormal.length, abnormal.map(b => displayBarnName(b.name)))
})
const unprocessedAlarmCount = computed(() =>
  factoryAlarms.value.filter(a => a.handleStatus !== '已关闭').length
)
const orderFulfillment = computed(() => getOrderFulfillment(factoryOrders.value))
const businessBenefit = computed(() => getBusinessBenefit(selectedFactoryType.value))

const businessOverviewItems = computed(() => {
  const { stock, output, outputValue } = businessBenefit.value.overview
  return [
    { key: 'stock', label: stock.label, value: stock.value, unit: stock.unit, change: stock.change, changeUp: stock.changeUp },
    { key: 'output', label: output.label, value: output.value, unit: output.unit, change: output.change, changeUp: output.changeUp },
    { key: 'outputValue', label: outputValue.label, value: outputValue.value, unit: outputValue.unit, change: outputValue.change, changeUp: outputValue.changeUp },
  ]
})

const todayBriefingItems = computed(() => {
  const t = todayProduction.value
  const kpi = factoryKpi.value
  const type = selectedFactoryType.value
  const deadChangeStr = t.dailyDeadChange >= 0 ? `较昨日 +${t.dailyDeadChange}` : `较昨日 ${t.dailyDeadChange}`
  const feedChangeStr = t.feedChange >= 0 ? `较昨日 +${t.feedChange}%` : `较昨日 ${t.feedChange}%`

  if (type === 'feed') {
    return [
      { key: 'output', label: '今日产量(吨)', value: t.actualOutput, change: `计划 ${t.planOutput}`, cardClass: 'primary', valueClass: '', changeClass: '' },
      { key: 'ship', label: '今日出货(吨)', value: kpi.totalFeedShipment, change: null, cardClass: '', valueClass: '', changeClass: '' },
      { key: 'alarm', label: '未处理报警', value: unprocessedAlarmCount.value, change: null, cardClass: 'warn', valueClass: 'alarm', changeClass: '' },
      { key: 'abnormal', label: '异常车间', value: kpi.abnormalBarn, change: null, cardClass: '', valueClass: 'warn', changeClass: '' },
      { key: 'water', label: '今日用水(m³)', value: t.waterConsumption, change: `较昨日 ${t.waterChange}%`, cardClass: '', valueClass: '', changeClass: '' },
      { key: 'offline', label: '离线设备', value: kpi.offline, change: null, cardClass: '', valueClass: 'offline', changeClass: '' },
    ]
  }

  return [
    { key: 'dead', label: '今日死淘', value: kpi.dailyDead, change: deadChangeStr, cardClass: kpi.dailyDead > 20 ? 'warn' : '', valueClass: 'dead', changeClass: t.dailyDeadChange > 0 ? 'up' : 'down' },
    { key: 'feed', label: '今日料耗(kg)', value: t.feedConsumption, change: feedChangeStr, cardClass: 'primary', valueClass: '', changeClass: t.feedChange > 5 ? 'up' : 'down' },
    { key: 'water', label: '今日用水(m³)', value: t.waterConsumption, change: `较昨日 ${t.waterChange}%`, cardClass: '', valueClass: '', changeClass: '' },
    { key: 'abnormal', label: '异常栏舍', value: kpi.abnormalBarn, change: envCompliance.value.worstBarn !== '—' ? `最差 ${envCompliance.value.worstDuration}` : null, cardClass: '', valueClass: 'warn', changeClass: '' },
    { key: 'alarm', label: '未处理报警', value: unprocessedAlarmCount.value, change: null, cardClass: 'warn', valueClass: 'alarm', changeClass: '' },
    { key: 'batch', label: '在养批次 / 日龄', value: `${t.batchCount}批 · ${t.avgAge}天`, change: type === 'chicken' ? `产蛋 ${t.actualOutput.toLocaleString()}枚` : null, cardClass: '', valueClass: '', changeClass: '' },
  ]
})

const alarmHandleTagType = (status: AlarmHandleStatus) => {
  if (status === '已关闭') return 'success'
  if (status === '处理中') return 'warning'
  return 'danger'
}

const factoryKpi = computed(() => {
  const barns = barnList.value
  const alarms = factoryAlarms.value
  const offlineDevices = barns.reduce((sum, b) => sum + (b.deviceTotal - b.deviceOnline), 0)
  const bioTotal = selectedFactoryType.value === 'aquatic'
    ? Math.round(barns.reduce((s, b) => s + b.oxygen, 0) / (barns.length || 1) * 10) / 10
    : selectedFactoryType.value === 'feed'
    ? barns.reduce((s, b) => s + b.pigFeedOutput + b.chickenFeedOutput + b.aquaticFeedOutput, 0)
    : barns.reduce((s, b) => s + b.stock, 0)
  const dailyDead = barns.reduce((sum, b) => sum + b.dailyDead, 0)
  const totalDead = barns.reduce((sum, b) => sum + b.totalDead, 0)
  const mortalityRate = bioTotal > 0 ? `${((totalDead / (bioTotal + totalDead)) * 100).toFixed(2)}%` : '0.00%'

  const totalSick = barns.reduce((sum, b) => sum + b.sickCount, 0)
  const totalDeadFromDisease = barns.reduce((sum, b) => sum + b.deadFromDisease, 0)
  const totalRelapse = barns.reduce((sum, b) => sum + b.relapseCount, 0)
  const totalMedicineUsed = barns.reduce((sum, b) => sum + b.medicineUsed, 0)
  
  const morbidityRate = bioTotal > 0 ? `${((totalSick / bioTotal) * 100).toFixed(2)}%` : '0.00%'
  const caseFatalityRate = totalSick > 0 ? `${((totalDeadFromDisease / totalSick) * 100).toFixed(2)}%` : '0.00%'
  const relapseRate = totalSick > 0 ? `${((totalRelapse / totalSick) * 100).toFixed(2)}%` : '0.00%'

  const pigFeedOutput = barns.reduce((sum, b) => sum + b.pigFeedOutput, 0)
  const chickenFeedOutput = barns.reduce((sum, b) => sum + b.chickenFeedOutput, 0)
  const aquaticFeedOutput = barns.reduce((sum, b) => sum + b.aquaticFeedOutput, 0)
  const pigFeedShipment = barns.reduce((sum, b) => sum + b.pigFeedShipment, 0)
  const chickenFeedShipment = barns.reduce((sum, b) => sum + b.chickenFeedShipment, 0)
  const aquaticFeedShipment = barns.reduce((sum, b) => sum + b.aquaticFeedShipment, 0)
  const totalFeedOutput = pigFeedOutput + chickenFeedOutput + aquaticFeedOutput
  const totalFeedShipment = pigFeedShipment + chickenFeedShipment + aquaticFeedShipment

  return {
    barnTotal: barns.length,
    abnormalBarn: barns.filter(b => b.status === '告警').length,
    total: alarms.length,
    severe: alarms.filter(a => a.level === '严重').length,
    offline: offlineDevices,
    bio: bioTotal,
    dailyDead,
    totalDead,
    mortalityRate,
    morbidityRate,
    caseFatalityRate,
    relapseRate,
    medicineUsed: totalMedicineUsed,
    pigFeedOutput,
    chickenFeedOutput,
    aquaticFeedOutput,
    pigFeedShipment,
    chickenFeedShipment,
    aquaticFeedShipment,
    totalFeedOutput,
    totalFeedShipment,
  }
})

const factoryStatusTag = computed(() => {
  const abnormal = factoryKpi.value.abnormalBarn
  if (abnormal > 0) return { type: 'danger' as const, text: `${abnormal} 个舍异常` }
  return { type: 'success' as const, text: '运行正常' }
})

const kpiItems = computed(() => {
  if (selectedFactoryType.value === 'feed') {
    return [
      { key: 'barnTotal' as KpiFilter, label: '车间总数', valueKey: 'barnTotal' as const, valueClass: '' },
      { key: 'total' as KpiFilter, label: '当前报警', valueKey: 'total' as const, valueClass: 'alarm' },
      { key: 'abnormalBarn' as KpiFilter, label: '异常车间', valueKey: 'abnormalBarn' as const, valueClass: 'warn' },
      { key: 'offline' as KpiFilter, label: '离线设备', valueKey: 'offline' as const, valueClass: 'offline' },
      { key: 'bio' as KpiFilter, label: '总产量(吨)', valueKey: 'bio' as const, valueClass: '' },
      { key: 'totalFeedShipment' as KpiFilter, label: '总出货(吨)', valueKey: 'totalFeedShipment' as const, valueClass: 'feed' },
      { key: 'pigFeedOutput' as KpiFilter, label: '猪饲料产出(吨)', valueKey: 'pigFeedOutput' as const, valueClass: 'feed' },
      { key: 'chickenFeedOutput' as KpiFilter, label: '鸡饲料产出(吨)', valueKey: 'chickenFeedOutput' as const, valueClass: 'feed' },
      { key: 'aquaticFeedOutput' as KpiFilter, label: '水产饲料产出(吨)', valueKey: 'aquaticFeedOutput' as const, valueClass: 'feed' },
      { key: 'pigFeedShipment' as KpiFilter, label: '猪饲料出货(吨)', valueKey: 'pigFeedShipment' as const, valueClass: 'feed' },
      { key: 'chickenFeedShipment' as KpiFilter, label: '鸡饲料出货(吨)', valueKey: 'chickenFeedShipment' as const, valueClass: 'feed' },
      { key: 'aquaticFeedShipment' as KpiFilter, label: '水产饲料出货(吨)', valueKey: 'aquaticFeedShipment' as const, valueClass: 'feed' },
    ]
  }

  const barnLabel = selectedFactoryType.value === 'aquatic' ? '池塘总数' : selectedFactoryType.value === 'chicken' ? '鸡舍总数' : '栏舍总数'
  const bioLabelText = selectedFactoryType.value === 'aquatic' ? '平均溶氧' : '存栏总量'
  
  const baseItems = [
    { key: 'barnTotal' as KpiFilter, label: barnLabel, valueKey: 'barnTotal' as const, valueClass: '' },
    { key: 'total' as KpiFilter, label: '当前报警', valueKey: 'total' as const, valueClass: 'alarm' },
    { key: 'abnormalBarn' as KpiFilter, label: '异常舍数', valueKey: 'abnormalBarn' as const, valueClass: 'warn' },
    { key: 'severe' as KpiFilter, label: '严重报警', valueKey: 'severe' as const, valueClass: 'severe' },
    { key: 'offline' as KpiFilter, label: '离线设备', valueKey: 'offline' as const, valueClass: 'offline' },
    { key: 'bio' as KpiFilter, label: bioLabelText, valueKey: 'bio' as const, valueClass: '' },
    { key: 'dailyDead' as KpiFilter, label: '今日死淘', valueKey: 'dailyDead' as const, valueClass: 'dead' },
    { key: 'totalDead' as KpiFilter, label: '累计死淘', valueKey: 'totalDead' as const, valueClass: 'dead' },
    { key: 'mortalityRate' as KpiFilter, label: '死淘率', valueKey: 'mortalityRate' as const, valueClass: 'rate' },
  ]

  if (selectedFactoryType.value === 'pig') {
    return [
      ...baseItems,
      { key: 'morbidityRate' as KpiFilter, label: '发病率', valueKey: 'morbidityRate' as const, valueClass: 'rate' },
      { key: 'caseFatalityRate' as KpiFilter, label: '病死率', valueKey: 'caseFatalityRate' as const, valueClass: 'rate' },
      { key: 'relapseRate' as KpiFilter, label: '复发率', valueKey: 'relapseRate' as const, valueClass: 'rate' },
      { key: 'medicineUsed' as KpiFilter, label: '用药量(kg)', valueKey: 'medicineUsed' as const, valueClass: 'medicine' },
    ]
  }

  return baseItems
})

const filteredAlarms = computed(() => {
  const alarms = factoryAlarms.value
  switch (activeKpiFilter.value) {
    case 'severe':
      return alarms.filter(a => a.level === '严重')
    case 'abnormalBarn':
      return alarms
    default:
      return alarms
  }
})

const filteredBarnList = computed(() => {
  const barns = barnList.value
  switch (activeKpiFilter.value) {
    case 'abnormalBarn':
      return barns.filter(b => b.status === '告警')
    case 'severe':
    case 'total':
      return barns.some(b => b.alarmCount > 0)
        ? barns.filter(b => b.alarmCount > 0)
        : barns
    case 'offline':
      return barns.filter(b => b.deviceOnline < b.deviceTotal)
    case 'barnTotal':
    case 'bio':
    default:
      return barns
  }
})

const selectKpiFilter = (key: KpiFilter) => {
  activeKpiFilter.value = key
}

const goToBarnDetail = (barn: BarnItem) => {
  router.push({
    path: '/farm/barn-detail',
    query: { id: barn.id, name: barn.name, factoryType: selectedFactoryType.value },
  })
}

const goToBarnDetailFromAlarm = (alarm: FactoryAlarm) => {
  router.push({
    path: '/farm/barn-detail',
    query: { id: alarm.barnId, name: alarm.barnName, factoryType: selectedFactoryType.value },
  })
}

const goToDeviceDetail = () => router.push('/farm/device-detail')
const goToAlarmDetail = () => router.push('/farm/alarm-detail')
const goToDashboard = () => router.push('/')

const generateRandomData = (count: number, min: number, max: number) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)

const generateChartData = (factoryType: string): EChartsOption => {
  const dates: string[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(`${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`)
  }

  const baseAxis = {
    type: 'category' as const,
    boundaryGap: false,
    data: dates,
    axisLabel: { fontSize: 10, rotate: 45 },
  }

  if (factoryType === 'pig') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: generateRandomData(30, 100, 350), areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 200, 350), areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: generateRandomData(30, 150, 600), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  if (factoryType === 'chicken') {
    const names = chickenType.value === 'broiler' ? ['料耗', '增重'] : ['料耗', '产蛋量']
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: names, bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: names.map((name, i) => ({
        name,
        type: 'line' as const,
        smooth: true,
        data: generateRandomData(30, 70 + i * 80, 200 + i * 800),
        areaStyle: { opacity: 0.3 },
      })),
    }
  }

  if (factoryType === 'feed') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['猪饲料产出', '鸡饲料产出', '水产饲料产出'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '猪饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 2000, 3000), areaStyle: { opacity: 0.3 } },
        { name: '鸡饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 2500, 3500), areaStyle: { opacity: 0.3 } },
        { name: '水产饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 1500, 2200), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  if (factoryType === 'aquatic') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['溶氧', '投饵量', 'pH'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '溶氧', type: 'line', smooth: true, data: generateRandomData(30, 4, 8), areaStyle: { opacity: 0.3 } },
        { name: '投饵量', type: 'line', smooth: true, data: generateRandomData(30, 150, 280), areaStyle: { opacity: 0.3 } },
        { name: 'pH', type: 'line', smooth: true, data: generateRandomData(30, 65, 85), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  return { xAxis: baseAxis, yAxis: { type: 'value' }, series: [] }
}

const { resizeCharts, observeContainers } = useChartResize(
  () => [chartInstance],
  () => [chartEl].filter(Boolean) as HTMLElement[]
)

const initChart = (el?: HTMLElement) => {
  if (el) chartEl = el
  if (!chartEl || !hasFactory.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartEl)
  updateChart()
  nextTick(() => {
    observeContainers()
    resizeCharts()
  })
}

const updateChart = () => {
  if (!chartInstance) return
  chartInstance.clear()
  chartInstance.setOption(generateChartData(selectedFactoryType.value), { notMerge: true })
}

watch([selectedFactoryType, chickenType, aquaticType, hasFactory], async () => {
  activeKpiFilter.value = 'total'
  if (hasFactory.value) {
    await nextTick()
    if (!chartInstance && chartEl) initChart()
    else updateChart()
  }
})

watch(hasFactory, async (val) => {
  if (val) {
    await nextTick()
    setTimeout(initChart, 100)
  } else if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onMounted(() => {
  if (route.query.farmName) {
    currentFactory.value = route.query.farmName as string
  }
  if (hasFactory.value) setTimeout(initChart, 100)
})

onUnmounted(() => {
  chartInstance?.dispose()
})

  return {
    can,
    PERMISSION,
    selectedFactoryType,
    currentFactory,
    factoryTypes,
    chickenType,
    aquaticType,
    selectedBarnFilter,
    activeKpiFilter,
    hasFactory,
    factoryTypeLabel,
    barnSectionTitle,
    bioLabel,
    envLabel4,
    displayBarnName,
    barnList,
    factoryAlarms,
    factoryOrders,
    overdueOrderCount,
    factoryCameraList,
    todayDate,
    todayProduction,
    envCompliance,
    unprocessedAlarmCount,
    orderFulfillment,
    businessBenefit,
    businessOverviewItems,
    todayBriefingItems,
    alarmHandleTagType,
    factoryKpi,
    factoryStatusTag,
    kpiItems,
    filteredAlarms,
    filteredBarnList,
    selectKpiFilter,
    goToBarnDetail,
    goToBarnDetailFromAlarm,
    goToDeviceDetail,
    goToAlarmDetail,
    goToDashboard,
    initChart,
    updateChart,
    observeChartContainers: observeContainers,
    resizeCharts,
  }
}
