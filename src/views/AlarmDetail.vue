<template>
  <div class="home-container">
    <div class="sidebar">
      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h4>公司列表</h4>
            <el-input v-model="filterText" placeholder="输入关键字过滤" size="small" style="width: 150px" clearable />
          </div>
        </template>
        <el-tree :data="companies" node-key="id" :props="{
          label: 'name',
          value: 'id',
          children: 'children'
        }" @node-click="handleNodeClick" highlight-current
          :expand-on-click-node="false" :filter-node-method="filterNode" ref="companyTree">
        </el-tree>
      </el-card>
    </div>
    <div class="main-content">
      <div class="content-header">
        <div class="header-left">
          <h2>{{ currentFactory || '请选择工厂' }} - 报警详情</h2>
        </div>
        <div class="header-right">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
            style="width: 200px;"
          />
        </div>
      </div>

      <div class="top-section">
        <div class="panel stats-panel">
          <div class="panel-header">
            <h3>报警统计</h3>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <div class="stat-label">当前日期</div>
              <div class="stat-value">{{ selectedDate }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">报警数量</div>
              <div class="stat-value">{{ alarmCount }}</div>
            </div>
          </div>
        </div>

        <div class="panel chart-panel">
          <div class="panel-header">
            <h3>栏舍报警趋势</h3>
          </div>
          <div ref="chartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>报警列表</h3>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchText"
              placeholder="搜索报警"
              style="width: 250px; margin-right: 10px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
            <el-button :icon="Download" @click="exportExcel" type="primary">导出</el-button>
          </div>
        </div>
        <div class="table-container">
          <el-table :data="filteredList" stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="barn" label="栏舍" width="120" />
            <el-table-column prop="function" label="功能" width="150" />
            <el-table-column prop="description" label="描述" min-width="300">
              <template #default="{ row }">
                <div :title="row.description" class="description-cell">
                  {{ row.description }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import type { EChartsOption } from 'echarts'
import { sdk } from '@/utils/sdk'

interface AlarmItem {
  id: number
  date: string
  barn: string
  function: string
  description: string
}

const route = useRoute()
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const companies = ref<any[]>([])
const filterText = ref('')
const companyTree = ref()

const currentNodeData = ref<any>(null)
const lastLeafNode = ref<any>(null)
const currentFactory = ref('')

const selectedDate = ref<string>(
  (route.query.date as string) || new Date().toISOString().split('T')[0]
)
const searchText = ref('')

// 生成近30天模拟报警数据
const generateAlarmData = (): AlarmItem[] => {
  const allAlarms: AlarmItem[] = []
  const barns = ['保育舍1', '保育舍2', '分娩舍1', '分娩舍2']
  const functions = ['温度监控', '湿度监控', '通风系统', '饮水监控', '氨气检测', '设备状态', 'CO2检测', '光照监控']
  const descriptions = [
    '温度超过阈值，当前温度{temp}°C，上限26°C，请注意降温',
    '湿度过高，当前{humidity}%，建议通风',
    '通风风机异常停机，请检查设备状态',
    '饮水流量异常，可能管道堵塞',
    '氨气浓度超标，当前{ppm}ppm，建议加强通风',
    '保温灯故障，位置{position}号栏位',
    'CO2浓度超标，请检查通风',
    '光照强度不足，请检查照明设备'
  ]

  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const alarmCount = Math.floor(Math.random() * 8) + 1

    for (let j = 0; j < alarmCount; j++) {
      const barnIndex = Math.floor(Math.random() * barns.length)
      const funcIndex = Math.floor(Math.random() * functions.length)
      let description = descriptions[funcIndex]
      
      if (description.includes('{temp}')) {
        description = description.replace('{temp}', (25 + Math.random() * 10).toFixed(1))
      }
      if (description.includes('{humidity}')) {
        description = description.replace('{humidity}', String(Math.floor(70 + Math.random() * 20)))
      }
      if (description.includes('{ppm}')) {
        description = description.replace('{ppm}', String(Math.floor(15 + Math.random() * 20)))
      }
      if (description.includes('{position}')) {
        description = description.replace('{position}', String(Math.floor(Math.random() * 10) + 1))
      }

      allAlarms.push({
        id: allAlarms.length + 1,
        date: dateStr,
        barn: barns[barnIndex],
        function: functions[funcIndex],
        description: description
      })
    }
  }
  return allAlarms
}

const allAlarmData = generateAlarmData()

const filteredList = computed(() => {
  let list = allAlarmData.filter(item => item.date === selectedDate.value)
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    list = list.filter(item =>
      item.barn.toLowerCase().includes(text) ||
      item.function.toLowerCase().includes(text) ||
      item.description.toLowerCase().includes(text)
    )
  }
  return list
})

