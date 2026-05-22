<template>
  <div class="dashboard" :class="{ fullscreen: isFullscreen }">
    <!-- 农场指标 tooltip - 放在最外层，fixed 定位 -->
    <div v-if="showFarmIndicatorTooltip" class="farm-tooltip" :style="{ left: farmTooltipPosition.x + 'px', top: farmTooltipPosition.y + 'px' }">
      <div v-if="currentTooltipType < 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">农场总数:</span>
        <span class="farm-tooltip-value">2725</span>
      </div>
      <div v-if="currentTooltipType < 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">栏舍总数:</span>
        <span class="farm-tooltip-value">12400</span>
      </div>
      <div v-if="currentTooltipType < 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">存栏总量:</span>
        <span class="farm-tooltip-value">400万</span>
      </div>
      <!-- 水产专用 -->
      <div v-if="currentTooltipType === 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">农场总数:</span>
        <span class="farm-tooltip-value">2725</span>
      </div>
      <div v-if="currentTooltipType === 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">池塘总数:</span>
        <span class="farm-tooltip-value">3200</span>
      </div>
      <div v-if="currentTooltipType === 2" class="farm-tooltip-item">
        <span class="farm-tooltip-label">养殖面积:</span>
        <span class="farm-tooltip-value">85600</span>
      </div>
    </div>
    
    <div class="dashboard-header">
      <div class="header-left">
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">返回</el-button>
      </div>
      <div class="header-center">
        <h1>正芯农牧智慧监控管理平台</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="FullScreen" @click="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏'
        }}</el-button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="grid-container">
        <!-- 农场看板 - 高度增加 -->
        <div class="panel farm-panel">
          <div class="panel-header farm-panel-header">
            <h3 class="farm-title" @click="goBack">农场看板</h3>
            <div class="farm-indicators-header">
              <div 
                class="farm-type-item" 
                @mouseenter="(e) => showFarmTooltip(0, e)" 
                @mouseleave="hideFarmTooltip"
              >
                <el-icon class="farm-icon"><Box /></el-icon>
                <span class="farm-type-label">猪场</span>
              </div>
              <div 
                class="farm-type-item" 
                @mouseenter="(e) => showFarmTooltip(1, e)" 
                @mouseleave="hideFarmTooltip"
              >
                <el-icon class="farm-icon"><Food /></el-icon>
                <span class="farm-type-label">鸡场</span>
              </div>
              <div 
                class="farm-type-item" 
                @mouseenter="(e) => showFarmTooltip(2, e)" 
                @mouseleave="hideFarmTooltip"
              >
                <el-icon class="farm-icon"><Crop /></el-icon>
                <span class="farm-type-label">水产</span>
              </div>
            </div>
          </div>
          <div class="map-container" @contextmenu="handleContextMenu">
            <div ref="mapChartRef" class="map-chart"></div>
            <!-- 加载状态 -->
            <div v-if="isMapLoading" class="map-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">地图加载中...</div>
            </div>
            <!-- 子菜单弹出层 -->
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
                    :class="{ 'farm-highlighted': highlightedFarmId === farm.id }"
                    @click="goToFarmDetail(farm)">
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

        <!-- 安防监控 - 放在右上角 -->
        <div class="panel security-panel">
          <div class="panel-header">
            <h3 class="panel-title-clickable" @click="goToMonitor">安防监控</h3>
          </div>
          <div class="panel-content">
            <div class="video-container">
              <div class="video-placeholder">
                <el-icon class="video-icon">
                  <VideoCamera />
                </el-icon>
                <p>{{ currentCamera }} 监控画面</p>
              </div>
            </div>
            <div class="camera-selector">
              <el-select v-model="currentCamera" placeholder="选择摄像头" style="width: 100%">
                <el-option v-for="camera in cameras" :key="camera.id" :label="camera.name" :value="camera.name" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 报警信息列表 -->
        <div class="panel alarm-panel">
          <div class="panel-header alarm-list-header">
            <h3 class="panel-title-clickable" @click="goToAlarmDetail">报警信息</h3>
            <span class="alarm-total-badge">{{ alarmList.length }} 条</span>
          </div>
          <div class="panel-content alarm-list-content">
            <div v-if="alarmList.length === 0" class="alarm-list-empty">暂无报警信息</div>
            <div
              v-for="alarm in alarmList"
              :key="alarm.id"
              class="alarm-list-item"
              :class="{ active: selectedAlarmId === alarm.id }"
              @click="flyToFactory(alarm)"
            >
              <div class="alarm-item-top">
                <span class="alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                <span class="alarm-time">{{ alarm.time }}</span>
              </div>
              <div class="alarm-farm-name">{{ alarm.farmName }}</div>
              <div class="alarm-location">{{ alarm.province }} · {{ alarm.city }} · {{ alarm.barn }}</div>
              <div class="alarm-desc">{{ alarm.type }}：{{ alarm.description }}</div>
              <div class="alarm-fly-hint">
                <el-icon><Location /></el-icon>
                <span>点击定位到工厂</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备统计 + 能源监控 合并 - 放在右下角 -->
        <div class="panel combined-panel">
          <div class="panel-header">
            <h3 class="panel-title-clickable" @click="goToDeviceDetail">设备统计</h3>
            <div class="online-offline">
              <div class="status-item status-clickable" @click="goToDeviceDetail">
                <span class="status-label">在线</span>
                <span class="status-value online">5,870</span>
              </div>
              <div class="status-divider">|</div>
              <div class="status-item status-clickable" @click="goToDeviceDetail">
                <span class="status-label">离线</span>
                <span class="status-value offline">160</span>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="panel-header">
            <h3>能源监控</h3>
          </div>
          <div class="combined-content">
            <div class="energy-scroll-container">
              <div class="energy-item">
                <div class="energy-label">当日总水耗</div>
                <div class="energy-icon">
                  <el-icon :size="40" color="#67C23A">
                    <Refrigerator />
                  </el-icon>
                </div>
                <div class="energy-value">8,450 m³</div>
              </div>
              <div class="energy-item">
                <div class="energy-label">当日总电耗</div>
                <div class="energy-icon">
                  <el-icon :size="40" color="#409EFF">
                    <Lightning />
                  </el-icon>
                </div>
                <div class="energy-value">12,580 kWh</div>
              </div>
              <div class="energy-item">
                <div class="energy-label">当日总气耗</div>
                <div class="energy-icon">
                  <el-icon :size="40" color="#E6A23C">
                    <Sunny />
                  </el-icon>
                </div>
                <div class="energy-value">3,200 m³</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, FullScreen, VideoCamera, Lightning, Sunny, Refrigerator, Close, Box, Food, Crop, Location } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { createChinaMapOption, createProvinceMapOption, type CityFarm, type AlarmMapProvider } from '@/utils/chinaMapConfig'

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
}

