export type AlarmHandleStatus = '待处理' | '处理中' | '已关闭'

export interface AlarmWorkflow {
  assignee: string
  handleStatus: AlarmHandleStatus
  duration: string
  respondedAt?: string
}

export interface TodayProduction {
  dailyDead: number
  dailyDeadChange: number
  feedConsumption: number
  feedChange: number
  waterConsumption: number
  waterChange: number
  planOutput: number
  actualOutput: number
  batchCount: number
  avgAge: number
}

export interface EnvComplianceSummary {
  overallRate: number
  worstBarn: string
  worstDuration: string
  abnormalBarnCount: number
}

export interface BatchInfo {
  batchNo: string
  entryDate: string
  ageDays: number
  initialStock: number
  currentStock: number
  targetWeight?: string
}

export interface DeviceMaintenance {
  faultCount: number
  nextMaintainDate: string
  maintainStatus: '正常' | '即将到期' | '已超期'
}

export interface OrderFulfillment {
  todayDue: number
  todayCompleted: number
  weekRate: number
  monthRate: number
}

export interface FactoryBenchmark {
  stockRank: number
  stockTotal: number
  alarmRank: number
  alarmTotal: number
  onlineRank: number
  onlineTotal: number
  region: string
}

export interface CostMetrics {
  feedCostPerUnit: number
  waterCostPerUnit: number
  medicineCostPerUnit: number
  unitLabel: string
}

const todayProductionByType: Record<string, TodayProduction> = {
  pig: { dailyDead: 14, dailyDeadChange: 2, feedConsumption: 8560, feedChange: -3.2, waterConsumption: 125, waterChange: 1.5, planOutput: 0, actualOutput: 0, batchCount: 6, avgAge: 42 },
  chicken: { dailyDead: 140, dailyDeadChange: -12, feedConsumption: 6200, feedChange: 0.8, waterConsumption: 88, waterChange: -0.5, planOutput: 82000, actualOutput: 78500, batchCount: 4, avgAge: 128 },
  aquatic: { dailyDead: 85, dailyDeadChange: 5, feedConsumption: 1280, feedChange: 2.1, waterConsumption: 450, waterChange: 0, planOutput: 12, actualOutput: 10, batchCount: 3, avgAge: 65 },
  feed: { dailyDead: 0, dailyDeadChange: 0, feedConsumption: 0, feedChange: 0, waterConsumption: 32, waterChange: -1.2, planOutput: 7500, actualOutput: 7200, batchCount: 0, avgAge: 0 },
}

export const getTodayProduction = (factoryType: string): TodayProduction =>
  todayProductionByType[factoryType] ?? todayProductionByType.pig

export const getEnvCompliance = (abnormalBarnCount: number, barnNames: string[]): EnvComplianceSummary => ({
  overallRate: Math.max(72, 98 - abnormalBarnCount * 8),
  worstBarn: barnNames[0] ?? '—',
  worstDuration: abnormalBarnCount > 0 ? '2小时15分' : '—',
  abnormalBarnCount,
})

export const getBatchInfo = (factoryType: string, barnName: string): BatchInfo => {
  const base: Record<string, Partial<BatchInfo>> = {
    pig: { batchNo: 'PZ-2025-032', entryDate: '2025-04-08', ageDays: 42, initialStock: 1250, currentStock: 1200, targetWeight: '28kg' },
    chicken: { batchNo: 'JJ-2025-018', entryDate: '2025-02-12', ageDays: 128, initialStock: 8200, currentStock: 7800, targetWeight: '—' },
    aquatic: { batchNo: 'SC-2025-006', entryDate: '2025-03-15', ageDays: 65, initialStock: 50000, currentStock: 48200, targetWeight: '500g/尾' },
    feed: { batchNo: 'SL-20250521', entryDate: '2025-05-21', ageDays: 1, initialStock: 0, currentStock: 0, targetWeight: '—' },
  }
  const t = base[factoryType] ?? base.pig
  return {
    batchNo: `${t.batchNo}-${barnName.slice(-1)}`,
    entryDate: t.entryDate!,
    ageDays: t.ageDays!,
    initialStock: t.initialStock!,
    currentStock: t.currentStock!,
    targetWeight: t.targetWeight,
  }
}

export const getDeviceMaintenance = (online: boolean, id: number): DeviceMaintenance => ({
  faultCount: online ? (id % 3 === 0 ? 1 : 0) : 2,
  nextMaintainDate: id % 4 === 0 ? '2025-05-18' : '2025-06-10',
  maintainStatus: id % 4 === 0 ? '已超期' : id % 3 === 0 ? '即将到期' : '正常',
})

export const getOrderFulfillment = (orders: { status: string; deliveryTime: string }[]): OrderFulfillment => {
  const today = '2025-05-21'
  const todayDue = orders.filter(o => o.deliveryTime.startsWith(today)).length + 2
  const completed = orders.filter(o => o.status === '正常').length
  return {
    todayDue,
    todayCompleted: Math.min(todayDue, completed + 1),
    weekRate: 87.5,
    monthRate: 92.3,
  }
}

export const getFactoryBenchmark = (): FactoryBenchmark => ({
  stockRank: 3,
  stockTotal: 18,
  alarmRank: 5,
  alarmTotal: 18,
  onlineRank: 2,
  onlineTotal: 18,
  region: '华东',
})

export const getCostMetrics = (factoryType: string): CostMetrics => {
  if (factoryType === 'chicken') return { feedCostPerUnit: 2.85, waterCostPerUnit: 0.12, medicineCostPerUnit: 0.08, unitLabel: '元/羽' }
  if (factoryType === 'aquatic') return { feedCostPerUnit: 4.2, waterCostPerUnit: 0.35, medicineCostPerUnit: 0.15, unitLabel: '元/尾' }
  if (factoryType === 'feed') return { feedCostPerUnit: 280, waterCostPerUnit: 12, medicineCostPerUnit: 0, unitLabel: '元/吨' }
  return { feedCostPerUnit: 3.2, waterCostPerUnit: 0.18, medicineCostPerUnit: 0.25, unitLabel: '元/头' }
}

export const alarmWorkflowPresets: AlarmWorkflow[] = [
  { assignee: '张工', handleStatus: '待处理', duration: '2小时15分' },
  { assignee: '李主管', handleStatus: '处理中', duration: '45分', respondedAt: '10:05' },
  { assignee: '王巡检', handleStatus: '待处理', duration: '1小时30分' },
  { assignee: '赵技术员', handleStatus: '已关闭', duration: '—', respondedAt: '09:20' },
]

