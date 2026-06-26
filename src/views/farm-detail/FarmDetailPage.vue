<template>
  <LayoutWithSidebar>
    <div class="farm-detail-content">
      <div class="content-header">
        <div class="header-main">
          <h2>{{ currentFactory || '请选择工厂' }}</h2>
          <el-tag v-if="hasFactory" type="info" size="small">{{ factoryTypeLabel }}</el-tag>
          <el-tag v-if="hasFactory" :type="factoryStatusTag.type" size="small">{{ factoryStatusTag.text }}</el-tag>
        </div>
        <div class="header-actions">
          <el-radio-group v-model="selectedFactoryType" size="small" class="type-filter">
            <el-radio-button v-for="t in factoryTypes" :key="t.value" :label="t.value">
              {{ t.label }}
            </el-radio-button>
          </el-radio-group>
          <template v-if="hasFactory">
            <el-button v-if="can(PERMISSION.MENU_DASHBOARD)" size="small" @click="goToDashboard">监控大屏</el-button>
            <el-button v-if="can(PERMISSION.MENU_ALARM)" size="small" @click="goToAlarmDetail">报警详情</el-button>
            <el-button v-if="can(PERMISSION.MENU_DEVICE)" size="small" @click="goToDeviceDetail">设备详情</el-button>
          </template>
        </div>
      </div>

      <div v-if="!hasFactory" class="empty-state">
        <div class="skeleton-layout">
          <el-skeleton animated>
            <template #template>
              <div class="sk-kpi-row">
                <el-skeleton-item v-for="i in 6" :key="i" variant="rect" class="sk-kpi" />
              </div>
              <div class="sk-body-row">
                <el-skeleton-item variant="rect" class="sk-chart" />
                <el-skeleton-item variant="rect" class="sk-alarm" />
              </div>
              <div class="sk-barn-row">
                <el-skeleton-item v-for="i in 4" :key="i" variant="rect" class="sk-barn" />
              </div>
            </template>
          </el-skeleton>
        </div>
        <div class="empty-hint">
          <el-icon :size="48" color="#c0c4cc"><OfficeBuilding /></el-icon>
          <p class="empty-title">请选择工厂</p>
          <p class="empty-desc">从左侧组织树选择{{ factoryTypeLabel }}，或使用上方按钮切换场类型</p>
        </div>
      </div>

      <template v-else>
        <FarmTodayBriefing v-if="can(PERMISSION.MODULE_TODAY_BOARD)" />
        <FarmEnvSummary v-if="can(PERMISSION.MODULE_ENV_SUMMARY)" />
        <div class="kpi-row">
          <div
            v-for="item in kpiItems"
            :key="item.key"
            class="kpi-card"
            :class="{ active: activeKpiFilter === item.key }"
            @click="selectKpiFilter(item.key)"
          >
            <div class="kpi-value" :class="item.valueClass">{{ factoryKpi[item.valueKey] }}</div>
            <div class="kpi-label">{{ item.label }}</div>
          </div>
        </div>
        <FarmBusinessPanel v-if="can(PERMISSION.MODULE_BUSINESS)" />
        <FarmMiddleSection />
        <FarmCameraSection v-if="can(PERMISSION.MONITOR_VIEW)" />
        <FarmOrderPanel v-if="can(PERMISSION.MODULE_ORDER)" />
        <FarmBarnGrid />
      </template>
    </div>
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { OfficeBuilding } from '@element-plus/icons-vue'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'
import { useFarmDetail } from './useFarmDetail'
import { FARM_DETAIL_KEY } from './farmDetailContext'
import FarmTodayBriefing from './components/FarmTodayBriefing.vue'
import FarmEnvSummary from './components/FarmEnvSummary.vue'
import FarmBusinessPanel from './components/FarmBusinessPanel.vue'
import FarmMiddleSection from './components/FarmMiddleSection.vue'
import FarmCameraSection from './components/FarmCameraSection.vue'
import FarmOrderPanel from './components/FarmOrderPanel.vue'
import FarmBarnGrid from './components/FarmBarnGrid.vue'

const farmDetail = useFarmDetail()
provide(FARM_DETAIL_KEY, farmDetail)

const {
  can,
  PERMISSION,
  currentFactory,
  hasFactory,
  factoryTypeLabel,
  factoryStatusTag,
  selectedFactoryType,
  factoryTypes,
  goToDashboard,
  goToAlarmDetail,
  goToDeviceDetail,
  kpiItems,
  factoryKpi,
  activeKpiFilter,
  selectKpiFilter,
} = farmDetail
</script>

<style lang="scss">
@use './farm-detail.scss';
</style>
