<template>
<div class="panel">
        <CameraPanel :cameras="barnCameraList" title="舍内监控" />
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import CameraPanel from '@/components/CameraPanel.vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const { barnCameraList } = inject(BARN_DETAIL_KEY)!
</script>