export const getAlarmWorkflow = (index: number, processed: boolean): AlarmWorkflow => {
  if (processed) return { assignee: '系统自动', handleStatus: '已关闭', duration: '—', respondedAt: '09:00' }
  return alarmWorkflowPresets[index % alarmWorkflowPresets.length]
}

/** 养殖生产数据补充（存栏/日龄/死淘见生物数据板块） */
export interface BreedingProductionExtra {
  category: string
  productionRate: number
  survivalRate: number
  mortalityRate: number
}

/** 饲喂采食 */
export interface FeedingIntake {
  feedAmount: number
  feedUnit: string
  weightGain: number
  weightGainUnit: string
  fcr: number
  fcrLabel: string
}

export interface IntakeAlarm {
  id: number
  time: string
  message: string
  level: '严重' | '一般' | '提示'
}

/** 生物防疫 */
export interface DisinfectionRecord {
  date: string
  type: string
  agent: string
  operator: string
  result: '合格' | '不合格'
}

export interface VaccineRecord {
  date: string
  vaccineName: string
  dosage: string
  count: number
  operator: string
  batchNo: string
}

export interface EpidemicAlarm {
  id: number
  time: string
  disease: string
  level: '严重' | '一般' | '提示'
  status: '待处理' | '处理中' | '已关闭'
  description: string
}

export interface TemperatureRecord {
  time: string
  avgTemp: number
  abnormalCount: number
  unit: string
  status: '正常' | '偏高' | '偏低'
}

export interface BehaviorAlarm {
  id: number
  time: string
  type: string
  description: string
  level: '严重' | '一般' | '提示'
}

export interface BioPreventionDetail {
  disinfectionRecords: DisinfectionRecord[]
  vaccineRecords: VaccineRecord[]
  epidemicAlarms: EpidemicAlarm[]
  temperatureRecords: TemperatureRecord[]
  behaviorAlarms: BehaviorAlarm[]
  tempSummary: { label: string; value: string; warn?: boolean }
}

/** @deprecated 保留类型兼容，请使用 BioPreventionDetail */
export interface BioPrevention {
  lastVaccination: string
  nextVaccination: string
  vaccinationStatus: '正常' | '即将到期' | '逾期'
  lastDisinfection: string
  disinfectionCycle: string
  antibodyRate: number
  pendingTasks: { name: string; dueDate: string; status: string }[]
}

/** 生产 tab — 饲料厂三块结构 */
export interface RawMaterialIntake {
  batchNo: string
  materialName: string
  weight: number
  weightUnit: string
  qcResult: '合格' | '不合格' | '待检'
  qcDetail: string
  intakeDate: string
}

export interface RawMaterialStock {
  materialName: string
  currentStock: number
  unit: string
  minStock: number
  maxStock: number
  alertLevel: '正常' | '偏低' | '预警'
}

export interface ProcessDrawing {
  id: string
  name: string
  version: string
  updatedAt: string
}

export interface ProcessParameter {
  name: string
  standard: string
  current: string
  unit: string
  status: '正常' | '偏离'
}

export interface FeedDispatch {
  batchNo: string
  productName: string
  output: number
  outputUnit: string
  passRate: number
  capacityRate: number
  stockQty: number
  stockUnit: string
}

export interface FeedProductionDetail {
  rawIntakes: RawMaterialIntake[]
  rawStocks: RawMaterialStock[]
  stockAlerts: { materialName: string; message: string; level: '预警' | '偏低' }[]
  processDrawings: ProcessDrawing[]
  processParams: ProcessParameter[]
  feedDispatches: FeedDispatch[]
  capacitySummary: {
    dailyOutput: number
    planOutput: number
    utilizationRate: number
    unit: string
  }
}

/** 养殖场生产 tab 简要数据 */
export interface ProductionOutput {
  todayOutput: number
  planOutput: number
  outputUnit: string
  completionRate: number
  qualityPassRate: number
  items: { label: string; value: string | number }[]
}

const breedingExtraByType: Record<string, BreedingProductionExtra> = {
  pig: { category: '三元育肥猪', productionRate: 96.2, survivalRate: 97.8, mortalityRate: 2.2 },
  chicken: { category: '罗曼蛋鸡', productionRate: 94.5, survivalRate: 96.5, mortalityRate: 3.5 },
  aquatic: { category: '南美白对虾', productionRate: 88.0, survivalRate: 91.2, mortalityRate: 8.8 },
  feed: { category: '猪料生产线', productionRate: 98.5, survivalRate: 100, mortalityRate: 0 },
}

export const getBreedingProductionExtra = (factoryType: string): BreedingProductionExtra =>
  breedingExtraByType[factoryType] ?? breedingExtraByType.pig

const feedingByType: Record<string, FeedingIntake> = {
  pig: { feedAmount: 856, feedUnit: 'kg', weightGain: 420, weightGainUnit: 'kg', fcr: 2.04, fcrLabel: '料肉比' },
  chicken: { feedAmount: 620, feedUnit: 'kg', weightGain: 285, weightGainUnit: 'kg', fcr: 2.18, fcrLabel: '料蛋比' },
  aquatic: { feedAmount: 320, feedUnit: 'kg', weightGain: 180, weightGainUnit: 'kg', fcr: 1.78, fcrLabel: '饵料系数' },
  feed: { feedAmount: 2850, feedUnit: 'kg', weightGain: 0, weightGainUnit: '—', fcr: 0, fcrLabel: '—' },
}

export const getFeedingIntake = (factoryType: string): FeedingIntake =>
  feedingByType[factoryType] ?? feedingByType.pig

export const getIntakeAlarms = (factoryType: string, barnName: string): IntakeAlarm[] => {
  if (factoryType === 'feed') return []
  const base = [
    { id: 1, time: '08:45', message: `${barnName} 早饲采食量偏低 18%`, level: '一般' as const },
    { id: 2, time: '14:20', message: `${barnName} 午饲采食量异常波动`, level: '提示' as const },
  ]
  if (factoryType === 'pig') {
    return [{ id: 3, time: '06:30', message: `${barnName} 连续2餐采食量低于标准值`, level: '严重' as const }, ...base]
  }
  return base
}

