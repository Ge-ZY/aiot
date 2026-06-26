<template>
<div class="middle-section">
          <div v-if="can(PERMISSION.MODULE_DATA_MONITOR)" class="panel chart-panel">
            <div class="panel-header-row">
              <div class="panel-title">数据监测</div>
              <div class="panel-actions">
                <el-select v-model="selectedBarnFilter" placeholder="全部舍" size="small" style="width: 120px; margin-right: 8px;" clearable>
                  <el-option label="全厂均值" value="" />
                  <el-option v-for="b in barnList" :key="b.id" :label="displayBarnName(b.name)" :value="b.id" />
                </el-select>
                <el-select v-if="selectedFactoryType === 'chicken'" v-model="chickenType" placeholder="品种" size="small" style="width: 100px;">
                  <el-option label="肉鸡" value="broiler" />
                  <el-option label="蛋鸡" value="layer" />
                </el-select>
                <el-select v-if="selectedFactoryType === 'aquatic'" v-model="aquaticType" placeholder="品种" size="small" style="width: 100px;">
                  <el-option label="鱼" value="fish" />
                  <el-option label="虾" value="shrimp" />
                </el-select>
              </div>
            </div>
            <div ref="chartRef" class="chart-container"></div>
          </div>

          <div v-if="can(PERMISSION.ALARM_READ)" class="panel alarm-panel">
            <div class="panel-header-row">
              <div class="panel-title">本厂报警</div>
              <span class="alarm-badge">{{ filteredAlarms.length }} 条</span>
            </div>
            <div class="alarm-list">
              <div v-if="filteredAlarms.length === 0" class="alarm-empty">暂无报警</div>
              <div
                v-for="alarm in filteredAlarms"
                :key="alarm.id"
                class="alarm-item"
                @click="goToBarnDetailFromAlarm(alarm)"
              >
                <div class="alarm-item-top">
                  <span class="alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                  <el-tag :type="alarmHandleTagType(alarm.handleStatus)" size="small">{{ alarm.handleStatus }}</el-tag>
                  <span class="alarm-time">{{ alarm.time }}</span>
                </div>
                <div class="alarm-barn">{{ displayBarnName(alarm.barnName) }}</div>
                <div class="alarm-desc">{{ alarm.type }}：{{ alarm.description }}</div>
                <div class="alarm-workflow">
                  <span>负责人：{{ alarm.assignee }}</span>
                  <span v-if="alarm.duration !== '—'">持续 {{ alarm.duration }}</span>
                  <span v-if="alarm.respondedAt">响应 {{ alarm.respondedAt }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref, nextTick } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { can, PERMISSION } = usePermission()
const {
  selectedBarnFilter,
  selectedFactoryType,
  chickenType,
  aquaticType,
  barnList,
  displayBarnName,
  filteredAlarms,
  alarmHandleTagType,
  goToBarnDetailFromAlarm,
  initChart,
  observeChartContainers,
  resizeCharts,
  hasFactory,
} = ctx

const chartRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (hasFactory.value && chartRef.value) {
        initChart(chartRef.value)
        observeChartContainers()
        resizeCharts()
      }
    }, 100)
  })
})
</script>