const handleDateChange = () => {
  // 日期变化时自动更新数据
  ElMessage.success('已切换至' + selectedDate.value)
}

const handleNodeClick = async (data: any) => {
  currentNodeData.value = data
  if (data.children.length === 0) {
    refreshNodeData()
  }

  const isLeafNode = !data.children || data.children.length === 0
  
  if (isLeafNode) {
    lastLeafNode.value = data
    currentFactory.value = data.name
    console.log('点击叶子节点，:', data)
  } else {
    if (lastLeafNode.value) {
      currentFactory.value = lastLeafNode.value.name
    }
  }
}

async function refreshNodeData() {
  if (!currentNodeData.value) return
  
  try {
    const res = await sdk.company.treenode(currentNodeData.value.id)
    if (res.data && res.data.data) {
      currentNodeData.value.children = res.data.data.map((child: any) => ({
        ...child,
        children: []
      }))
      companyTree.value?.updateKeyChildren(currentNodeData.value.id, currentNodeData.value.children)
    }
  } catch (err) {
    console.error('Failed to refresh node data:', err)
  }
}

async function loadCompanys() {
  try {
    const res = await sdk.company.treenode()
    if (res.data && res.data.data) {
      companies.value = res.data.data.map((group: any) => ({
        ...group,
        children: []
      }))
    }
  } catch (err) {
    console.error('Failed to load groups:', err)
  }
}

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.name.includes(value) || data.code.includes(value)
}

watch(filterText, (val) => {
  companyTree.value?.filter(val)
})

const alarmCount = computed(() => filteredList.value.length)

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

const initChart = () => {
  if (!chartRef.value) return
  
  // 确保容器有尺寸
  const container = chartRef.value
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    setTimeout(() => initChart(), 50)
    return
  }
  
  chart = echarts.init(container)
  const { dates, values } = generateLast30Days()
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: 15,
      right: 20,
      bottom: 10,
      top: 30,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        interval: 4,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '报警数量',
      nameTextStyle: {
        fontSize: 14,
        padding: [0, 0, 0, 10]
      },
      axisLabel: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '报警数量',
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 确保图表正确渲染
  chart.resize()
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const exportExcel = () => {
  try {
    const data = filteredList.value.map((item, index) => ({
      '序号': index + 1,
      '日期': item.date,
      '栏舍': item.barn,
      '功能': item.function,
      '描述': item.description
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '报警列表')
    
    const fileName = `报警列表_${selectedDate.value}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleResize = () => {
  chart?.resize()
}

onMounted(async () => {
  await loadCompanys()
  nextTick(() => {
    setTimeout(() => {
      initChart()
    }, 100)
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  overflow: auto;
  border-right: 1px solid #e6e6e6;
}

.sidebar :deep(.el-tree) {
  background: transparent;
}

.sidebar :deep(.el-tree-node__content) {
  height: 36px;
}

.sidebar :deep(.el-tree-node__content:hover) {
  background-color: #f0f7ff;
}

.sidebar :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
  color: #1890ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  margin: 0;
  color: #333;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stats-panel {
  display: flex;
  flex-direction: column;
}

.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.chart-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  height: 100%;
  width: 100%;
  min-width: 0;
}

.list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.description-cell {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