const bioPreventionByType: Record<string, Omit<BioPreventionDetail, 'temperatureRecords' | 'behaviorAlarms' | 'epidemicAlarms'> & {
  temperatureLabel: string
  tempUnit: string
}> = {
  pig: {
    temperatureLabel: '体温',
    tempUnit: '°C',
    tempSummary: { label: '今日体温异常', value: '3 头', warn: true },
    disinfectionRecords: [
      { date: '2025-05-21', type: '舍内喷雾消毒', agent: '戊二醛 1:200', operator: '张工', result: '合格' },
      { date: '2025-05-18', type: '进场消毒', agent: '过硫酸氢钾', operator: '李主管', result: '合格' },
      { date: '2025-05-15', type: '舍内熏蒸', agent: '福尔马林', operator: '王巡检', result: '合格' },
    ],
    vaccineRecords: [
      { date: '2025-04-28', vaccineName: '口蹄疫灭活疫苗', dosage: '2 ml/头', count: 1250, operator: '赵兽医', batchNo: 'YM-20250412' },
      { date: '2025-03-10', vaccineName: '猪瘟活疫苗', dosage: '1 头份/头', count: 1280, operator: '赵兽医', batchNo: 'YM-20250305' },
    ],
  },
  chicken: {
    temperatureLabel: '体温',
    tempUnit: '°C',
    tempSummary: { label: '今日体温异常', value: '12 羽', warn: true },
    disinfectionRecords: [
      { date: '2025-05-21', type: '舍内消毒', agent: '季铵盐类', operator: '陈场长', result: '合格' },
      { date: '2025-05-19', type: '饮水消毒', agent: '二氧化氯', operator: '刘技术员', result: '合格' },
      { date: '2025-05-17', type: '进场消毒', agent: '过氧乙酸', operator: '陈场长', result: '合格' },
    ],
    vaccineRecords: [
      { date: '2025-05-10', vaccineName: '新城疫-禽流感联苗', dosage: '0.3 ml/羽', count: 8200, operator: '孙兽医', batchNo: 'YM-20250501' },
      { date: '2025-02-12', vaccineName: '马立克疫苗', dosage: '0.2 ml/羽', count: 8500, operator: '孙兽医', batchNo: 'YM-20250208' },
    ],
  },
  aquatic: {
    temperatureLabel: '水温',
    tempUnit: '°C',
    tempSummary: { label: '今日水温异常时段', value: '2 次', warn: true },
    disinfectionRecords: [
      { date: '2025-05-20', type: '水体消毒', agent: '漂白粉', operator: '周工', result: '合格' },
      { date: '2025-05-13', type: '池底清淤消毒', agent: '生石灰', operator: '吴主管', result: '合格' },
    ],
    vaccineRecords: [
      { date: '2025-04-15', vaccineName: '对虾白斑病毒防控', dosage: '按说明', count: 1, operator: '郑技术员', batchNo: 'AQ-20250410' },
    ],
  },
  feed: {
    temperatureLabel: '环境温度',
    tempUnit: '°C',
    tempSummary: { label: '今日温度超限', value: '0 次' },
    disinfectionRecords: [
      { date: '2025-05-21', type: '车间消杀', agent: '过氧乙酸', operator: '车间主任', result: '合格' },
      { date: '2025-05-20', type: '原料区消毒', agent: '季铵盐类', operator: '质检员', result: '合格' },
      { date: '2025-05-19', type: '成品仓消毒', agent: '二氧化氯', operator: '仓管', result: '合格' },
    ],
    vaccineRecords: [],
  },
}

const epidemicAlarmsByType: Record<string, (barnName: string) => EpidemicAlarm[]> = {
  pig: (barn) => [
    { id: 1, time: '09:15', disease: '疑似口蹄疫', level: '严重', status: '处理中', description: `${barn} 2头出现蹄部水泡症状，已隔离` },
    { id: 2, time: '2025-05-18', disease: '猪瘟监测', level: '提示', status: '已关闭', description: '周边区域疫情通报，本厂加强监测' },
  ],
  chicken: (barn) => [
    { id: 11, time: '08:40', disease: '新城疫监测', level: '一般', status: '待处理', description: `${barn} 抗体滴度偏低，建议补免` },
  ],
  aquatic: (barn) => [
    { id: 21, time: '07:20', disease: '白斑病预警', level: '严重', status: '处理中', description: `${barn} 摄食下降，疑似白斑病前兆` },
  ],
  feed: () => [
    { id: 31, time: '10:00', disease: '原料霉变风险', level: '一般', status: '待处理', description: '玉米原料水分偏高，需加强检验' },
  ],
}

const temperatureRecordsByType: Record<string, TemperatureRecord[]> = {
  pig: [
    { time: '10:30', avgTemp: 39.2, abnormalCount: 1, unit: '°C', status: '偏高' },
    { time: '08:00', avgTemp: 38.6, abnormalCount: 0, unit: '°C', status: '正常' },
    { time: '06:00', avgTemp: 38.4, abnormalCount: 2, unit: '°C', status: '偏高' },
  ],
  chicken: [
    { time: '10:30', avgTemp: 41.5, abnormalCount: 5, unit: '°C', status: '偏高' },
    { time: '08:00', avgTemp: 40.8, abnormalCount: 2, unit: '°C', status: '正常' },
    { time: '06:00', avgTemp: 40.5, abnormalCount: 0, unit: '°C', status: '正常' },
  ],
  aquatic: [
    { time: '10:30', avgTemp: 28.5, abnormalCount: 0, unit: '°C', status: '正常' },
    { time: '08:00', avgTemp: 27.2, abnormalCount: 1, unit: '°C', status: '偏低' },
    { time: '06:00', avgTemp: 28.0, abnormalCount: 0, unit: '°C', status: '正常' },
  ],
  feed: [
    { time: '10:30', avgTemp: 26.5, abnormalCount: 0, unit: '°C', status: '正常' },
    { time: '08:00', avgTemp: 25.8, abnormalCount: 0, unit: '°C', status: '正常' },
  ],
}

const behaviorAlarmsByType: Record<string, (barnName: string) => BehaviorAlarm[]> = {
  pig: (barn) => [
    { id: 1, time: '09:50', type: '采食异常', description: `${barn} A区 5头采食明显减少`, level: '一般' },
    { id: 2, time: '07:30', type: '咳嗽频次升高', description: `${barn} 红外监测咳嗽频次超阈值`, level: '严重' },
  ],
  chicken: (barn) => [
    { id: 11, time: '10:10', type: '精神沉郁', description: `${barn} 东侧 8羽精神沉郁、缩颈`, level: '一般' },
    { id: 12, time: '06:45', type: '产蛋骤降', description: `${barn} 2小时产蛋量下降 15%`, level: '提示' },
  ],
  aquatic: (barn) => [
    { id: 21, time: '08:20', type: '浮头增多', description: `${barn} 清晨浮头数量异常增加`, level: '严重' },
    { id: 22, time: '05:30', type: '游动异常', description: `${barn} 部分个体游动迟缓`, level: '一般' },
  ],
  feed: () => [],
}

