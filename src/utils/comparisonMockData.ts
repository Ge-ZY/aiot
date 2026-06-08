export type FactoryType = 'pig' | 'chicken' | 'aquatic' | 'feed'

export type RegionName = '华东' | '华北' | '华南' | '华中' | '西南' | '西北' | '东北'

export const regionOrder: RegionName[] = ['华东', '华北', '华南', '华中', '西南', '西北', '东北']

export const provinceRegionMap: Record<string, RegionName> = {
  上海: '华东', 江苏: '华东', 浙江: '华东', 安徽: '华东', 福建: '华东', 江西: '华东', 山东: '华东',
  北京: '华北', 天津: '华北', 河北: '华北', 山西: '华北', 内蒙古: '华北',
  广东: '华南', 广西: '华南', 海南: '华南',
  河南: '华中', 湖北: '华中', 湖南: '华中',
  重庆: '西南', 四川: '西南', 贵州: '西南', 云南: '西南', 西藏: '西南',
  陕西: '西北', 甘肃: '西北', 青海: '西北', 宁夏: '西北', 新疆: '西北',
  辽宁: '东北', 吉林: '东北', 黑龙江: '东北',
}

export interface ProvinceStat {
  province: string
  region: RegionName
  farmCount: number
  stock: number
  alarmCount: number
  deviceOnlineRate: number
  pigFarms: number
  chickenFarms: number
  aquaticFarms: number
  feedFarms: number
}

const baseProvinceStats: ProvinceStat[] = [
  { province: '山东', region: '华东', farmCount: 28, stock: 186000, alarmCount: 5, deviceOnlineRate: 96.2, pigFarms: 12, chickenFarms: 10, aquaticFarms: 6, feedFarms: 4 },
  { province: '河南', region: '华中', farmCount: 24, stock: 172000, alarmCount: 4, deviceOnlineRate: 94.8, pigFarms: 14, chickenFarms: 6, aquaticFarms: 4, feedFarms: 3 },
  { province: '四川', region: '西南', farmCount: 22, stock: 158000, alarmCount: 3, deviceOnlineRate: 93.5, pigFarms: 10, chickenFarms: 8, aquaticFarms: 4, feedFarms: 3 },
  { province: '广东', region: '华南', farmCount: 26, stock: 145000, alarmCount: 10, deviceOnlineRate: 95.1, pigFarms: 8, chickenFarms: 12, aquaticFarms: 6, feedFarms: 5 },
  { province: '江苏', region: '华东', farmCount: 20, stock: 138000, alarmCount: 6, deviceOnlineRate: 97.0, pigFarms: 9, chickenFarms: 7, aquaticFarms: 4, feedFarms: 4 },
  { province: '湖北', region: '华中', farmCount: 18, stock: 125000, alarmCount: 7, deviceOnlineRate: 92.8, pigFarms: 11, chickenFarms: 5, aquaticFarms: 2, feedFarms: 2 },
  { province: '湖南', region: '华中', farmCount: 16, stock: 112000, alarmCount: 5, deviceOnlineRate: 93.2, pigFarms: 9, chickenFarms: 5, aquaticFarms: 2, feedFarms: 2 },
  { province: '浙江', region: '华东', farmCount: 15, stock: 98000, alarmCount: 8, deviceOnlineRate: 96.5, pigFarms: 5, chickenFarms: 6, aquaticFarms: 4, feedFarms: 3 },
  { province: '河北', region: '华北', farmCount: 19, stock: 96000, alarmCount: 2, deviceOnlineRate: 91.5, pigFarms: 13, chickenFarms: 4, aquaticFarms: 2, feedFarms: 2 },
  { province: '辽宁', region: '东北', farmCount: 14, stock: 88000, alarmCount: 3, deviceOnlineRate: 90.8, pigFarms: 8, chickenFarms: 4, aquaticFarms: 2, feedFarms: 2 },
  { province: '安徽', region: '华东', farmCount: 13, stock: 82000, alarmCount: 3, deviceOnlineRate: 94.0, pigFarms: 7, chickenFarms: 4, aquaticFarms: 2, feedFarms: 2 },
  { province: '福建', region: '华东', farmCount: 11, stock: 76000, alarmCount: 4, deviceOnlineRate: 95.8, pigFarms: 4, chickenFarms: 4, aquaticFarms: 3, feedFarms: 2 },
  { province: '广西', region: '华南', farmCount: 12, stock: 71000, alarmCount: 4, deviceOnlineRate: 92.0, pigFarms: 6, chickenFarms: 3, aquaticFarms: 3, feedFarms: 2 },
  { province: '云南', region: '西南', farmCount: 10, stock: 65000, alarmCount: 1, deviceOnlineRate: 89.5, pigFarms: 4, chickenFarms: 3, aquaticFarms: 3, feedFarms: 1 },
  { province: '黑龙江', region: '东北', farmCount: 12, stock: 62000, alarmCount: 2, deviceOnlineRate: 88.6, pigFarms: 9, chickenFarms: 2, aquaticFarms: 1, feedFarms: 1 },
  { province: '江西', region: '华东', farmCount: 9, stock: 58000, alarmCount: 2, deviceOnlineRate: 93.8, pigFarms: 5, chickenFarms: 2, aquaticFarms: 2, feedFarms: 1 },
  { province: '陕西', region: '西北', farmCount: 8, stock: 52000, alarmCount: 2, deviceOnlineRate: 91.0, pigFarms: 6, chickenFarms: 1, aquaticFarms: 1, feedFarms: 1 },
  { province: '山西', region: '华北', farmCount: 7, stock: 48000, alarmCount: 1, deviceOnlineRate: 90.2, pigFarms: 5, chickenFarms: 1, aquaticFarms: 1, feedFarms: 1 },
]

