<template>
<div class="barn-section">
          <div class="section-title">
            {{ barnSectionTitle }}
            <span class="section-sub">{{ filteredBarnList.length }} 个</span>
          </div>
          <div class="barn-grid">
            <div
              v-for="barn in filteredBarnList"
              :key="barn.id"
              class="panel barn-panel"
              :class="{ alarm: barn.status === '告警' }"
              @click="goToBarnDetail(barn)"
            >
              <div class="barn-header">
                <div class="barn-title">
                  <span class="barn-name">{{ displayBarnName(barn.name) }}</span>
                  <el-tag :type="barn.status === '正常' ? 'success' : 'danger'" size="small">
                    {{ barn.status }}
                  </el-tag>
                </div>
                <el-icon class="barn-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="barn-metrics">
                <div class="barn-stat">
                  <span class="label">{{ bioLabel }}</span>
                  <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.oxygen : barn.stock }}</span>
                </div>
                <div class="barn-stat">
                  <span class="label">温度</span>
                  <span class="value">{{ barn.temp }}°C</span>
                </div>
                <div class="barn-stat">
                  <span class="label">湿度</span>
                  <span class="value">{{ barn.humidity }}%</span>
                </div>
                <div class="barn-stat">
                  <span class="label">{{ envLabel4 }}</span>
                  <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.ph : barn.ventilation }}{{ selectedFactoryType === 'aquatic' ? '' : '%' }}</span>
                </div>
              </div>
              <div class="barn-footer">
                <span class="device-info">
                  设备 {{ barn.deviceOnline }}/{{ barn.deviceTotal }}
                </span>
                <span v-if="barn.alarmCount > 0" class="alarm-count">{{ barn.alarmCount }} 条报警</span>
              </div>
            </div>
          </div>
        </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const {
  barnSectionTitle,
  filteredBarnList,
  displayBarnName,
  selectedFactoryType,
  bioLabel,
  envLabel4,
  goToBarnDetail,
} = ctx
</script>