export const getBioPrevention = (factoryType: string, barnName = ''): BioPreventionDetail => {
  const base = bioPreventionByType[factoryType] ?? bioPreventionByType.pig
  const getEpidemic = epidemicAlarmsByType[factoryType] ?? epidemicAlarmsByType.pig
  const getBehavior = behaviorAlarmsByType[factoryType] ?? behaviorAlarmsByType.pig
  return {
    disinfectionRecords: base.disinfectionRecords,
    vaccineRecords: base.vaccineRecords,
    epidemicAlarms: getEpidemic(barnName),
    temperatureRecords: temperatureRecordsByType[factoryType] ?? temperatureRecordsByType.pig,
    behaviorAlarms: getBehavior(barnName),
    tempSummary: base.tempSummary,
  }
}

export const getBioPreventionTempLabel = (factoryType: string): string =>
  (bioPreventionByType[factoryType] ?? bioPreventionByType.pig).temperatureLabel

const productionByType: Record<string, ProductionOutput> = {
  pig: {
    todayOutput: 0,
    planOutput: 0,
    outputUnit: '头',
    completionRate: 0,
    qualityPassRate: 0,
    items: [
      { label: '出栏预估', value: '320 头' },
      { label: '均重', value: '26.5 kg' },
      { label: '日增重', value: '680 g' },
      { label: '预计出栏日', value: '2025-06-18' },
    ],
  },
  chicken: {
    todayOutput: 8200,
    planOutput: 8500,
    outputUnit: '枚',
    completionRate: 96.5,
    qualityPassRate: 99.2,
    items: [
      { label: '产蛋率', value: '94.2%' },
      { label: '合格蛋率', value: '98.8%' },
      { label: '破损率', value: '0.6%' },
      { label: '均蛋重', value: '62.5 g' },
    ],
  },
  aquatic: {
    todayOutput: 850,
    planOutput: 1000,
    outputUnit: 'kg',
    completionRate: 85.0,
    qualityPassRate: 97.5,
    items: [
      { label: '预估产量', value: '12 吨' },
      { label: '规格达标率', value: '92%' },
      { label: '日均增重', value: '1.2 g' },
      { label: '预计出塘', value: '2025-07-10' },
    ],
  },
  feed: {
    todayOutput: 720,
    planOutput: 750,
    outputUnit: '吨',
    completionRate: 96.0,
    qualityPassRate: 99.5,
    items: [
      { label: '猪料产出', value: '320 吨' },
      { label: '鸡料产出', value: '280 吨' },
      { label: '水产料产出', value: '120 吨' },
      { label: '今日出货', value: '680 吨' },
    ],
  },
}

export const getProductionOutput = (factoryType: string): ProductionOutput =>
  productionByType[factoryType] ?? productionByType.pig

const feedProductionByWorkshop: Record<string, FeedProductionDetail> = {
  default: {
    rawIntakes: [
      { batchNo: 'RM-20250521-01', materialName: '玉米', weight: 42, weightUnit: '吨', qcResult: '合格', qcDetail: '水分 13.2%，霉变粒 0.8%', intakeDate: '2025-05-21 08:30' },
      { batchNo: 'RM-20250521-02', materialName: '豆粕', weight: 18, weightUnit: '吨', qcResult: '合格', qcDetail: '蛋白 43.5%，尿素酶 0.05', intakeDate: '2025-05-21 09:15' },
      { batchNo: 'RM-20250520-03', materialName: '麸皮', weight: 8, weightUnit: '吨', qcResult: '待检', qcDetail: '质检中', intakeDate: '2025-05-20 16:40' },
    ],
    rawStocks: [
      { materialName: '玉米', currentStock: 186, unit: '吨', minStock: 80, maxStock: 300, alertLevel: '正常' },
      { materialName: '豆粕', currentStock: 52, unit: '吨', minStock: 60, maxStock: 150, alertLevel: '偏低' },
      { materialName: '麸皮', currentStock: 28, unit: '吨', minStock: 20, maxStock: 80, alertLevel: '正常' },
      { materialName: '预混料', currentStock: 8, unit: '吨', minStock: 10, maxStock: 30, alertLevel: '预警' },
    ],
    stockAlerts: [
      { materialName: '豆粕', message: '当前库存 52 吨，低于安全库存 60 吨', level: '偏低' },
      { materialName: '预混料', message: '当前库存 8 吨，低于安全库存 10 吨', level: '预警' },
    ],
    processDrawings: [
      { id: 'DRW-001', name: '猪料制粒工艺图', version: 'V3.2', updatedAt: '2025-04-10' },
      { id: 'DRW-002', name: '混合工序流程图', version: 'V2.1', updatedAt: '2025-03-22' },
      { id: 'DRW-003', name: '成品包装线布置图', version: 'V1.8', updatedAt: '2025-02-15' },
    ],
    processParams: [
      { name: '制粒温度', standard: '75–85', current: '78', unit: '°C', status: '正常' },
      { name: '混合时间', standard: '180–240', current: '195', unit: '秒', status: '正常' },
      { name: '蒸汽压力', standard: '0.4–0.6', current: '0.52', unit: 'MPa', status: '正常' },
      { name: '冷却风温', standard: '≤35', current: '38', unit: '°C', status: '偏离' },
    ],
    feedDispatches: [
      { batchNo: 'FD-20250521-01', productName: '仔猪配合饲料', output: 120, outputUnit: '吨', passRate: 99.6, capacityRate: 96.0, stockQty: 45, stockUnit: '吨' },
      { batchNo: 'FD-20250521-02', productName: '育肥猪全价料', output: 280, outputUnit: '吨', passRate: 99.2, capacityRate: 94.5, stockQty: 86, stockUnit: '吨' },
      { batchNo: 'FD-20250520-03', productName: '蛋鸡产蛋期料', output: 180, outputUnit: '吨', passRate: 99.8, capacityRate: 92.0, stockQty: 32, stockUnit: '吨' },
    ],
    capacitySummary: { dailyOutput: 720, planOutput: 750, utilizationRate: 96.0, unit: '吨' },
  },
}

