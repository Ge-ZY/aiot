<template>
  <div class="barn-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" circle />
        <div>
          <div class="header-title-row">
            <h2>{{ barnName }}</h2>
            <el-tag :type="barnStatus === '正常' ? 'success' : 'danger'" size="small">{{ barnStatus }}</el-tag>
          </div>
          <span class="header-sub">舍内详情 · {{ factoryTypeLabel }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="selectedBarn" @change="handleBarnChange" placeholder="切换栏舍" style="width: 160px;">
          <el-option v-for="barn in barnList" :key="barn.id" :label="barn.name" :value="barn.id" />
        </el-select>
      </div>
    </div>

    <div class="pillars-stack">
      <BarnBreedingPanel
        v-if="canAny([
          PERMISSION.MODULE_BREEDING,
          PERMISSION.MODULE_FEEDING,
          PERMISSION.MODULE_BIO_PREVENTION,
          PERMISSION.MODULE_FEED_PRODUCTION,
        ])"
      />
      <BarnBioPanel v-if="can(PERMISSION.MODULE_BIO)" />
      <BarnEnvPanel v-if="can(PERMISSION.MODULE_ENV_DETAIL)" />
      <BarnMonitorPanel v-if="can(PERMISSION.MONITOR_VIEW)" />
      <BarnDeviceMgmtPanel v-if="can(PERMISSION.MODULE_DEVICE_MGMT)" />
      <BarnDeviceDetailPanel v-if="can(PERMISSION.MODULE_DEVICE_DETAIL)" />
      <BarnEnergyPanel v-if="can(PERMISSION.MODULE_ENERGY)" />
      <BarnSafetyPanel v-if="can(PERMISSION.MODULE_SAFETY)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useBarnDetail } from './useBarnDetail'
import { BARN_DETAIL_KEY } from './barnDetailContext'
import BarnBreedingPanel from './components/BarnBreedingPanel.vue'
import BarnBioPanel from './components/BarnBioPanel.vue'
import BarnEnvPanel from './components/BarnEnvPanel.vue'
import BarnMonitorPanel from './components/BarnMonitorPanel.vue'
import BarnDeviceMgmtPanel from './components/BarnDeviceMgmtPanel.vue'
import BarnDeviceDetailPanel from './components/BarnDeviceDetailPanel.vue'
import BarnEnergyPanel from './components/BarnEnergyPanel.vue'
import BarnSafetyPanel from './components/BarnSafetyPanel.vue'

const barnDetail = useBarnDetail()
provide(BARN_DETAIL_KEY, barnDetail)

const {
  can,
  canAny,
  PERMISSION,
  barnName,
  barnStatus,
  factoryTypeLabel,
  barnList,
  selectedBarn,
  handleBarnChange,
  goBack,
} = barnDetail
</script>

<style lang="scss">
@use './barn-detail.scss';
</style>