const router = useRouter()
const isFullscreen = ref(false)
const mapChartRef = ref<HTMLElement | null>(null)
let mapChart: echarts.ECharts | null = null

// 农场指标 tooltip
const showFarmIndicatorTooltip = ref(false)
const farmTooltipPosition = ref({ x: 0, y: 0 })
const currentTooltipType = ref<number>(0) // 0=猪场, 1=鸡场, 2=水产

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
    type: '温度异常', description: '温度超过阈值，当前28°C', level: '严重'
  },
  {
    id: 2, time: '10:28:42', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '广州市', province: '广东', barn: '蛋鸡舍2',
    type: '氨气超标', description: '氨气浓度15ppm，超过安全值', level: '严重'
  },
  {
    id: 3, time: '10:15:08', farmId: 12, farmName: '正芯农牧第三水产场',
    city: '深圳市', province: '广东', barn: '养殖池3',
    type: '溶氧偏低', description: '溶氧量4.2mg/L，低于标准值', level: '一般'
  },
  {
    id: 4, time: '09:58:33', farmId: 4, farmName: '正芯农牧第四猪场',
    city: '南京市', province: '江苏', barn: '分娩舍2',
    type: '湿度异常', description: '湿度过高，当前85%', level: '一般'
  },
  {
    id: 5, time: '09:45:17', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '南京市', province: '江苏', barn: '肉鸡舍1',
    type: '通风故障', description: '通风设备运行异常', level: '严重'
  },
  {
    id: 6, time: '09:30:55', farmId: 12, farmName: '正芯农牧第三水产场',
    city: '杭州市', province: '浙江', barn: '养殖池1',
    type: 'pH异常', description: 'pH值8.5，超出正常范围', level: '提示'
  },
  {
    id: 7, time: '09:12:40', farmId: 4, farmName: '正芯农牧第四猪场',
    city: '武汉市', province: '湖北', barn: '保育舍3',
    type: '设备离线', description: '温控传感器失去连接', level: '严重'
  },
  {
    id: 8, time: '08:55:22', farmId: 8, farmName: '正芯农牧第三鸡场',
    city: '苏州市', province: '江苏', barn: '蛋鸡舍1',
    type: '饮水异常', description: '饮水量低于正常水平', level: '提示'
  },
])