export const getFeedProductionDetail = (workshopName = ''): FeedProductionDetail => {
  const base = feedProductionByWorkshop.default
  if (!workshopName) return base
  return {
    ...base,
    feedDispatches: base.feedDispatches.map(d => ({
      ...d,
      batchNo: `${d.batchNo}-${workshopName.slice(0, 1)}`,
    })),
  }
}

export const stockAlertTagType = (level: RawMaterialStock['alertLevel']) => {
  if (level === '预警') return 'danger'
  if (level === '偏低') return 'warning'
  return 'success'
}

/** 设备故障报警 */
export interface DeviceFaultAlarm {
  id: number
  time: string
  deviceName: string
  deviceType: string
  faultType: string
  level: '严重' | '一般' | '提示'
  status: '待处理' | '处理中' | '已关闭'
  description: string
}

const deviceFaultAlarmsByType: Record<string, (barnName: string) => DeviceFaultAlarm[]> = {
  pig: (barn) => [
    { id: 1, time: '10:15', deviceName: '36寸风机', deviceType: '风机', faultType: '通信中断', level: '严重', status: '待处理', description: `${barn} 36寸风机离线，通风量不足风险` },
    { id: 2, time: '08:30', deviceName: '50寸风机', deviceType: '风机', faultType: '过载保护', level: '一般', status: '处理中', description: `${barn} 风机电流超限，已自动降速` },
    { id: 3, time: '2025-05-20', deviceName: '水帘系统', deviceType: '降温', faultType: '水位偏低', level: '提示', status: '已关闭', description: '水池水位低于 60%，已补水' },
  ],
  chicken: (barn) => [
    { id: 11, time: '09:40', deviceName: '环控器-C01', deviceType: '环控器', faultType: '传感器异常', level: '一般', status: '待处理', description: `${barn} 温度探头读数跳变` },
    { id: 12, time: '07:10', deviceName: '36寸风机', deviceType: '风机', faultType: '通信中断', level: '严重', status: '处理中', description: `${barn} 风机离线超过 2 小时` },
  ],
  aquatic: (barn) => [
    { id: 21, time: '06:50', deviceName: '增氧机-A02', deviceType: '增氧机', faultType: '电机故障', level: '严重', status: '待处理', description: `${barn} 增氧机停机，溶氧下降风险` },
  ],
  feed: (barn) => [
    { id: 31, time: '11:20', deviceName: '制粒机-01', deviceType: '制粒机', faultType: '温度超限', level: '严重', status: '处理中', description: `${barn} 制粒出口温度超过设定值` },
    { id: 32, time: '09:00', deviceName: '混合机-M03', deviceType: '混合机', faultType: '润滑不足', level: '一般', status: '待处理', description: '轴承润滑周期已到，需保养' },
  ],
}

export const getDeviceFaultAlarms = (factoryType: string, barnName: string): DeviceFaultAlarm[] => {
  const fn = deviceFaultAlarmsByType[factoryType] ?? deviceFaultAlarmsByType.pig
  return fn(barnName)
}

/** 能耗监测 */
export interface EnergyStat {
  key: string
  label: string
  todayValue: number
  unit: string
  quota: number
  changePercent: number
}

export interface EnergyAlarm {
  id: number
  time: string
  energyType: string
  alarmType: '异常波动' | '超定额'
  level: '严重' | '一般' | '提示'
  description: string
  currentValue: string
  threshold: string
}

export interface PollutionIndicator {
  name: string
  value: string
  standard: string
  status: '达标' | '临界' | '超标'
}

export interface EnergyMonitoring {
  stats: EnergyStat[]
  alarms: EnergyAlarm[]
  pollutionIndicators: PollutionIndicator[]
}

const energyMonitoringByType: Record<string, (barnName: string) => EnergyMonitoring> = {
  pig: (barn) => ({
    stats: [
      { key: 'electric', label: '今日用电', todayValue: 286, unit: 'kWh', quota: 320, changePercent: -4.2 },
      { key: 'water', label: '今日用水', todayValue: 12.5, unit: 'm³', quota: 15, changePercent: 1.5 },
      { key: 'gas', label: '今日用气', todayValue: 45, unit: 'm³', quota: 50, changePercent: -2.0 },
    ],
    alarms: [
      { id: 1, time: '09:30', energyType: '用水', alarmType: '异常波动', level: '一般', description: `${barn} 用水量 2 小时内突增 35%`, currentValue: '3.2 m³/h', threshold: '2.0 m³/h' },
      { id: 2, time: '07:15', energyType: '用电', alarmType: '超定额', level: '严重', description: `${barn} 今日累计用电已超日定额 92%`, currentValue: '286 kWh', threshold: '320 kWh' },
    ],
    pollutionIndicators: [
      { name: '污水 COD', value: '85 mg/L', standard: '≤100 mg/L', status: '达标' },
      { name: '氨氮', value: '28 mg/L', standard: '≤35 mg/L', status: '达标' },
      { name: '总磷', value: '6.2 mg/L', standard: '≤8 mg/L', status: '临界' },
      { name: '粪污还田率', value: '96%', standard: '≥95%', status: '达标' },
    ],
  }),
  chicken: (barn) => ({
    stats: [
      { key: 'electric', label: '今日用电', todayValue: 420, unit: 'kWh', quota: 450, changePercent: 2.1 },
      { key: 'water', label: '今日用水', todayValue: 8.8, unit: 'm³', quota: 10, changePercent: -0.5 },
    ],
    alarms: [
      { id: 11, time: '10:05', energyType: '用电', alarmType: '异常波动', level: '一般', description: `${barn} 通风风机启停导致功率波动`, currentValue: '18 kW', threshold: '12 kW' },
      { id: 12, time: '06:40', energyType: '用水', alarmType: '超定额', level: '提示', description: `${barn} 饮水线冲洗用水接近日定额`, currentValue: '8.8 m³', threshold: '10 m³' },
    ],
    pollutionIndicators: [
      { name: '鸡粪处理率', value: '100%', standard: '100%', status: '达标' },
      { name: '污水 COD', value: '72 mg/L', standard: '≤100 mg/L', status: '达标' },
      { name: '臭气浓度', value: '12', standard: '≤20', status: '达标' },
    ],
  }),
  aquatic: (barn) => ({
    stats: [
      { key: 'electric', label: '今日用电', todayValue: 580, unit: 'kWh', quota: 600, changePercent: 3.5 },
      { key: 'water', label: '今日换水', todayValue: 45, unit: 'm³', quota: 50, changePercent: 0 },
    ],
    alarms: [
      { id: 21, time: '08:20', energyType: '用电', alarmType: '超定额', level: '严重', description: `${barn} 增氧机全天运行，用电超日定额 96%`, currentValue: '580 kWh', threshold: '600 kWh' },
      { id: 22, time: '05:00', energyType: '换水', alarmType: '异常波动', level: '一般', description: `${barn} 换水量异常偏高`, currentValue: '12 m³/h', threshold: '8 m³/h' },
    ],
    pollutionIndicators: [
      { name: '养殖尾水 COD', value: '45 mg/L', standard: '≤80 mg/L', status: '达标' },
      { name: '总氮', value: '18 mg/L', standard: '≤25 mg/L', status: '达标' },
      { name: '尾水排放达标率', value: '98%', standard: '≥95%', status: '达标' },
    ],
  }),
  feed: (barn) => ({
    stats: [
      { key: 'electric', label: '今日用电', todayValue: 1250, unit: 'kWh', quota: 1400, changePercent: -1.8 },
      { key: 'water', label: '今日用水', todayValue: 32, unit: 'm³', quota: 40, changePercent: -1.2 },
      { key: 'steam', label: '今日蒸汽', todayValue: 8.5, unit: '吨', quota: 10, changePercent: 0.5 },
    ],
    alarms: [
      { id: 31, time: '11:00', energyType: '蒸汽', alarmType: '异常波动', level: '一般', description: `${barn} 制粒工段蒸汽用量波动`, currentValue: '1.2 t/h', threshold: '0.8 t/h' },
      { id: 32, time: '09:45', energyType: '用电', alarmType: '超定额', level: '严重', description: `${barn} 今日用电已达日定额 89%`, currentValue: '1250 kWh', threshold: '1400 kWh' },
    ],
    pollutionIndicators: [
      { name: '粉尘排放', value: '18 mg/m³', standard: '≤20 mg/m³', status: '临界' },
      { name: '噪声', value: '62 dB', standard: '≤65 dB', status: '达标' },
      { name: '废水 COD', value: '55 mg/L', standard: '≤100 mg/L', status: '达标' },
      { name: '环保设备运行率', value: '99%', standard: '≥98%', status: '达标' },
    ],
  }),
}