const toFeedProvinceStats = (list: ProvinceStat[]): ProvinceStat[] =>
  list.map(p => ({
    ...p,
    farmCount: p.feedFarms,
    stock: Math.round(p.stock * 0.08),
    alarmCount: Math.max(1, Math.round(p.alarmCount * 0.6)),
  }))

export interface RegionStat {
  region: RegionName
  farmCount: number
  stock: number
  alarmCount: number
  avgOnlineRate: number
}

export const getProvinceStats = (factoryType?: FactoryType): ProvinceStat[] =>
  factoryType === 'feed' ? toFeedProvinceStats(baseProvinceStats) : baseProvinceStats

export const getRegionStats = (provinces: ProvinceStat[]): RegionStat[] =>
  regionOrder.map(region => {
    const list = provinces.filter(p => p.region === region)
    const farmCount = list.reduce((s, p) => s + p.farmCount, 0)
    const stock = list.reduce((s, p) => s + p.stock, 0)
    const alarmCount = list.reduce((s, p) => s + p.alarmCount, 0)
    const avgOnlineRate = list.length
      ? Math.round(list.reduce((s, p) => s + p.deviceOnlineRate, 0) / list.length * 10) / 10
      : 0
    return { region, farmCount, stock, alarmCount, avgOnlineRate }
  })

export const getTopProvincesByStock = (provinces: ProvinceStat[], limit = 5) =>
  [...provinces].sort((a, b) => b.stock - a.stock).slice(0, limit)

export const getTopProvincesByAlarm = (provinces: ProvinceStat[], limit = 5) =>
  [...provinces].sort((a, b) => b.alarmCount - a.alarmCount).slice(0, limit)

export const getFactoryTypeTotals = (provinces: ProvinceStat[]) => ({
  pig: provinces.reduce((s, p) => s + p.pigFarms, 0),
  chicken: provinces.reduce((s, p) => s + p.chickenFarms, 0),
  aquatic: provinces.reduce((s, p) => s + p.aquaticFarms, 0),
  feed: provinces.reduce((s, p) => s + p.feedFarms, 0),
})

export const formatStock = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1)} 万` : n.toLocaleString()