const selectedAlarmId = ref<number | null>(null)
const highlightedFarmId = ref<number | null>(null)

const showFarmTooltip = (index: number, event?: MouseEvent) => {
  currentTooltipType.value = index
  if (event) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    farmTooltipPosition.value = {
      x: rect.left + rect.width / 2 - 80,
      y: rect.bottom + 10
    }
  }
  showFarmIndicatorTooltip.value = true
}

const hideFarmTooltip = () => {
  showFarmIndicatorTooltip.value = false
}

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

const initMapChart = () => {
  if (!mapChartRef.value) return

  isMapLoading.value = true
  
  try {
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

    // 只需要一次 resize
    setTimeout(() => mapChart?.resize(), 50)
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
  setTimeout(() => mapChart?.resize(), 0)
}

// 返回全国地图
const backToChinaMap = () => {
  if (!mapChart) return
  currentMapLevel.value = 'china'
  const option = createChinaMapOption(alarmMapProvider)
  mapChart.setOption(option, true)
  setTimeout(() => mapChart?.resize(), 0)
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



const currentCamera = ref('大门入口')
const cameras = ref([
  { id: 1, name: '大门入口' },
  { id: 2, name: '猪舍A区' },
  { id: 3, name: '猪舍B区' },
  { id: 4, name: '饲料仓库' },
  { id: 5, name: '办公区域' },
  { id: 6, name: '围墙周界' }
])

const isMapLoading = ref(false)

const goBack = () => {
  router.push('/farm')
}

const goToDeviceDetail = () => {
  router.push('/farm/device-detail')
}

const goToMonitor = () => {
  router.push('/farm/monitor-detail')
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
}

const handleResize = () => {
  mapChart?.resize()
}

onMounted(() => {
  // 挂载全局事件处理函数
  ; (window as any).handleFarmClick = handleFarmClick

  // 优先初始化地图（用户第一眼看到的）
  nextTick(() => {
    const rIC = (window as any).requestIdleCallback
    if (rIC) {
      rIC(() => initMapChart())
    } else {
      initMapChart()
    }
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 移除全局事件处理函数
  delete (window as any).handleFarmClick
  mapChart?.dispose()
})
</script>

<style scoped lang="scss">
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
  grid-template-rows: 1.5fr 1fr;
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

/* 合并面板样式 */
.combined-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.divider {
  height: 1px;
  background: rgba(64, 158, 255, 0.3);
  margin: 10px 0;
}

.combined-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  min-width: 0;
  min-height: 0;
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

.device-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 覆盖合并面板中的第一个header */
.combined-panel .panel-header:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding-bottom: 10px;
}

.online-offline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-clickable {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.status-clickable:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.status-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.status-value {
  font-size: 18px;
  font-weight: bold;
}

.status-value.online {
  color: #67c23a;
}

.status-value.offline {
  color: #f56c6c;
}

.status-divider {
  color: rgba(255, 255, 255, 0.3);
}

.farm-title {
  cursor: pointer;
  transition: all 0.3s ease;
}

.farm-title:hover {
  color: #67c23a;
  text-shadow: 0 0 10px rgba(103, 194, 58, 0.5);
}

.panel-title-clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.panel-title-clickable:hover {
  color: #67c23a;
  text-shadow: 0 0 10px rgba(103, 194, 58, 0.5);
}

.farm-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.farm-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.farm-indicators-header {
  display: flex;
  gap: 30px;
  position: relative;
}

.farm-type-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.farm-type-item:hover {
  background: rgba(64, 158, 255, 0.2);
}

.farm-icon {
  font-size: 20px;
  color: #409eff;
}

.farm-type-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.farm-tooltip {
  position: fixed;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(64, 158, 255, 0.5);
  border-radius: 8px;
  padding: 12px 16px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.farm-tooltip-item {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 8px;
}

.farm-tooltip-item:last-child {
  margin-bottom: 0;
}

.farm-tooltip-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.farm-tooltip-value {
  font-size: 16px;
  font-weight: bold;
  color: #67c23a;
  text-shadow: 0 0 10px rgba(103, 194, 58, 0.6);
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

.map-container {
  flex: 1;
  width: 100%;
  min-height: 0;
  height: 100%;
  position: relative;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.9);
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(64, 158, 255, 0.3);
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.map-chart {
  width: 100%;
  height: 100%;
}

.device-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.device-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.device-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  text-align: center;
}

.device-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 5px;
}

.device-icon {
  width: 26px;
  margin-bottom: 5px;
}

.device-count {
  font-size: 22px;
  font-weight: bold;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.energy-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding-right: 5px;
}

.energy-scroll-container {
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: stretch;
  justify-content: space-between;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 5px 0 5px 0;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.energy-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  text-align: center;
  height: 100%;
  flex-shrink: 0;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.energy-label {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
  font-size: 14px;
}

.energy-icon {
  margin-bottom: 10px;
}

.energy-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.energy-scroll-container::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.energy-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.energy-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.25);
  border-radius: 2px;
}

.energy-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.4);
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

.alarm-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-total-badge {
  font-size: 13px;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.15);
  border: 1px solid rgba(245, 108, 108, 0.4);
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.alarm-list-content {
  overflow-y: auto;
  gap: 8px;
  padding-right: 4px;
}

.alarm-list-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 0;
  font-size: 14px;
}

.alarm-list-item {
  padding: 12px 14px;
  margin-bottom: 8px;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.alarm-list-item:last-child {
  margin-bottom: 0;
}

.alarm-list-item:hover {
  background: rgba(64, 158, 255, 0.18);
  border-color: rgba(64, 158, 255, 0.35);
  transform: translateX(3px);
}

.alarm-list-item.active {
  background: rgba(245, 108, 108, 0.12);
  border-color: rgba(245, 108, 108, 0.5);
  box-shadow: 0 0 12px rgba(245, 108, 108, 0.2);
}

.alarm-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.alarm-level {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 4px;
}

.alarm-level.level-严重 {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.2);
}

.alarm-level.level-一般 {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.2);
}