export const getEnergyMonitoring = (factoryType: string, barnName: string): EnergyMonitoring => {
  const fn = energyMonitoringByType[factoryType] ?? energyMonitoringByType.pig
  return fn(barnName)
}

export const pollutionStatusTagType = (status: PollutionIndicator['status']) => {
  if (status === '超标') return 'danger'
  if (status === '临界') return 'warning'
  return 'success'
}

export const energyUsageRate = (stat: EnergyStat): number =>
  stat.quota > 0 ? Math.min(100, Math.round((stat.todayValue / stat.quota) * 1000) / 10) : 0

/** 生产安全 */
export type SafetyOverlimitCategory = '环控' | '设备' | '其他'

export interface SafetyOverlimitAlarm {
  id: number
  time: string
  category: SafetyOverlimitCategory
  indicator: string
  currentValue: string
  limitValue: string
  level: '严重' | '一般' | '提示'
  description: string
}

export interface EmergencyEvent {
  id: number
  time: string
  eventType: string
  location: string
  handleStatus: '待处置' | '处置中' | '已结案'
  handleDetail: string
  level: '严重' | '一般' | '提示'
}

export interface EmergencyResource {
  id: number
  name: string
  category: '消防设备' | '应急物资'
  location: string
  quantity: string
  status: '正常' | '不足' | '过期' | '待检'
  lastCheck: string
}

export interface ProductionSafety {
  overlimitAlarms: SafetyOverlimitAlarm[]
  emergencyEvents: EmergencyEvent[]
  emergencyResources: EmergencyResource[]
}

