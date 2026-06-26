<template>
<div class="panel camera-section">
          <CameraPanel :cameras="factoryCameraList" title="厂区监控" />
        </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import CameraPanel from '@/components/CameraPanel.vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { factoryCameraList } = ctx
</script>
