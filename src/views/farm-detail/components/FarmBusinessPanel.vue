<template>
<div class="panel business-panel">
          <div class="panel-header-row">
            <div class="panel-title">经营效益</div>
            <span class="panel-meta">本月累计 · 截至 {{ todayDate }}</span>
          </div>

          <!-- 经营总览 -->
          <div class="business-section">
            <div class="business-section-title">经营总览</div>
            <div class="business-overview-grid">
              <div
                v-for="item in businessOverviewItems"
                :key="item.key"
                class="business-overview-card"
              >
                <div class="business-overview-value">
                  {{ item.value }}<span class="unit">{{ item.unit }}</span>
                </div>
                <div class="business-overview-label">{{ item.label }}</div>
                <div v-if="item.change" class="business-overview-change" :class="item.changeUp ? 'up' : 'down'">
                  {{ item.change }}
                </div>
              </div>
            </div>
          </div>

          <!-- 成本分析 -->
          <div class="business-section">
            <div class="business-section-header">
              <div class="business-section-title">成本分析</div>
              <div class="business-section-meta">
                总成本 {{ businessBenefit.costAnalysis.totalCost }} {{ businessBenefit.costAnalysis.totalUnit }}
                · {{ businessBenefit.costAnalysis.unitCostLabel }}
                {{ businessBenefit.costAnalysis.unitCost }} 元
              </div>
            </div>
            <el-table :data="businessBenefit.costAnalysis.items" size="small" stripe class="business-table">
              <el-table-column prop="name" label="成本项" min-width="120" />
              <el-table-column label="金额（万元）" width="120">
                <template #default="{ row }">{{ row.amount }}</template>
              </el-table-column>
              <el-table-column label="占比" width="100">
                <template #default="{ row }">{{ row.ratio }}%</template>
              </el-table-column>
              <el-table-column label="较上月" width="100">
                <template #default="{ row }">
                  <span :class="row.changePercent > 0 ? 'change-up' : row.changePercent < 0 ? 'change-down' : ''">
                    {{ row.changePercent > 0 ? '+' : '' }}{{ row.changePercent }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 销售业绩 -->
          <div class="business-section">
            <div class="business-section-title">销售业绩</div>
            <div class="sales-kpi-row">
              <div class="sales-kpi-card">
                <div class="sales-kpi-value">{{ businessBenefit.salesPerformance.volume }}</div>
                <div class="sales-kpi-label">
                  {{ businessBenefit.salesPerformance.volumeLabel }}（{{ businessBenefit.salesPerformance.volumeUnit }}）
                </div>
                <div class="sales-kpi-change" :class="businessBenefit.salesPerformance.volumeChange >= 0 ? 'up' : 'down'">
                  较上月 {{ businessBenefit.salesPerformance.volumeChange >= 0 ? '+' : '' }}{{ businessBenefit.salesPerformance.volumeChange }}%
                </div>
              </div>
              <div class="sales-kpi-card primary">
                <div class="sales-kpi-value">{{ businessBenefit.salesPerformance.revenue }}</div>
                <div class="sales-kpi-label">销售额（{{ businessBenefit.salesPerformance.revenueUnit }}）</div>
                <div class="sales-kpi-change" :class="businessBenefit.salesPerformance.revenueChange >= 0 ? 'up' : 'down'">
                  较上月 {{ businessBenefit.salesPerformance.revenueChange >= 0 ? '+' : '' }}{{ businessBenefit.salesPerformance.revenueChange }}%
                </div>
              </div>
            </div>
            <el-table :data="businessBenefit.salesPerformance.details" size="small" stripe class="business-table">
              <el-table-column prop="product" label="品类" min-width="140" />
              <el-table-column prop="volume" label="销量" width="140" />
              <el-table-column prop="revenue" label="销售额" width="140" />
            </el-table>
          </div>
        </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { todayDate, businessOverviewItems, businessBenefit } = ctx
</script>