const productionSafetyByType: Record<string, (barnName: string) => ProductionSafety> = {
  pig: (barn) => ({
    overlimitAlarms: [
      { id: 1, time: '10:20', category: '环控', indicator: '氨气浓度', currentValue: '18 ppm', limitValue: '15 ppm', level: '严重', description: `${barn} 氨气浓度超限` },
      { id: 2, time: '09:45', category: '环控', indicator: '舍内温度', currentValue: '32°C', limitValue: '28°C', level: '一般', description: `${barn} 温度超过夏季上限` },
      { id: 3, time: '08:30', category: '设备', indicator: '风机电流', currentValue: '12.5 A', limitValue: '10 A', level: '一般', description: '50寸风机运行电流超限' },
      { id: 4, time: '07:00', category: '其他', indicator: '人员滞留', currentValue: '2 人', limitValue: '0 人', level: '提示', description: `${barn} 非作业时段检测到人员进入` },
    ],
    emergencyEvents: [
      { id: 1, time: '2025-05-20 14:30', eventType: '轻微火情', location: `${barn} 东侧料线`, handleStatus: '已结案', handleDetail: '及时切断电源，使用灭火器扑灭，无蔓延', level: '严重' },
      { id: 2, time: '2025-05-21 06:15', eventType: '停电', location: `${barn} 全舍`, handleStatus: '处置中', handleDetail: '已启动备用发电机，环控系统恢复中', level: '一般' },
    ],
    emergencyResources: [
      { id: 1, name: '干粉灭火器 4kg', category: '消防设备', location: `${barn} 门口`, quantity: '4 具', status: '正常', lastCheck: '2025-05-15' },
      { id: 2, name: '消防栓', category: '消防设备', location: `${barn} 过道`, quantity: '2 个', status: '正常', lastCheck: '2025-05-10' },
      { id: 3, name: '应急照明灯', category: '消防设备', location: `${barn} 各出口`, quantity: '6 盏', status: '待检', lastCheck: '2025-04-20' },
      { id: 4, name: '医用口罩', category: '应急物资', location: '物资间', quantity: '200 只', status: '正常', lastCheck: '2025-05-18' },
      { id: 5, name: '消毒药剂', category: '应急物资', location: '物资间', quantity: '15 桶', status: '不足', lastCheck: '2025-05-21' },
      { id: 6, name: '应急药箱', category: '应急物资', location: `${barn} 值班室`, quantity: '1 套', status: '正常', lastCheck: '2025-05-12' },
    ],
  }),
  chicken: (barn) => ({
    overlimitAlarms: [
      { id: 11, time: '10:05', category: '环控', indicator: 'CO₂浓度', currentValue: '2800 ppm', limitValue: '2500 ppm', level: '一般', description: `${barn} 二氧化碳浓度偏高` },
      { id: 12, time: '08:50', category: '设备', indicator: '环控器温度', currentValue: '35°C', limitValue: '32°C', level: '严重', description: '环控器探头读数超限' },
      { id: 13, time: '07:30', category: '其他', indicator: '噪声', currentValue: '72 dB', limitValue: '65 dB', level: '提示', description: `${barn} 风机群噪声短时超限` },
    ],
    emergencyEvents: [
      { id: 11, time: '2025-05-19 22:10', eventType: '极端高温', location: `${barn}`, handleStatus: '已结案', handleDetail: '增加通风频次，无大批量死淘', level: '一般' },
    ],
    emergencyResources: [
      { id: 11, name: '二氧化碳灭火器', category: '消防设备', location: `${barn} 入口`, quantity: '3 具', status: '正常', lastCheck: '2025-05-16' },
      { id: 12, name: '防火沙桶', category: '消防设备', location: `${barn} 配电间旁`, quantity: '2 桶', status: '正常', lastCheck: '2025-05-16' },
      { id: 13, name: '防化手套', category: '应急物资', location: '库房', quantity: '10 双', status: '正常', lastCheck: '2025-05-10' },
      { id: 14, name: '应急饮水', category: '应急物资', location: '值班室', quantity: '24 瓶', status: '不足', lastCheck: '2025-05-21' },
    ],
  }),
  aquatic: (barn) => ({
    overlimitAlarms: [
      { id: 21, time: '09:20', category: '环控', indicator: '溶氧', currentValue: '3.8 mg/L', limitValue: '4.0 mg/L', level: '严重', description: `${barn} 溶氧低于安全下限` },
      { id: 22, time: '06:40', category: '设备', indicator: '增氧机功率', currentValue: '110%', limitValue: '100%', level: '一般', description: '增氧机超负荷运行' },
      { id: 23, time: '05:15', category: '其他', indicator: '池水 pH', currentValue: '9.2', limitValue: '8.5', level: '一般', description: `${barn} pH 值超限` },
    ],
    emergencyEvents: [
      { id: 21, time: '2025-05-18 03:00', eventType: '增氧机故障', location: `${barn} A区`, handleStatus: '已结案', handleDetail: '备用增氧机投入，2 小时内溶氧恢复', level: '严重' },
      { id: 22, time: '2025-05-21 04:30', eventType: '暴雨预警', location: '全场', handleStatus: '处置中', handleDetail: '加强排水巡查，预备抽水泵', level: '一般' },
    ],
    emergencyResources: [
      { id: 21, name: '手提灭火器', category: '消防设备', location: `${barn} 泵房`, quantity: '2 具', status: '正常', lastCheck: '2025-05-08' },
      { id: 22, name: '抽水泵', category: '应急物资', location: '设备库', quantity: '2 台', status: '正常', lastCheck: '2025-05-05' },
      { id: 23, name: '增氧剂', category: '应急物资', location: '药品库', quantity: '8 袋', status: '正常', lastCheck: '2025-05-20' },
      { id: 24, name: '应急网具', category: '应急物资', location: '工具间', quantity: '5 套', status: '待检', lastCheck: '2025-04-28' },
    ],
  }),
  feed: (barn) => ({
    overlimitAlarms: [
      { id: 31, time: '11:10', category: '环控', indicator: '车间粉尘', currentValue: '22 mg/m³', limitValue: '20 mg/m³', level: '严重', description: `${barn} 粉尘浓度超限` },
      { id: 32, time: '10:00', category: '设备', indicator: '制粒温度', currentValue: '92°C', limitValue: '85°C', level: '严重', description: '制粒机出口温度超限' },
      { id: 33, time: '08:20', category: '其他', indicator: '噪声', currentValue: '68 dB', limitValue: '65 dB', level: '一般', description: `${barn} 粉碎工段噪声超限` },
    ],
    emergencyEvents: [
      { id: 31, time: '2025-05-17 15:20', eventType: '粉尘异常', location: `${barn} 粉碎间`, handleStatus: '已结案', handleDetail: '停机除尘，排查布袋除尘器', level: '一般' },
      { id: 32, time: '2025-05-21 09:00', eventType: '设备卡料', location: `${barn} 制粒线`, handleStatus: '处置中', handleDetail: '已停机清料，排查送料系统', level: '严重' },
    ],
    emergencyResources: [
      { id: 31, name: '干粉灭火器', category: '消防设备', location: `${barn} 各工段`, quantity: '12 具', status: '正常', lastCheck: '2025-05-19' },
      { id: 32, name: '消防报警按钮', category: '消防设备', location: `${barn} 主通道`, quantity: '4 个', status: '正常', lastCheck: '2025-05-19' },
      { id: 33, name: '防毒面具', category: '应急物资', location: '安全柜', quantity: '6 套', status: '正常', lastCheck: '2025-05-14' },
      { id: 34, name: '堵漏材料', category: '应急物资', location: '安全柜', quantity: '3 箱', status: '不足', lastCheck: '2025-05-21' },
      { id: 35, name: '应急切断阀工具', category: '应急物资', location: '泵房', quantity: '1 套', status: '正常', lastCheck: '2025-05-01' },
    ],
  }),
}

export const getProductionSafety = (factoryType: string, barnName: string): ProductionSafety => {
  const fn = productionSafetyByType[factoryType] ?? productionSafetyByType.pig
  return fn(barnName)
}

export const emergencyResourceStatusTag = (status: EmergencyResource['status']) => {
  if (status === '不足' || status === '过期') return 'danger'
  if (status === '待检') return 'warning'
  return 'success'
}

export const emergencyHandleStatusTag = (status: EmergencyEvent['handleStatus']) => {
  if (status === '已结案') return 'success'
  if (status === '处置中') return 'warning'
  return 'danger'
}

/** 经营效益 */
export interface BusinessOverviewMetric {
  label: string
  value: string | number
  unit: string
  change?: string
  changeUp?: boolean
}

export interface CostAnalysisItem {
  name: string
  amount: number
  ratio: number
  changePercent: number
}

export interface CostAnalysis {
  totalCost: number
  totalUnit: string
  unitCostLabel: string
  unitCost: number
  items: CostAnalysisItem[]
}

export interface SalesDetail {
  product: string
  volume: string
  revenue: string
}

export interface SalesPerformance {
  volume: number
  volumeUnit: string
  volumeLabel: string
  revenue: number
  revenueUnit: string
  volumeChange: number
  revenueChange: number
  details: SalesDetail[]
}

export interface BusinessBenefit {
  overview: {
    stock: BusinessOverviewMetric
    output: BusinessOverviewMetric
    outputValue: BusinessOverviewMetric
  }
  costAnalysis: CostAnalysis
  salesPerformance: SalesPerformance
}

