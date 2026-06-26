<template>
<div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Sunny /></el-icon> 环境数据</div>
          <span class="panel-meta">达标率 {{ envComplianceRate }}%</span>
        </div>
        <div class="env-compliance-row">
          <div class="env-compliance-item">
            <span class="label">温度达标</span>
            <el-progress :percentage="envRates.temp" :stroke-width="8" />
          </div>
          <div class="env-compliance-item">
            <span class="label">湿度达标</span>
            <el-progress :percentage="envRates.humidity" :stroke-width="8" />
          </div>
          <div class="env-compliance-item">
            <span class="label">气体达标</span>
            <el-progress :percentage="envRates.gas" :stroke-width="8" color="#67c23a" />
          </div>
          <div class="env-compliance-item">
            <span class="label">今日偏离累计</span>
            <span class="deviation-value">{{ envDeviationDuration }}</span>
          </div>
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
</template>
<script setup lang="ts">
import { inject, onMounted, ref, nextTick } from 'vue'
import { Sunny } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  envComplianceRate,
  envRates,
  envDeviationDuration,
  envIndicators,
  initEnvChart,
  observeChartContainers,
  resizeCharts,
} = ctx

const chartRef = ref<HTMLElement>()

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (chartRef.value) initEnvChart(chartRef.value)
      observeChartContainers()
      resizeCharts()
    }, 100)
  })
})
</script>
