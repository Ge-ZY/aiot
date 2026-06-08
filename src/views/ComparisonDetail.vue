<template>
  <LayoutWithSidebar v-slot="{ currentFactory }">
    <div class="comparison-content">
      <div class="content-header">
        <div class="header-left">
          <h2>{{ currentFactory || '全平台' }} - 数据对比</h2>
          <el-tag type="info" size="small">区域分析</el-tag>
        </div>
        <div class="header-right">
          <el-radio-group v-model="selectedFactoryType" size="small">
            <el-radio-button v-for="t in factoryTypes" :key="t.value" :label="t.value">
              {{ t.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 概览 KPI -->
      <div class="kpi-row">
        <div v-for="item in kpiItems" :key="item.key" class="kpi-card">
          <div class="kpi-value" :class="item.valueClass">{{ item.value }}</div>
          <div class="kpi-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- 区域工厂数 + 存栏 TOP5 -->
      <div class="section-row">
        <div class="panel chart-panel">
          <div class="panel-header">
            <h3>区域工厂数量</h3>
            <span class="panel-sub">华东、华北、华南等七大区域</span>
          </div>
          <div ref="regionChartRef" class="chart-box"></div>
        </div>

        <div class="panel table-panel">
          <div class="panel-header">
            <h3>存栏 TOP5 省份</h3>
            <span class="panel-sub">按存栏总量排行</span>
          </div>
          <el-table :data="topStockProvinces" stripe size="small">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="province" label="省份" width="80" />
            <el-table-column prop="region" label="区域" width="70" />
            <el-table-column label="存栏量" min-width="100">
              <template #default="{ row }">
                <span class="stock-value">{{ formatStock(row.stock) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="farmCount" label="工厂数" width="70" align="center" />
            <el-table-column label="占比" width="80" align="center">
              <template #default="{ row }">
                {{ stockPercent(row.stock) }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 报警 TOP5 + 场类型分布 -->
      <div class="section-row">
        <div class="panel chart-panel">
          <div class="panel-header">
            <h3>报警 TOP5 省份</h3>
            <span class="panel-sub">当前未处理报警较多省份</span>
          </div>
          <div ref="alarmChartRef" class="chart-box"></div>
        </div>

        <div class="panel chart-panel">
          <div class="panel-header">
            <h3>工厂类型分布</h3>
            <span class="panel-sub">猪 / 鸡 / 水产场数量</span>
          </div>
          <div ref="typeChartRef" class="chart-box"></div>
        </div>
      </div>

      <!-- 区域综合对比表 -->
      <div class="panel full-panel">
        <div class="panel-header">
          <h3>区域综合对比</h3>
          <span class="panel-sub">工厂数、存栏、报警、设备在线率</span>
        </div>
        <el-table :data="regionStats" stripe size="small">
          <el-table-column prop="region" label="区域" width="90" />
          <el-table-column prop="farmCount" label="工厂数" width="90" align="center" />
          <el-table-column label="存栏总量" min-width="120">
            <template #default="{ row }">{{ formatStock(row.stock) }}</template>
          </el-table-column>
          <el-table-column prop="alarmCount" label="报警数" width="90" align="center">
            <template #default="{ row }">
              <span :class="{ 'text-alarm': row.alarmCount >= 8 }">{{ row.alarmCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="设备在线率" width="120" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="row.avgOnlineRate"
                :stroke-width="8"
                :color="row.avgOnlineRate >= 95 ? '#67c23a' : row.avgOnlineRate >= 90 ? '#409eff' : '#e6a23c'"
              />
            </template>
          </el-table-column>
          <el-table-column label="场均存栏" min-width="110" align="center">
            <template #default="{ row }">
              {{ row.farmCount ? formatStock(Math.round(row.stock / row.farmCount)) : '—' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 省份明细 -->
      <div class="panel full-panel">
        <div class="panel-header">
          <h3>省份明细对比</h3>
          <el-input v-model="provinceFilter" placeholder="搜索省份" clearable size="small" style="width: 160px;" />
        </div>
        <el-table :data="filteredProvinces" stripe size="small">
          <el-table-column prop="province" label="省份" width="90" />
          <el-table-column prop="region" label="区域" width="80" />
          <el-table-column prop="farmCount" label="工厂数" width="80" align="center" />
          <el-table-column label="存栏" min-width="100">
            <template #default="{ row }">{{ formatStock(row.stock) }}</template>
          </el-table-column>
          <el-table-column prop="alarmCount" label="报警" width="70" align="center" />
          <el-table-column label="在线率" width="90" align="center">
            <template #default="{ row }">{{ row.deviceOnlineRate }}%</template>
          </el-table-column>
          <el-table-column prop="pigFarms" label="猪场" width="70" align="center" />
          <el-table-column prop="chickenFarms" label="鸡场" width="70" align="center" />
          <el-table-column prop="aquaticFarms" label="水产" width="70" align="center" />
        </el-table>
      </div>
    </div>
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'
import { useCompanyTree } from '@/composables/useCompanyTree'
import {
  getProvinceStats,
  getRegionStats,
  getTopProvincesByStock,
  getTopProvincesByAlarm,
  getFactoryTypeTotals,
  formatStock,
  regionOrder,
} from '@/utils/comparisonMockData'

const { selectedFactoryType, factoryTypes } = useCompanyTree()

const provinceFilter = ref('')
const regionChartRef = ref<HTMLElement>()
const alarmChartRef = ref<HTMLElement>()
const typeChartRef = ref<HTMLElement>()

let regionChart: echarts.ECharts | null = null
let alarmChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null

const provinceStats = computed(() => getProvinceStats(selectedFactoryType.value))
const regionStats = computed(() => getRegionStats(provinceStats.value))
const topStockProvinces = computed(() => getTopProvincesByStock(provinceStats.value))
const topAlarmProvinces = computed(() => getTopProvincesByAlarm(provinceStats.value))
const typeTotals = computed(() => getFactoryTypeTotals(provinceStats.value))

const totalStock = computed(() => provinceStats.value.reduce((s, p) => s + p.stock, 0))
const totalFarms = computed(() => provinceStats.value.reduce((s, p) => s + p.farmCount, 0))
const totalAlarms = computed(() => provinceStats.value.reduce((s, p) => s + p.alarmCount, 0))
const avgOnlineRate = computed(() => {
  const list = provinceStats.value
  if (!list.length) return 0
  return Math.round(list.reduce((s, p) => s + p.deviceOnlineRate, 0) / list.length * 10) / 10
})

const kpiItems = computed(() => [
  { key: 'farms', label: '工厂总数', value: totalFarms.value, valueClass: '' },
  { key: 'stock', label: '存栏总量', value: formatStock(totalStock.value), valueClass: '' },
  { key: 'alarm', label: '报警总数', value: totalAlarms.value, valueClass: 'alarm' },
  { key: 'online', label: '平均在线率', value: `${avgOnlineRate.value}%`, valueClass: 'success' },
  { key: 'region', label: '覆盖区域', value: regionOrder.length, valueClass: '' },
])

const filteredProvinces = computed(() => {
  const kw = provinceFilter.value.trim()
  if (!kw) return provinceStats.value
  return provinceStats.value.filter(p => p.province.includes(kw) || p.region.includes(kw))
})

const stockPercent = (stock: number) => {
  const total = totalStock.value || 1
  return Math.round((stock / total) * 1000) / 10
}

const lightChart = {
  tooltip: { trigger: 'axis' as const },
  grid: { left: '3%', right: '4%', bottom: '8%', top: '12%', containLabel: true },
  axisLabel: { color: '#909399', fontSize: 11 },
  splitLine: { lineStyle: { color: '#ebeef5' } },
}

const initRegionChart = () => {
  if (!regionChartRef.value) return
  regionChart?.dispose()
  regionChart = echarts.init(regionChartRef.value)
  const data = regionStats.value
  const option: EChartsOption = {
    tooltip: { ...lightChart.tooltip, axisPointer: { type: 'shadow' } },
    grid: lightChart.grid,
    xAxis: {
      type: 'category',
      data: data.map(d => d.region),
      axisLabel: lightChart.axisLabel,
    },
    yAxis: {
      type: 'value',
      name: '工厂数',
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLabel: lightChart.axisLabel,
      splitLine: lightChart.splitLine,
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.farmCount),
      barMaxWidth: 36,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#606266',
        fontSize: 11,
      },
    }],
  }
  regionChart.setOption(option)
}

const initAlarmChart = () => {
  if (!alarmChartRef.value) return
  alarmChart?.dispose()
  alarmChart = echarts.init(alarmChartRef.value)
  const data = [...topAlarmProvinces.value].reverse()
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: lightChart.axisLabel,
      splitLine: lightChart.splitLine,
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.province),
      axisLabel: lightChart.axisLabel,
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.alarmCount),
      barMaxWidth: 20,
      itemStyle: { color: '#f56c6c', borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: '#f56c6c', fontSize: 11 },
    }],
  }
  alarmChart.setOption(option)
}

const initTypeChart = () => {
  if (!typeChartRef.value) return
  typeChart?.dispose()
  typeChart = echarts.init(typeChartRef.value)
  const t = typeTotals.value
  const option: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 家 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#606266', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { color: '#606266', fontSize: 12 },
      data: [
        { name: '猪场', value: t.pig, itemStyle: { color: '#409eff' } },
        { name: '鸡场', value: t.chicken, itemStyle: { color: '#e6a23c' } },
        { name: '水产场', value: t.aquatic, itemStyle: { color: '#67c23a' } },
        { name: '饲料厂', value: t.feed, itemStyle: { color: '#52c41a' } },
      ],
    }],
  }
  typeChart.setOption(option)
}

const initCharts = async () => {
  await nextTick()
  initRegionChart()
  initAlarmChart()
  initTypeChart()
}

const handleResize = () => {
  regionChart?.resize()
  alarmChart?.resize()
  typeChart?.resize()
}

watch(selectedFactoryType, () => initCharts())

onMounted(() => {
  setTimeout(initCharts, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  regionChart?.dispose()
  alarmChart?.dispose()
  typeChart?.dispose()
})
</script>

<style scoped>
.comparison-content {
  padding-bottom: 24px;
}

.content-header {
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
  gap: 10px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 12px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;
}

.kpi-value.alarm { color: #f56c6c; }
.kpi-value.success { color: #67c23a; }

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.section-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.full-panel {
  margin-bottom: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-sub {
  font-size: 12px;
  color: #909399;
}

.chart-box {
  width: 100%;
  height: 280px;
}

.stock-value {
  font-weight: 600;
  color: #409eff;
}

.text-alarm {
  color: #f56c6c;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }

  .section-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