const businessBenefitByType: Record<string, BusinessBenefit> = {
  pig: {
    overview: {
      stock: { label: '存栏', value: '12,580', unit: '头', change: '较上月 +2.1%', changeUp: true },
      output: { label: '本月出栏', value: 320, unit: '头', change: '较上月 +5.6%', changeUp: true },
      outputValue: { label: '本月产值', value: 186.5, unit: '万元', change: '较上月 +4.8%', changeUp: true },
    },
    costAnalysis: {
      totalCost: 152.8,
      totalUnit: '万元',
      unitCostLabel: '头均成本',
      unitCost: 477,
      items: [
        { name: '饲料成本', amount: 86.2, ratio: 56.4, changePercent: -1.2 },
        { name: '人工成本', amount: 28.5, ratio: 18.7, changePercent: 0.5 },
        { name: '兽药疫苗', amount: 12.8, ratio: 8.4, changePercent: -2.0 },
        { name: '水电能耗', amount: 15.3, ratio: 10.0, changePercent: 1.8 },
        { name: '其他', amount: 10.0, ratio: 6.5, changePercent: 0 },
      ],
    },
    salesPerformance: {
      volume: 298,
      volumeUnit: '头',
      volumeLabel: '本月销量',
      revenue: 172.6,
      revenueUnit: '万元',
      volumeChange: 6.2,
      revenueChange: 5.1,
      details: [
        { product: '三元育肥猪', volume: '220 头', revenue: '128.5 万元' },
        { product: '仔猪', volume: '78 头', revenue: '44.1 万元' },
      ],
    },
  },
  chicken: {
    overview: {
      stock: { label: '存栏', value: '86,200', unit: '羽', change: '较上月 -0.8%', changeUp: false },
      output: { label: '本月产蛋', value: 245, unit: '万枚', change: '较上月 +3.2%', changeUp: true },
      outputValue: { label: '本月产值', value: 128.3, unit: '万元', change: '较上月 +2.5%', changeUp: true },
    },
    costAnalysis: {
      totalCost: 98.6,
      totalUnit: '万元',
      unitCostLabel: '单羽成本',
      unitCost: 11.44,
      items: [
        { name: '饲料成本', amount: 62.4, ratio: 63.3, changePercent: 0.8 },
        { name: '人工成本', amount: 15.2, ratio: 15.4, changePercent: 0 },
        { name: '兽药疫苗', amount: 8.6, ratio: 8.7, changePercent: -1.5 },
        { name: '水电能耗', amount: 9.8, ratio: 9.9, changePercent: 2.1 },
        { name: '其他', amount: 2.6, ratio: 2.7, changePercent: 0 },
      ],
    },
    salesPerformance: {
      volume: 238,
      volumeUnit: '万枚',
      volumeLabel: '本月销量',
      revenue: 124.8,
      revenueUnit: '万元',
      volumeChange: 4.5,
      revenueChange: 3.8,
      details: [
        { product: '鲜鸡蛋', volume: '210 万枚', revenue: '112.6 万元' },
        { product: '淘汰鸡', volume: '1.2 万羽', revenue: '12.2 万元' },
      ],
    },
  },
  aquatic: {
    overview: {
      stock: { label: '存栏', value: '48.2', unit: '万尾', change: '较上月 +1.5%', changeUp: true },
      output: { label: '本月出塘', value: 12.5, unit: '吨', change: '较上月 +8.0%', changeUp: true },
      outputValue: { label: '本月产值', value: 95.8, unit: '万元', change: '较上月 +7.2%', changeUp: true },
    },
    costAnalysis: {
      totalCost: 72.4,
      totalUnit: '万元',
      unitCostLabel: '斤均成本',
      unitCost: 2.9,
      items: [
        { name: '饲料成本', amount: 38.6, ratio: 53.3, changePercent: 1.0 },
        { name: '苗种成本', amount: 12.5, ratio: 17.3, changePercent: -0.5 },
        { name: '水电能耗', amount: 10.2, ratio: 14.1, changePercent: 2.5 },
        { name: '人工成本', amount: 7.8, ratio: 10.8, changePercent: 0 },
        { name: '其他', amount: 3.3, ratio: 4.5, changePercent: 0 },
      ],
    },
    salesPerformance: {
      volume: 11.8,
      volumeUnit: '吨',
      volumeLabel: '本月销量',
      revenue: 89.5,
      revenueUnit: '万元',
      volumeChange: 7.5,
      revenueChange: 6.8,
      details: [
        { product: '南美白对虾', volume: '8.5 吨', revenue: '68.2 万元' },
        { product: '罗氏沼虾', volume: '3.3 吨', revenue: '21.3 万元' },
      ],
    },
  },
  feed: {
    overview: {
      stock: { label: '成品库存', value: 2860, unit: '吨', change: '较上周 -3.5%', changeUp: false },
      output: { label: '本月产量', value: 2180, unit: '吨', change: '较上月 +2.8%', changeUp: true },
      outputValue: { label: '本月产值', value: 652.0, unit: '万元', change: '较上月 +3.1%', changeUp: true },
    },
    costAnalysis: {
      totalCost: 548.6,
      totalUnit: '万元',
      unitCostLabel: '吨均成本',
      unitCost: 2516,
      items: [
        { name: '原料成本', amount: 412.5, ratio: 75.2, changePercent: 1.2 },
        { name: '人工成本', amount: 52.8, ratio: 9.6, changePercent: 0 },
        { name: '能耗成本', amount: 48.6, ratio: 8.9, changePercent: -0.8 },
        { name: '包装运输', amount: 22.4, ratio: 4.1, changePercent: 0.5 },
        { name: '其他', amount: 12.3, ratio: 2.2, changePercent: 0 },
      ],
    },
    salesPerformance: {
      volume: 2050,
      volumeUnit: '吨',
      volumeLabel: '本月销量',
      revenue: 618.5,
      revenueUnit: '万元',
      volumeChange: 3.6,
      revenueChange: 4.2,
      details: [
        { product: '猪料', volume: '920 吨', revenue: '285.6 万元' },
        { product: '鸡料', volume: '780 吨', revenue: '218.4 万元' },
        { product: '水产料', volume: '350 吨', revenue: '114.5 万元' },
      ],
    },
  },
}

export const getBusinessBenefit = (factoryType: string): BusinessBenefit =>
  businessBenefitByType[factoryType] ?? businessBenefitByType.pig
