<template>
<div class="env-summary-row">
          <div class="env-summary-card">
            <span class="env-summary-label">全厂环境达标率</span>
            <span class="env-summary-value">{{ envCompliance.overallRate }}%</span>
            <el-progress :percentage="envCompliance.overallRate" :stroke-width="6" :show-text="false" />
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">异常栏舍</span>
            <span class="env-summary-value warn">{{ envCompliance.abnormalBarnCount }} 个</span>
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">最差舍 / 偏离时长</span>
            <span class="env-summary-value">{{ envCompliance.worstBarn }} · {{ envCompliance.worstDuration }}</span>
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">未处理报警</span>
            <span class="env-summary-value alarm">{{ unprocessedAlarmCount }} 条</span>
          </div>
        </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { envCompliance, unprocessedAlarmCount } = ctx
</script>
