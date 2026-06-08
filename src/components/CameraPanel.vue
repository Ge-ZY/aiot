<template>
  <div class="camera-panel-block">
    <div class="panel-header-row">
      <div class="panel-title">
        <el-icon><VideoCamera /></el-icon>
        {{ title }}
      </div>
      <div class="panel-actions">
        <el-select
          v-model="selectedId"
          placeholder="选择摄像头"
          size="small"
          style="width: 200px; margin-right: 8px;"
          :disabled="cameras.length === 0"
        >
          <el-option
            v-for="camera in cameras"
            :key="camera.id"
            :label="camera.name"
            :value="camera.id"
          />
        </el-select>
        <el-button-group>
          <el-button size="small" :icon="Refresh" @click="handleRefresh" />
          <el-button size="small" :icon="FullScreen" @click="toggleFullScreen" />
        </el-button-group>
      </div>
    </div>

    <div v-if="cameras.length === 0" class="camera-empty">
      <el-icon :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
      <p>暂无可用摄像头</p>
    </div>

    <div v-else ref="panelRef" class="camera-viewport">
      <div class="video-wrapper">
        <div class="video-placeholder">
          <el-icon :size="72" color="#909399"><VideoCamera /></el-icon>
          <p class="video-name">{{ currentCamera?.name }}</p>
          <p class="video-location">{{ currentCamera?.location }}</p>
          <el-tag :type="currentCamera?.status === '在线' ? 'success' : 'info'" size="small">
            {{ currentCamera?.status }}
          </el-tag>
        </div>
      </div>
      <div class="viewport-overlay">
        <span class="overlay-label">{{ currentCamera?.name }}</span>
        <span class="overlay-time">{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VideoCamera, Refresh, FullScreen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { CameraItem } from '@/utils/cameraMockData'

const props = withDefaults(defineProps<{
  cameras: CameraItem[]
  title?: string
}>(), {
  title: '视频监控',
})

const panelRef = ref<HTMLElement>()
const selectedId = ref('')
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const currentCamera = computed(() =>
  props.cameras.find(c => c.id === selectedId.value)
)

const updateTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

watch(
  () => props.cameras,
  (list) => {
    if (list.length === 0) {
      selectedId.value = ''
      return
    }
    if (!list.some(c => c.id === selectedId.value)) {
      selectedId.value = list[0].id
    }
  },
  { immediate: true },
)

const handleRefresh = () => {
  ElMessage.success('画面已刷新')
}

const toggleFullScreen = () => {
  const el = panelRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.camera-panel-block {
  width: 100%;
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 10px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.camera-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  gap: 8px;
}

.camera-empty p {
  margin: 0;
  font-size: 14px;
}

.camera-viewport {
  position: relative;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  min-height: 320px;
}

.video-wrapper {
  width: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
}

.video-name {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.video-location {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.viewport-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.overlay-label,
.overlay-time {
  color: #fff;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.55);
  padding: 4px 10px;
  border-radius: 4px;
}
</style>
