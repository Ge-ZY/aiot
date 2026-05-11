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
        <el-button type="primary" :icon="FullScreen" @click="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏'
        }}</el-button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="grid-container">
        <div class="panel farm-panel">
          <div class="panel-header farm-panel-header">
            <h3 class="farm-title" @click="goBack">农场看板</h3>
            <div class="farm-indicators-header">
              <div class="indicator-item">
                <span class="indicator-label">农场总数:</span>
                <span class="indicator-value">{{ 2725 }}</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">栏舍总数:</span>
                <span class="indicator-value">{{ 12400 }}</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">存栏总量:</span>
                <span class="indicator-value">400万</span>
              </div>
            </div>
          </div>
          <div class="map-container" @contextmenu="handleContextMenu">
            <div ref="mapChartRef" class="map-chart"></div>
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
                  <div v-for="(farm, index) in subMenuFarms" :key="index" class="sub-menu-item"
                    @click="goToFarmDetail(farm)">
                    <div class="farm-name">{{ farm.name }}</div>
                    <div class="farm-info">
                      <span class="info-tag">{{ farm.type }}</span>
                      <span class="info-status" :class="farm.status === '正常' ? 'status-normal' : 'status-warning'">
                        {{ farm.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel device-panel">
          <div class="panel-header device-panel-header">
            <h3 class="panel-title-clickable" @click="goToDeviceDetail">设备统计</h3>
            <div class="online-offline">
              <div class="status-item">
                <span class="status-label">在线</span>
                <span class="status-value online">5,870</span>
              </div>
              <div class="status-divider">|</div>
              <div class="status-item">
                <span class="status-label">离线</span>
                <span class="status-value offline">160</span>
              </div>
            </div>
          </div>
          <div class="device-panel-content">
            <div class="device-grid-container">
              <div class="device-item" v-for="(device, index) in deviceList" :key="index">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-icon">
                  <component :is="iconComponents[device.icon]" :size="32" :color="device.color" class="icon" />
                </div>
                <div class="device-count" :style="{ color: device.color }">{{ device.count }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-left-container">
          <div class="panel energy-panel">
            <div class="panel-header">
              <h3>能源监控</h3>
            </div>
            <div class="energy-panel-content">
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
        </div>

        <div class="panel alarm-panel">
          <div class="panel-header">
            <h3>报警趋势</h3>
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
import { ArrowLeft, FullScreen, VideoCamera, Warning, Plus, Delete, Edit, Refresh, Download, Lightning, Connection, Operation, Share, CircleCheck, CircleClose, Sunny, Refrigerator, Cpu, Bell, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { createChinaMapOption, createProvinceMapOption } from '@/utils/chinaMapConfig'
import { sdk } from '@/utils/sdk'

const router = useRouter()
const isFullscreen = ref(false)
const alarmChartRef = ref<HTMLElement | null>(null)
const mapChartRef = ref<HTMLElement | null>(null)
let alarmChart: echarts.ECharts | null = null
let mapChart: echarts.ECharts | null = null

// 地图当前层级：'china' 或省份名称
const currentMapLevel = ref<'china' | string>('china')

// 子菜单相关状态
const showSubMenu = ref(false)
const subMenuTitle = ref('')
const subMenuFarms = ref<any[]>([])

// 模拟的厂数据（尽量对应后台管理页面存在的厂）
const mockFarms = {
  pig: [
    { id: 1, name: '保育舍1', type: '猪场', status: '正常', company: '正芯农牧' },
    { id: 2, name: '保育舍2', type: '猪场', status: '正常', company: '正芯农牧' },
    { id: 3, name: '保育舍3', type: '猪场', status: '正常', company: '正芯农牧' },
    { id: 4, name: '保育舍4', type: '猪场', status: '告警', company: '正芯农牧' },
    { id: 5, name: '分娩舍1', type: '猪场', status: '正常', company: '正芯农牧' },
  ],
  chicken: [
    { id: 6, name: '蛋鸡舍A区', type: '鸡场', status: '正常', company: '正芯农牧' },
    { id: 7, name: '蛋鸡舍B区', type: '鸡场', status: '正常', company: '正芯农牧' },
    { id: 8, name: '肉鸡舍1', type: '鸡场', status: '告警', company: '正芯农牧' },
    { id: 9, name: '肉鸡舍2', type: '鸡场', status: '正常', company: '正芯农牧' },
  ],
  aquatic: [
    { id: 10, name: '鱼塘1区', type: '水产', status: '正常', company: '正芯农牧' },
    { id: 11, name: '鱼塘2区', type: '水产', status: '正常', company: '正芯农牧' },
    { id: 12, name: '虾塘1区', type: '水产', status: '告警', company: '正芯农牧' },
  ]
}

const farmTypeNames = {
  pig: '猪场',
  chicken: '鸡场',
  aquatic: '水产'
}

// 处理厂点击事件
const handleFarmClick = (farmType: string, cityName: string) => {
  const farms = mockFarms[farmType as keyof typeof mockFarms] || []
  subMenuTitle.value = `${cityName} - ${farmTypeNames[farmType as keyof typeof farmTypeNames]}`
  subMenuFarms.value = farms.map(farm => ({
    ...farm,
    name: `${cityName}${farm.name}`  // 添加城市前缀
  }))
  showSubMenu.value = true
  
  // 隐藏 tooltip
  if (mapChart) {
    mapChart.dispatchAction({
      type: 'hideTip'
    })
  }
}

// 关闭子菜单
const closeSubMenu = () => {
  showSubMenu.value = false
}

// 跳转到厂详情
const goToFarmDetail = (farm: any) => {
  closeSubMenu()
  // 跳转到首页，并选中对应的工厂
  router.push({ path: '/', query: { farmId: farm.id, farmName: farm.name } })
}

const initMapChart = () => {
  if (!mapChartRef.value) return

  mapChart = echarts.init(mapChartRef.value)
  const option = createChinaMapOption()
  mapChart.setOption(option)

  // 地图点击事件 - 下钻到省级
  mapChart.on('click', (params: any) => {
    if (currentMapLevel.value === 'china') {
      const provinceName = params.name
      if (provinceName) {
        showProvinceMap(provinceName)
      }
    }
  })

  // 多次resize确保正确渲染
  setTimeout(() => mapChart?.resize(), 0)
  setTimeout(() => mapChart?.resize(), 100)
  setTimeout(() => mapChart?.resize(), 300)
}

// 显示省级地图
const showProvinceMap = (provinceName: string) => {
  if (!mapChart) return
  currentMapLevel.value = provinceName
  const option = createProvinceMapOption(provinceName)
  mapChart.setOption(option, true)
  setTimeout(() => mapChart?.resize(), 0)
}

// 返回全国地图
const backToChinaMap = () => {
  if (!mapChart) return
  currentMapLevel.value = 'china'
  const option = createChinaMapOption()
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

const iconComponents: any = {
  Warning,
  Plus,
  Delete,
  Edit,
  VideoCamera,
  Refresh,
  Download,
  Lightning,
  Connection,
  Operation,
  Share,
  CircleCheck,
  CircleClose,
  Sunny,
  Refrigerator,
  Cpu,
  Bell
}

const devices = ref([
  { name: '保温灯', count: 2340, color: '#e6a23c', icon: 'Sunny' },
  { name: '智能花洒', count: 1890, color: '#409eff', icon: 'Refrigerator' },
  { name: '环控器', count: 560, color: '#67c23a', icon: 'Operation' },
  { name: '智能网关', count: 120, color: '#909399', icon: 'Connection' },
  { name: '智能水表', count: 890, color: '#409eff', icon: 'Refrigerator' },
  { name: '智能电表', count: 1230, color: '#e6a23c', icon: 'Lightning' },
  { name: '在线', count: 5870, color: '#67c23a', icon: 'CircleCheck' },
  { name: '离线', count: 160, color: '#f56c6c', icon: 'CircleClose' }
])

const deviceList = devices.value.filter(d => d.name !== '在线' && d.name !== '离线')

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

  // 确保容器有尺寸
  const container = alarmChartRef.value

  // 检查容器尺寸 - 更可靠的检查方式
  const checkContainer = () => {
    const rect = container.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 &&
      container.offsetWidth > 0 &&
      container.offsetHeight > 0
  }

  if (!checkContainer()) {
    // 如果容器没有尺寸，多次尝试
    let retryCount = 0
    const retryInit = () => {
      if (retryCount >= 20) {
        console.error('图表容器无法获取尺寸')
        return
      }
      retryCount++
      setTimeout(() => {
        if (checkContainer()) {
          doInitChart()
        } else {
          retryInit()
        }
      }, 100)
    }
    retryInit()
    return
  }

  doInitChart()

  function doInitChart() {
    // 如果图表已存在，先销毁
    if (alarmChart) {
      alarmChart.dispose()
    }

    alarmChart = echarts.init(container, undefined, {
      renderer: 'canvas',
      useDirtyRect: false
    })

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

    // 确保图表正确渲染 - 多次 resize 确保生产环境也能显示
    setTimeout(() => alarmChart?.resize(), 0)
    setTimeout(() => alarmChart?.resize(), 100)
    setTimeout(() => alarmChart?.resize(), 300)

    // 图表点击事件
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
}

const goBack = () => {
  router.push('/')
}

const goToDeviceDetail = () => {
  router.push('/device-detail')
}

const goToMonitor = () => {
  router.push('/monitor-detail')
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
  mapChart?.resize()
}

onMounted(async () => {
  console.log('sdk', sdk)
  const companyList = await sdk.company.list()
  // const farmInfo =await sdk.factory.workshops(17629813863749)
  console.log('companyList', companyList)

    // 挂载全局事件处理函数
    ; (window as any).handleFarmClick = handleFarmClick

  nextTick(() => {
    setTimeout(() => initMapChart(), 50)
    setTimeout(() => initAlarmChart(), 150)
    setTimeout(() => {
      mapChart?.resize()
      alarmChart?.resize()
    }, 600)
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 移除全局事件处理函数
  delete (window as any).handleFarmClick
  alarmChart?.dispose()
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
}

.indicator-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.indicator-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.indicator-value {
  font-size: 18px;
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

.alarm-chart {
  width: 100%;
  flex: 1;
  min-height: 250px;
  height: 250px;
  min-width: 0;
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
  padding: 14px 16px;
  margin-bottom: 8px;
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

.farm-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}

.farm-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border-radius: 4px;
}

.info-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.info-status.status-normal {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.info-status.status-warning {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
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
