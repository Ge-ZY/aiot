<template>
<div class="panel today-briefing">
          <div class="panel-header-row">
            <div class="panel-title">今日生产看板</div>
            <span class="panel-meta">{{ todayDate }} · 晨会数据</span>
          </div>
          <div class="briefing-grid">
            <div v-for="item in todayBriefingItems" :key="item.key" class="briefing-card" :class="item.cardClass">
              <div class="briefing-value" :class="item.valueClass">{{ item.value }}</div>
              <div class="briefing-label">{{ item.label }}</div>
              <div v-if="item.change" class="briefing-change" :class="item.changeClass">{{ item.change }}</div>
            </div>
          </div>
        </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { todayDate, todayBriefingItems } = ctx
</script>