.alarm-level.level-提示 {
  color: #909399;
  background: rgba(144, 147, 153, 0.2);
}

.alarm-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.alarm-farm-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.alarm-location {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 4px;
}

.alarm-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-fly-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: rgba(64, 158, 255, 0.7);
  opacity: 0;
  transition: opacity 0.2s;
}

.alarm-list-item:hover .alarm-fly-hint,
.alarm-list-item.active .alarm-fly-hint {
  opacity: 1;
}

.alarm-list-content::-webkit-scrollbar {
  width: 5px;
}

.alarm-list-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.alarm-list-content::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.25);
  border-radius: 2px;
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

/* 子菜单样式 */
.sub-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.sub-menu-content {
  background: rgba(30, 41, 59, 0.98);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.3);
  width: 400px;
  max-height: 80%;  /* 最多占 .map-container 高度的80% */
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.sub-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px;  /* 上边距加大 */
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
  flex-shrink: 0;  /* 不压缩 */
}

.sub-menu-title {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.close-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #fff;
}

.sub-menu-list {
  padding: 16px 12px 20px;  /* 下边距加大 */
  flex: 1;  /* 占满剩余空间 */
  overflow-y: auto;  /* 允许垂直滚动 */
  min-height: 0;  /* 避免flex子元素溢出 */
}

.sub-menu-item {
  padding: 10px 16px;
  margin-bottom: 6px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.sub-menu-item:hover {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.4);
  transform: translateX(4px);
}

.sub-menu-item.farm-highlighted {
  background: rgba(245, 108, 108, 0.15);
  border-color: rgba(245, 108, 108, 0.5);
  box-shadow: 0 0 10px rgba(245, 108, 108, 0.25);
}

.farm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.farm-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  flex: 1;
  min-width: 0;
}

.farm-status {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.farm-status.status-normal {
  color: #67c23a;
}

.farm-status.status-alarm {
  color: #f56c6c;
}

.sub-menu-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 24px 0;
  font-size: 14px;
}

/* 子菜单滚动条样式 */
.sub-menu-list::-webkit-scrollbar {
  width: 6px;
}

.sub-menu-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.sub-menu-list::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.3);
  border-radius: 3px;
}

.sub-menu-list::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.5);
}
</style>
