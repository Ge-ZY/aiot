<template>
<div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><DataLine /></el-icon> 生物数据</div>
        </div>

        <!-- 批次信息 -->
        <div class="batch-info-bar">
          <div class="batch-item"><span class="batch-label">批次号</span><span class="batch-value">{{ batchInfo.batchNo }}</span></div>
          <div class="batch-item"><span class="batch-label">进栏日期</span><span class="batch-value">{{ batchInfo.entryDate }}</span></div>
          <div class="batch-item"><span class="batch-label">日龄</span><span class="batch-value">{{ batchInfo.ageDays }} 天</span></div>
          <div class="batch-item"><span class="batch-label">初始 / 当前</span><span class="batch-value">{{ batchInfo.initialStock }} → {{ batchInfo.currentStock }}</span></div>
          <div v-if="batchInfo.targetWeight" class="batch-item"><span class="batch-label">目标</span><span class="batch-value">{{ batchInfo.targetWeight }}</span></div>
        </div>

        <div class="bio-kpi-grid">
          <div
            v-for="item in bioKpiItems"
            :key="item.key"
            class="kpi-card"
            :class="item.cardClass"
          >
            <div class="kpi-value" :class="item.valueClass">{{ item.value }}</div>
            <div class="kpi-label">{{ item.label }}</div>
          </div>
        </div>

        <div v-if="specialMetrics.length" class="special-section">
          <div class="special-title">{{ specialSectionTitle }}</div>
          <div class="special-grid">
            <div
              v-for="item in specialMetrics"
              :key="item.key"
              class="special-card"
              :class="item.cardClass"
            >
              <div class="special-value" :class="item.valueClass">{{ item.value }}</div>
              <div class="special-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="sub-chart-wrap">
          <div class="sub-chart-title">{{ bioChartTitle }}</div>
          <div ref="bioChartRef" class="sub-chart"></div>
        </div>
        <div class="sub-chart-wrap batch-chart-wrap">
          <div class="sub-chart-title">批次进栏至今 · 存栏 & 死淘趋势</div>
          <div ref="batchChartRef" class="sub-chart batch-chart"></div>
        </div>
      </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref, nextTick } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  batchInfo,
  bioKpiItems,
  specialMetrics,
  specialSectionTitle,
  bioChartTitle,
  initBioChart,
  initBatchChart,
  observeChartContainers,
  resizeCharts,
} = ctx

const bioChartRef = ref<HTMLElement>()
const batchChartRef = ref<HTMLElement>()

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (bioChartRef.value) initBioChart(bioChartRef.value)
      if (batchChartRef.value) initBatchChart(batchChartRef.value)
      observeChartContainers()
      resizeCharts()
    }, 100)
  })
})
</script>
