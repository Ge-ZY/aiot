<template>
<div class="panel energy-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Odometer /></el-icon> 能耗监测</div>
        </div>

        <!-- 1. 能耗统计 -->
        <div class="bio-block">
          <div class="bio-block-title">能耗统计</div>
          <div class="energy-stat-grid">
            <div v-for="stat in energyMonitoring.stats" :key="stat.key" class="energy-stat-card">
              <div class="energy-stat-top">
                <span class="energy-stat-label">{{ stat.label }}</span>
                <span class="energy-stat-change" :class="stat.changePercent >= 0 ? 'up' : 'down'">
                  {{ stat.changePercent >= 0 ? '+' : '' }}{{ stat.changePercent }}%
                </span>
              </div>
              <div class="energy-stat-value">{{ stat.todayValue }} <span class="unit">{{ stat.unit }}</span></div>
              <div class="energy-quota-row">
                <span class="quota-text">定额 {{ stat.quota }} {{ stat.unit }}</span>
                <span class="quota-rate" :class="{ warn: energyUsageRate(stat) >= 85 }">{{ energyUsageRate(stat) }}%</span>
              </div>
              <el-progress
                :percentage="energyUsageRate(stat)"
                :stroke-width="6"
                :show-text="false"
                :color="energyUsageRate(stat) >= 90 ? '#f56c6c' : energyUsageRate(stat) >= 75 ? '#e6a23c' : '#409eff'"
              />
            </div>
          </div>
        </div>

        <!-- 2. 能耗报警 -->
        <div class="bio-block">
          <div class="bio-block-title">能耗报警</div>
          <div v-if="energyMonitoring.alarms.length" class="bio-alarm-list">
            <div v-for="alarm in energyMonitoring.alarms" :key="alarm.id" class="bio-alarm-item energy-alarm">
              <div class="bio-alarm-top">
                <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                <el-tag size="small" :type="alarm.alarmType === '超定额' ? 'danger' : 'warning'">{{ alarm.alarmType }}</el-tag>
                <span class="bio-alarm-disease">{{ alarm.energyType }}</span>
                <span class="intake-alarm-time">{{ alarm.time }}</span>
              </div>
              <div class="bio-alarm-desc">{{ alarm.description }}</div>
              <div class="energy-alarm-threshold">
                当前 {{ alarm.currentValue }} · 阈值 {{ alarm.threshold }}
              </div>
            </div>
          </div>
          <div v-else class="bp-empty-hint">暂无能耗报警</div>
        </div>

        <!-- 3. 排污与环保指标 -->
        <div class="bio-block">
          <div class="bio-block-title">排污与环保指标</div>
          <el-table :data="energyMonitoring.pollutionIndicators" size="small" stripe class="bio-table">
            <el-table-column prop="name" label="指标" min-width="130" />
            <el-table-column prop="value" label="当前值" width="110" />
            <el-table-column prop="standard" label="标准" width="120" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="pollutionStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { Odometer } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const { energyMonitoring, pollutionStatusTagType, energyUsageRate } = ctx
</script>
