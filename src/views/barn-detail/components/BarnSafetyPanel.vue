<template>
<div class="panel safety-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Warning /></el-icon> 生产安全</div>
        </div>

        <!-- 1. 超限报警 -->
        <div class="bio-block">
          <div class="bio-block-title">超限报警</div>
          <div v-for="cat in overlimitCategories" :key="cat.key" class="safety-sub-block">
            <div class="bio-block-title sub">{{ cat.label }}</div>
            <el-table
              v-if="overlimitAlarmsByCategory(cat.key).length"
              :data="overlimitAlarmsByCategory(cat.key)"
              size="small"
              stripe
              class="bio-table"
            >
              <el-table-column prop="time" label="时间" width="90" />
              <el-table-column prop="indicator" label="指标" width="100" />
              <el-table-column prop="currentValue" label="当前值" width="100" />
              <el-table-column prop="limitValue" label="限值" width="100" />
              <el-table-column prop="level" label="等级" width="80">
                <template #default="{ row }">
                  <span class="intake-alarm-level" :class="`level-${row.level}`">{{ row.level }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" min-width="160" />
            </el-table>
            <div v-else class="bp-empty-hint">暂无{{ cat.label }}</div>
          </div>
        </div>

        <!-- 2. 突发事件与处置 -->
        <div class="bio-block">
          <div class="bio-block-title">突发事件与处置</div>
          <el-table :data="productionSafety.emergencyEvents" size="small" stripe class="bio-table">
            <el-table-column prop="time" label="时间" width="140" />
            <el-table-column prop="eventType" label="事件类型" width="110" />
            <el-table-column prop="location" label="位置" min-width="120" />
            <el-table-column prop="level" label="等级" width="80">
              <template #default="{ row }">
                <span class="intake-alarm-level" :class="`level-${row.level}`">{{ row.level }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="handleStatus" label="处置情况" width="90">
              <template #default="{ row }">
                <el-tag :type="emergencyHandleStatusTag(row.handleStatus)" size="small">{{ row.handleStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handleDetail" label="处置详情" min-width="180" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 3. 应急资源管理 -->
        <div class="bio-block">
          <div class="bio-block-title">应急资源管理</div>

          <div class="safety-sub-block">
            <div class="bio-block-title sub">消防设备</div>
            <el-table :data="fireEmergencyResources" size="small" stripe class="bio-table">
              <el-table-column prop="name" label="名称" min-width="130" />
              <el-table-column prop="location" label="位置" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="90" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="emergencyResourceStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastCheck" label="最近检查" width="110" />
            </el-table>
          </div>

          <div class="safety-sub-block">
            <div class="bio-block-title sub">应急物资</div>
            <el-table :data="supplyEmergencyResources" size="small" stripe class="bio-table">
              <el-table-column prop="name" label="名称" min-width="130" />
              <el-table-column prop="location" label="位置" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="90" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="emergencyResourceStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastCheck" label="最近检查" width="110" />
            </el-table>
          </div>
        </div>
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  overlimitCategories,
  overlimitAlarmsByCategory,
  productionSafety,
  fireEmergencyResources,
  supplyEmergencyResources,
  emergencyHandleStatusTag,
  emergencyResourceStatusTag,
} = ctx
</script>
