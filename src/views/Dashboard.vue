<template>
  <div class="dashboard" :class="{ fullscreen: isFullscreen }">
    <div class="dashboard-header">
      <div class="header-left">
        <el-button type="primary" :icon="ArrowLeft" size="small" @click="goBack">返回</el-button>
      </div>
      <div class="header-center">
        <h1>正芯农牧 · 报警监控大屏</h1>
      </div>
      <div class="header-right">
        <span class="update-time">{{ updateTimeText }}</span>
        <el-button type="primary" :icon="FullScreen" size="small" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>

    <div class="dashboard-body">
      <!-- KPI 条 -->
      <div class="kpi-row">
        <div v-for="item in kpiItems" :key="item.key" class="kpi-card" :class="{ active: activeKpiFilter === item.key }"
          @click="selectKpiFilter(item.key)">
          <div class="kpi-value" :class="item.valueClass">{{ kpiStats[item.valueKey] }}</div>
          <div class="kpi-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- 主体：左地图 + 右侧栏 -->
      <div class="main-grid">
        <!-- 地图板块 -->
        <div class="panel map-panel">
          <div class="panel-header compact-header">
            <h3>报警分布地图</h3>
            <span class="map-hint">颜色越深报警越多 · 右键返回上级</span>
          </div>
          <div class="map-container" @contextmenu="handleContextMenu">
            <div ref="mapChartRef" class="map-chart"></div>
            <div v-if="isMapLoading" class="map-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">地图加载中...</div>
            </div>
            <div v-if="showSubMenu" class="sub-menu-overlay">
              <div class="sub-menu-content">
                <div class="sub-menu-header">
                  <span class="sub-menu-title">{{ subMenuTitle }}</span>
                  <el-icon class="close-icon" @click="closeSubMenu">
                    <Close />
                  </el-icon>
                </div>
                <div class="sub-menu-list">
                  <div v-if="subMenuFarms.length === 0" class="sub-menu-empty">暂无工厂数据</div>
                  <div v-for="(farm, index) in subMenuFarms" :key="index" class="sub-menu-item"
                    :class="{ 'farm-highlighted': highlightedFarmId === farm.id }" @click="goToFarmDetail(farm)">
                    <div class="farm-row">
                      <span class="farm-name">{{ farm.name }}</span>
                      <span class="farm-status" :class="farm.status === '报警' ? 'status-alarm' : 'status-normal'">
                        {{ farm.status === '报警' && farm.alarmCount ? `报警 ${farm.alarmCount}条` : farm.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧栏 -->
        <div class="right-sidebar">
          <!-- 报警列表 -->
          <div class="panel alarm-panel">
            <div class="panel-header compact-header alarm-list-header">
              <h3 class="panel-title-clickable" @click="goToAlarmDetail">实时报警</h3>
              <span class="alarm-total-badge">{{ filteredAlarms.length }} 条</span>
            </div>
            <div class="alarm-list-content">
              <div v-if="filteredAlarms.length === 0" class="alarm-list-empty">暂无报警信息</div>
              <div v-for="alarm in filteredAlarms" :key="alarm.id" class="alarm-list-item"
                :class="{ active: selectedAlarmId === alarm.id }" @click="flyToFactory(alarm)">
                <div class="alarm-item-top">
                  <span class="alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                  <span class="alarm-handle-tag" :class="`status-${alarm.handleStatus}`">{{ alarm.handleStatus }}</span>
                  <span class="alarm-time">{{ alarm.time }}</span>
                </div>
                <div class="alarm-farm-name">{{ alarm.farmName }}</div>
                <div class="alarm-location">{{ alarm.province }} · {{ alarm.city }}</div>
                <div class="alarm-desc">{{ alarm.type }}：{{ alarm.description }}</div>
                <div class="alarm-workflow-row">
                  <span>{{ alarm.assignee }}</span>
                  <span v-if="alarm.duration !== '—'">持续 {{ alarm.duration }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部三小板块 -->
          <div class="stats-row">
            <!-- Top 工厂排行 -->
            <div class="panel mini-panel">
              <div class="mini-panel-title">重点工厂</div>
              <div class="rank-list">
                <div v-for="(item, i) in topFarms" :key="item.farmId" class="rank-item"
                  @click="flyToFactory(item.alarm)">
                  <div class="rank-title-row">
                    <span class="rank-no" :class="{ top3: i < 3 }">{{ i + 1 }}</span>
                    <span class="rank-name">{{ item.farmName }}</span>
                    <span class="rank-count">{{ item.count }} 条</span>
                  </div>
                  <div class="rank-loc">{{ item.province }} · {{ item.city }}</div>
                </div>
              </div>
            </div>

            <!-- 等级分布 -->
            <div class="panel mini-panel">
              <div class="mini-panel-title">报警等级</div>
              <div class="bar-list">
                <div v-for="item in levelStats" :key="item.label" class="bar-item">
                  <div class="bar-label-row">
                    <span class="bar-label" :class="`level-${item.label}`">{{ item.label }}</span>
                    <span class="bar-count">{{ item.count }}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" :class="`fill-${item.label}`" :style="{ width: item.percent + '%' }">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 类型分布 -->
            <div class="panel mini-panel">
              <div class="mini-panel-title">报警类型</div>
              <div class="bar-list">
                <div v-for="item in typeStats" :key="item.label" class="bar-item">
                  <div class="bar-label-row">
                    <span class="bar-label">{{ item.label }}</span>
                    <span class="bar-count">{{ item.count }}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill fill-type" :style="{ width: item.percent + '%' }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FullScreen, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { createChinaMapOption, createProvinceMapOption, type CityFarm, type AlarmMapProvider } from '@/utils/chinaMapConfig'
import { useChartResize } from '@/composables/useChartResize'

interface DashboardAlarm {
  id: number
  time: string
  farmId: number
  farmName: string
  city: string
  province: string
  barn: string
  type: string
  description: string
  level: '严重' | '一般' | '提示'
  processed: boolean
  isTodayNew: boolean
  assignee: string
  handleStatus: '待处理' | '处理中' | '已关闭'
  duration: string
}

type KpiFilter = 'total' | 'severe' | 'farm' | 'todayNew' | 'unprocessed'

const router = useRouter()
const isFullscreen = ref(false)
const mapChartRef = ref<HTMLElement | null>(null)
let mapChart: echarts.ECharts | null = null

// 地图当前层级：'china' 或省份名称
const currentMapLevel = ref<'china' | string>('china')

// 子菜单相关状态
const showSubMenu = ref(false)
const subMenuTitle = ref('')
const subMenuFarms = ref<CityFarm[]>([])

// 基础工厂模板（对应后台管理页面存在的厂）
const baseFarmTemplates: CityFarm[] = [
  { id: 1, name: '正芯农牧第一猪场', status: '正常' },
  { id: 2, name: '正芯农牧第二猪场', status: '正常' },
  { id: 3, name: '正芯农牧第三猪场', status: '正常' },
  { id: 4, name: '正芯农牧第四猪场', status: '报警', alarmCount: 3 },
  { id: 5, name: '正芯农牧第五猪场', status: '正常' },
  { id: 6, name: '正芯农牧第一鸡场', status: '正常' },
  { id: 7, name: '正芯农牧第二鸡场', status: '正常' },
  { id: 8, name: '正芯农牧第三鸡场', status: '报警', alarmCount: 2 },
  { id: 9, name: '正芯农牧第四鸡场', status: '正常' },
  { id: 10, name: '正芯农牧第一水产场', status: '正常' },
  { id: 11, name: '正芯农牧第二水产场', status: '正常' },
  { id: 12, name: '正芯农牧第三水产场', status: '报警', alarmCount: 5 },
]

// 模拟各省份报警数量
const mockProvinceAlarmCounts: Record<string, number> = {
  '广东': 10, '江苏': 6, '山东': 5, '河南': 4, '四川': 3,
  '湖北': 7, '湖南': 5, '浙江': 8, '福建': 4, '安徽': 3,
  '河北': 2, '辽宁': 3, '黑龙江': 2, '云南': 1, '广西': 4,
}

// 模拟各城市工厂（部分城市有自定义数据，其余使用默认模板）
const mockCityFarms: Record<string, CityFarm[]> = {
  '广州市': [
    { id: 1, name: '正芯农牧第一猪场', status: '正常' },
    { id: 2, name: '正芯农牧第二猪场', status: '正常' },
    { id: 4, name: '正芯农牧第四猪场', status: '报警', alarmCount: 3 },
    { id: 6, name: '正芯农牧第一鸡场', status: '正常' },
    { id: 8, name: '正芯农牧第三鸡场', status: '报警', alarmCount: 2 },
    { id: 10, name: '正芯农牧第一水产场', status: '正常' },
  ],
  '深圳市': [
    { id: 3, name: '正芯农牧第三猪场', status: '正常' },
    { id: 5, name: '正芯农牧第五猪场', status: '正常' },
    { id: 12, name: '正芯农牧第三水产场', status: '报警', alarmCount: 5 },
  ],
  '南京市': [
    { id: 1, name: '正芯农牧第一猪场', status: '正常' },
    { id: 4, name: '正芯农牧第四猪场', status: '报警', alarmCount: 2 },
    { id: 7, name: '正芯农牧第二鸡场', status: '正常' },
    { id: 8, name: '正芯农牧第三鸡场', status: '报警', alarmCount: 1 },
  ],
}

const getCityFarms = (cityName: string): CityFarm[] => {
  if (mockCityFarms[cityName]) return mockCityFarms[cityName]
  return baseFarmTemplates.slice(0, 6 + (cityName.charCodeAt(0) % 4))
}

const allFarms = [...baseFarmTemplates, ...Object.values(mockCityFarms).flat()]

const alarmMapProvider: AlarmMapProvider = {
  getProvinceAlarmCount: (provinceName: string) => {
    if (mockProvinceAlarmCounts[provinceName] !== undefined) {
      return mockProvinceAlarmCounts[provinceName]
    }
    return provinceName.charCodeAt(0) % 8
  },
  getCityFarms
}

// 实时报警列表（mock）
const alarmList = ref<DashboardAlarm[]>([
  {
    id: 1, time: '10:32:15', farmId: 4, farmName: '正芯农牧第四猪场',
    city: '广州市', province: '广东', barn: '保育舍1',
    type: '温度异常', description: '温度超过阈值，当前28°C', level: '严重',
    processed: false, isTodayNew: true, assignee: '张工', handleStatus: '待处理', duration: '2小时15分'
  },
  {
    id: 2, time: '10:28:42', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '广州市', province: '广东', barn: '蛋鸡舍2',
    type: '氨气超标', description: '氨气浓度15ppm，超过安全值', level: '严重',
    processed: false, isTodayNew: true, assignee: '李主管', handleStatus: '处理中', duration: '45分'
  },
  {
    id: 3, time: '10:15:08', farmId: 12, farmName: '正芯农牧第三水产场',
    city: '深圳市', province: '广东', barn: '养殖池3',
    type: '溶氧偏低', description: '溶氧量4.2mg/L，低于标准值', level: '一般',
    processed: false, isTodayNew: true, assignee: '王巡检', handleStatus: '待处理', duration: '1小时30分'
  },
  {
    id: 4, time: '09:58:33', farmId: 4, farmName: '正芯农牧第四猪场',
    city: '南京市', province: '江苏', barn: '分娩舍2',
    type: '湿度异常', description: '湿度过高，当前85%', level: '一般',
    processed: false, isTodayNew: true, assignee: '赵技术员', handleStatus: '待处理', duration: '55分'
  },
  {
    id: 5, time: '09:45:17', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '南京市', province: '江苏', barn: '肉鸡舍1',
    type: '通风故障', description: '通风设备运行异常', level: '严重',
    processed: false, isTodayNew: true, assignee: '张工', handleStatus: '待处理', duration: '3小时05分'
  },
  {
    id: 6, time: '09:30:55', farmId: 12, farmName: '正芯农牧第三水产场',
    city: '杭州市', province: '浙江', barn: '养殖池1',
    type: 'pH异常', description: 'pH值8.5，超出正常范围', level: '提示',
    processed: true, isTodayNew: false, assignee: '系统自动', handleStatus: '已关闭', duration: '—'
  },
  {
    id: 7, time: '09:12:40', farmId: 4, farmName: '正芯农牧第四猪场',
    city: '武汉市', province: '湖北', barn: '保育舍3',
    type: '设备离线', description: '温控传感器失去连接', level: '严重',
    processed: false, isTodayNew: false, assignee: '李主管', handleStatus: '处理中', duration: '20分'
  },
  {
    id: 8, time: '08:55:22', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '苏州市', province: '江苏', barn: '蛋鸡舍1',
    type: '饮水异常', description: '饮水量低于正常水平', level: '提示',
    processed: false, isTodayNew: false, assignee: '王巡检', handleStatus: '待处理', duration: '4小时10分'
  },
])

const selectedAlarmId = ref<number | null>(null)
const highlightedFarmId = ref<number | null>(null)
const activeKpiFilter = ref<KpiFilter>('total')

const kpiStats = computed(() => {
  const list = alarmList.value
  const farmIds = new Set(list.map(a => a.farmId))
  return {
    total: list.length,
    severe: list.filter(a => a.level === '严重').length,
    farmCount: farmIds.size,
    todayNew: list.filter(a => a.isTodayNew).length,
    unprocessed: list.filter(a => !a.processed).length,
  }
})

const kpiItems: Array<{ key: KpiFilter; label: string; valueKey: 'total' | 'severe' | 'farmCount' | 'todayNew' | 'unprocessed'; valueClass: string }> = [
  { key: 'total', label: '当前报警', valueKey: 'total', valueClass: 'alarm' },
  { key: 'severe', label: '严重报警', valueKey: 'severe', valueClass: 'severe' },
  { key: 'farm', label: '涉及工厂', valueKey: 'farmCount', valueClass: '' },
  { key: 'todayNew', label: '今日新增', valueKey: 'todayNew', valueClass: 'today' },
  { key: 'unprocessed', label: '未处理', valueKey: 'unprocessed', valueClass: 'pending' },
]

const filteredAlarms = computed(() => {
  const list = alarmList.value
  switch (activeKpiFilter.value) {
    case 'severe':
      return list.filter(a => a.level === '严重')
    case 'farm': {
      const seen = new Set<number>()
      return list.filter(a => {
        if (seen.has(a.farmId)) return false
        seen.add(a.farmId)
        return true
      })
    }
    case 'todayNew':
      return list.filter(a => a.isTodayNew)
    case 'unprocessed':
      return list.filter(a => !a.processed)
    default:
      return list
  }
})

const selectKpiFilter = (key: KpiFilter) => {
  activeKpiFilter.value = key
  selectedAlarmId.value = null
}

const topFarms = computed(() => {
  const map = new Map<number, { farmId: number; farmName: string; province: string; city: string; count: number; alarm: DashboardAlarm }>()
  for (const alarm of alarmList.value) {
    const existing = map.get(alarm.farmId)
    if (existing) {
      existing.count++
    } else {
      map.set(alarm.farmId, {
        farmId: alarm.farmId,
        farmName: alarm.farmName,
        province: alarm.province,
        city: alarm.city,
        count: 1,
        alarm,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
})

const levelStats = computed(() => {
  const levels: Array<'严重' | '一般' | '提示'> = ['严重', '一般', '提示']
  const total = alarmList.value.length || 1
  return levels.map(label => {
    const count = alarmList.value.filter(a => a.level === label).length
    return { label, count, percent: Math.round((count / total) * 100) }
  })
})

const typeStats = computed(() => {
  const typeMap = new Map<string, number>()
  for (const alarm of alarmList.value) {
    typeMap.set(alarm.type, (typeMap.get(alarm.type) ?? 0) + 1)
  }
  const total = alarmList.value.length || 1
  return [...typeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count, percent: Math.round((count / total) * 100) }))
})

const updateTimeText = computed(() => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 更新`
})

// 打开城市工厂列表
const openCityFarmMenu = (cityName: string, farmId?: number) => {
  subMenuTitle.value = `${cityName} - 工厂列表`
  subMenuFarms.value = getCityFarms(cityName)
  highlightedFarmId.value = farmId ?? null
  showSubMenu.value = true

  if (mapChart) {
    mapChart.dispatchAction({ type: 'hideTip' })
  }
}

// tooltip / 列表中点击工厂
const handleFarmClick = (farmId: number) => {
  const farm = allFarms.find(f => f.id === farmId)
  if (!farm) return
  closeSubMenu()
  router.push({ path: '/farm', query: { farmId: farm.id, farmName: farm.name } })

  if (mapChart) {
    mapChart.dispatchAction({ type: 'hideTip' })
  }
}

// 关闭子菜单
const closeSubMenu = () => {
  showSubMenu.value = false
}

// 跳转到厂详情
const goToFarmDetail = (farm: CityFarm) => {
  closeSubMenu()
  router.push({ path: '/farm', query: { farmId: farm.id, farmName: farm.name } })
}

// 地图定位到报警工厂
const flyToFactory = async (alarm: DashboardAlarm) => {
  selectedAlarmId.value = alarm.id
  closeSubMenu()

  if (!mapChart) return

  if (currentMapLevel.value === 'china') {
    await showProvinceMapAsync(alarm.province)
  } else if (currentMapLevel.value !== alarm.province) {
    backToChinaMap()
    await nextTick()
    await showProvinceMapAsync(alarm.province)
  }

  await nextTick()
  setTimeout(() => {
    mapChart?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    mapChart?.dispatchAction({ type: 'highlight', seriesIndex: 0, name: alarm.city })
    mapChart?.dispatchAction({ type: 'showTip', seriesIndex: 0, name: alarm.city })
    openCityFarmMenu(alarm.city, alarm.farmId)
  }, 350)
}

const showProvinceMapAsync = (provinceName: string): Promise<void> => {
  return new Promise(resolve => {
    showProvinceMap(provinceName)
    setTimeout(resolve, 300)
  })
}

const { resizeCharts, observeContainers } = useChartResize(
  () => [mapChart],
  () => [mapChartRef.value]
)

const initMapChart = () => {
  if (!mapChartRef.value) return

  isMapLoading.value = true

  try {
    mapChart?.dispose()
    mapChart = echarts.init(mapChartRef.value)

    const option = createChinaMapOption(alarmMapProvider)
    mapChart.setOption(option, true)

    mapChart.on('click', (params: any) => {
      const regionName = params.name
      if (!regionName) return

      if (currentMapLevel.value === 'china') {
        showProvinceMap(regionName)
      } else {
        openCityFarmMenu(regionName)
      }
    })

    nextTick(() => {
      observeContainers()
      resizeCharts()
    })
  } catch (error) {
    console.error('地图初始化失败:', error)
  } finally {
    isMapLoading.value = false
  }
}

// 显示省级地图
const showProvinceMap = (provinceName: string) => {
  if (!mapChart) return
  currentMapLevel.value = provinceName
  const option = createProvinceMapOption(provinceName, alarmMapProvider)
  mapChart.setOption(option, true)
  nextTick(resizeCharts)
}

// 返回全国地图
const backToChinaMap = () => {
  if (!mapChart) return
  currentMapLevel.value = 'china'
  const option = createChinaMapOption(alarmMapProvider)
  mapChart.setOption(option, true)
  nextTick(resizeCharts)
}

// 处理右键事件
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault() // 始终禁用右键菜单

  if (showSubMenu.value) {
    // 如果有子菜单，先关闭子菜单
    closeSubMenu()
  } else if (currentMapLevel.value !== 'china') {
    // 如果是市级地图，返回到全国地图
    backToChinaMap()
  }
  // 全国地图不做任何事（已禁用右键）
}

const isMapLoading = ref(false)

const goBack = () => {
  router.push('/farm')
}

const goToAlarmDetail = () => {
  router.push('/farm/alarm-detail')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
  nextTick(resizeCharts)
}

onMounted(() => {
  // 挂载全局事件处理函数
  (window as any).handleFarmClick = handleFarmClick

  // 优先初始化地图（用户第一眼看到的）
  nextTick(() => {
    const rIC = (window as any).requestIdleCallback
    if (rIC) {
      rIC(() => initMapChart())
    } else {
      initMapChart()
    }
  })

})

onUnmounted(() => {
  // 移除全局事件处理函数
  delete (window as any).handleFarmClick
  mapChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard {
  position: fixed;
  inset: 0;
  min-width: var(--app-min-width);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: white;
  padding: 12px 16px;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 9999;
}

.dashboard.fullscreen {
  padding: 8px 12px;
}

/* ── 顶栏 ── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 44px;
  margin-bottom: 10px;
}

.header-center h1 {
  margin: 0;
  font-size: 22px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

/* ── 主体 ── */
.dashboard-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
}

/* KPI 条 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  flex-shrink: 0;
}

.kpi-card {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(64, 158, 255, 0.45);
    background: rgba(64, 158, 255, 0.08);
  }

  &.active {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.18);
    box-shadow: 0 0 12px rgba(64, 158, 255, 0.25);

    .kpi-label {
      color: #409eff;
      font-weight: 600;
    }
  }
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;

  &.alarm {
    color: #f56c6c;
  }

  &.severe {
    color: #ff7875;
  }

  &.pending {
    color: #e6a23c;
  }

  &.today {
    color: #67c23a;
  }
}

.kpi-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 2px;
}

/* 主网格：左地图 + 右侧栏，约 58 : 42 */
.main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 12px;
  min-height: 0;
}

.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  min-width: 0;
}

/* ── 通用 panel ── */
.panel {
  background: rgba(30, 41, 59, 0.85);
  border-radius: 10px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  padding: 12px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.25);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #409eff;
  }
}

.panel-title-clickable {
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #67c23a;
  }
}

.map-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* ── 地图 ── */
.map-panel {
  min-height: 0;
  min-width: 0;
  padding: 10px 12px;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

.map-chart {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.9);
  z-index: 100;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(64, 158, 255, 0.3);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

/* ── 报警列表 ── */
.alarm-panel {
  flex: 1;
  min-height: 0;
}

.alarm-list-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.25);
}

.alarm-total-badge {
  font-size: 12px;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.15);
  border: 1px solid rgba(245, 108, 108, 0.35);
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.alarm-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 4px;
}

.alarm-list-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 20px 0;
  font-size: 13px;
}

.alarm-list-item {
  padding: 9px 12px;
  background: rgba(64, 158, 255, 0.07);
  border: 1px solid rgba(64, 158, 255, 0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(64, 158, 255, 0.15);
    border-color: rgba(64, 158, 255, 0.3);
  }

  &.active {
    background: rgba(245, 108, 108, 0.12);
    border-color: rgba(245, 108, 108, 0.45);
  }
}

.alarm-level {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;

  &.level-严重 {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.2);
  }

  &.level-一般 {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.2);
  }

  &.level-提示 {
    color: #909399;
    background: rgba(144, 147, 153, 0.2);
  }
}

.alarm-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.alarm-farm-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.alarm-location {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}

.alarm-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-handle-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.alarm-handle-tag.status-待处理 {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.2);
}

.alarm-handle-tag.status-处理中 {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.2);
}

.alarm-handle-tag.status-已关闭 {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.2);
}

.alarm-workflow-row {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
}

.alarm-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.alarm-list-content::-webkit-scrollbar {
  width: 4px;
}

.alarm-list-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.alarm-list-content::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.3);
  border-radius: 2px;
}

/* ── 底部三小板块 ── */
.stats-row {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  min-height: 0;
}

.mini-panel {
  padding: 10px 12px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.mini-panel-title {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
  flex: 1;
  justify-content: space-evenly;
}

.rank-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(64, 158, 255, 0.12);
  }
}

.rank-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.rank-no {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);

  &.top3 {
    background: rgba(245, 108, 108, 0.25);
    color: #f56c6c;
    font-weight: bold;
  }
}

.rank-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.rank-loc {
  padding-left: 22px;
  font-size: 10px;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.45);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-count {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 16px;
  font-weight: bold;
  color: #f56c6c;
  white-space: nowrap;
}

.bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  flex: 1;
  justify-content: space-evenly;
}

.bar-item {
  flex-shrink: 0;
}

.bar-label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.bar-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);

  &.level-严重 {
    color: #f56c6c;
  }

  &.level-一般 {
    color: #e6a23c;
  }

  &.level-提示 {
    color: #909399;
  }
}

.bar-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.bar-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;

  &.fill-严重 {
    background: #f56c6c;
  }

  &.fill-一般 {
    background: #e6a23c;
  }

  &.fill-提示 {
    background: #909399;
  }

  &.fill-type {
    background: #409eff;
  }
}

/* ── 子菜单 ── */
.sub-menu-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.sub-menu-content {
  background: rgba(30, 41, 59, 0.98);
  border-radius: 10px;
  border: 1px solid rgba(64, 158, 255, 0.3);
  width: 360px;
  max-height: 75%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.sub-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
  flex-shrink: 0;
}

.sub-menu-title {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.close-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;

  &:hover {
    color: #fff;
  }
}

.sub-menu-list {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.sub-menu-item {
  padding: 9px 12px;
  margin-bottom: 5px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(64, 158, 255, 0.2);
    border-color: rgba(64, 158, 255, 0.35);
  }

  &.farm-highlighted {
    background: rgba(245, 108, 108, 0.15);
    border-color: rgba(245, 108, 108, 0.5);
  }
}

.farm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.farm-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  flex: 1;
  min-width: 0;
}

.farm-status {
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;

  &.status-normal {
    color: #67c23a;
  }

  &.status-alarm {
    color: #f56c6c;
  }
}

.sub-menu-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  padding: 20px 0;
  font-size: 13px;
}
</style>
