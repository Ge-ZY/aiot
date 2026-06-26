<template>
  <div class="camera-panel-block">
    <div class="panel-header-row">
      <div class="panel-title">
        <el-icon><VideoCamera /></el-icon>
        {{ title }}
        <span v-if="mode === 'grid' && cameras.length" class="panel-sub">
          共 {{ cameras.length }} 路 · 每页 9 路
        </span>
      </div>
      <div class="panel-actions">
        <!-- 单路模式 -->
        <template v-if="mode === 'single'">
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
            <el-button size="small" :icon="FullScreen" @click="toggleSingleFullScreen" />
          </el-button-group>
        </template>
        <!-- 九宫格模式 -->
        <template v-else>
          <el-button size="small" :icon="Refresh" @click="handleRefresh">刷新</el-button>
          <el-button-group v-if="totalPages > 1">
            <el-button size="small" :icon="ArrowLeft" :disabled="currentPage <= 0" @click="prevPage" />
            <el-button size="small" disabled class="page-indicator">
              {{ currentPage + 1 }} / {{ totalPages }}
            </el-button>
            <el-button
              size="small"
              :icon="ArrowRight"
              :disabled="currentPage >= totalPages - 1"
              @click="nextPage"
            />
          </el-button-group>
        </template>
      </div>
    </div>

    <div v-if="cameras.length === 0" class="camera-empty">
      <el-icon :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
      <p>暂无可用摄像头</p>
    </div>

    <!-- 单路大图 -->
    <div v-else-if="mode === 'single'" ref="singlePanelRef" class="camera-viewport">
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

    <!-- 3×3 九宫格 -->
    <div v-else class="camera-grid-wrap">
      <div class="camera-grid">
        <div
          v-for="(camera, index) in gridCells"
          :key="camera?.id ?? `empty-${currentPage}-${index}`"
          class="grid-cell"
          :class="{ empty: !camera, offline: camera?.status === '离线' }"
          @click="camera && openGridFullscreen(camera)"
        >
          <template v-if="camera">
            <div class="cell-video">
              <el-icon :size="36" color="#606266"><VideoCamera /></el-icon>
            </div>
            <div class="cell-footer">
              <span class="cell-name" :title="camera.name">{{ camera.name }}</span>
              <el-tag
                :type="camera.status === '在线' ? 'success' : 'info'"
                size="small"
                class="cell-status"
              >
                {{ camera.status }}
              </el-tag>
            </div>
            <div class="cell-hover-tip">点击全屏</div>
          </template>
          <template v-else>
            <span class="cell-empty-text">—</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 全屏播放层 -->
    <teleport to="body">
      <div
        v-if="fullscreenCamera"
        ref="fullscreenRef"
        class="camera-fullscreen-layer"
        @keydown.esc="closeFullscreen"
      >
        <div class="fs-toolbar">
          <span class="fs-title">{{ fullscreenCamera.name }} · {{ fullscreenCamera.location }}</span>
          <div class="fs-actions">
            <el-tag :type="fullscreenCamera.status === '在线' ? 'success' : 'info'" size="small">
              {{ fullscreenCamera.status }}
            </el-tag>
            <el-button size="small" :icon="Refresh" circle @click="handleRefresh" />
            <el-button size="small" :icon="Close" circle @click="closeFullscreen" />
          </div>
        </div>
        <div class="fs-video-area">
          <el-icon :size="120" color="#909399"><VideoCamera /></el-icon>
          <p class="fs-camera-name">{{ fullscreenCamera.name }}</p>
          <p class="fs-camera-loc">{{ fullscreenCamera.location }}</p>
        </div>
        <div class="fs-time">{{ currentTime }}</div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { VideoCamera, Refresh, FullScreen, ArrowLeft, ArrowRight, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { CameraItem } from '@/utils/cameraMockData'

const PAGE_SIZE = 9

const props = withDefaults(defineProps<{
  cameras: CameraItem[]
  title?: string
  /** single：单路切换；grid：3×3 分页九宫格 */
  mode?: 'single' | 'grid'
}>(), {
  title: '视频监控',
  mode: 'single',
})

const singlePanelRef = ref<HTMLElement>()
const fullscreenRef = ref<HTMLElement>()
const selectedId = ref('')
const currentTime = ref('')
const currentPage = ref(0)
const fullscreenCamera = ref<CameraItem | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

const currentCamera = computed(() =>
  props.cameras.find(c => c.id === selectedId.value)
)

const totalPages = computed(() =>
  props.cameras.length ? Math.ceil(props.cameras.length / PAGE_SIZE) : 1
)

const pagedCameras = computed(() => {
  const start = currentPage.value * PAGE_SIZE
  return props.cameras.slice(start, start + PAGE_SIZE)
})

/** 固定 9 格，不足补空 */
const gridCells = computed(() => {
  const cells: (CameraItem | null)[] = [...pagedCameras.value]
  while (cells.length < PAGE_SIZE) {
    cells.push(null)
  }
  return cells.slice(0, PAGE_SIZE)
})

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
      currentPage.value = 0
      return
    }
    if (modeIsSingle() && !list.some(c => c.id === selectedId.value)) {
      selectedId.value = list[0].id
    }
    if (currentPage.value >= totalPages.value) {
      currentPage.value = Math.max(0, totalPages.value - 1)
    }
  },
  { immediate: true },
)

function modeIsSingle() {
  return props.mode === 'single'
}

const handleRefresh = () => {
  ElMessage.success('画面已刷新')
}

const prevPage = () => {
  if (currentPage.value > 0) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) currentPage.value += 1
}

const toggleSingleFullScreen = () => {
  const el = singlePanelRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const openGridFullscreen = async (camera: CameraItem) => {
  fullscreenCamera.value = camera
  await nextTick()
  const el = fullscreenRef.value
  if (el?.requestFullscreen) {
    try {
      await el.requestFullscreen()
    } catch {
      /* 浏览器策略限制时仍展示全屏层 */
    }
  }
}

const closeFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
  fullscreenCamera.value = null
}

const onFullscreenChange = () => {
  if (!document.fullscreenElement && fullscreenCamera.value) {
    fullscreenCamera.value = null
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (fullscreenCamera.value) closeFullscreen()
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
  flex-wrap: wrap;
}

.panel-sub {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.panel-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.page-indicator {
  min-width: 64px;
  cursor: default;
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

/* 单路模式 */
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

/* 九宫格模式 */
.camera-grid-wrap {
  background: #0d0d0d;
  border-radius: 8px;
  padding: 8px;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 6px;
  aspect-ratio: 16 / 10;
  min-height: 420px;
}

.grid-cell {
  position: relative;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border: 1px solid #2a2a2a;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.grid-cell:not(.empty):hover {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.35);
}

.grid-cell.empty {
  cursor: default;
  background: #141414;
}

.grid-cell.offline .cell-video {
  opacity: 0.55;
}

.cell-video {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: linear-gradient(180deg, #222 0%, #111 100%);
}

.cell-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.75);
  flex-shrink: 0;
}

.cell-name {
  color: #e5e5e5;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.cell-status {
  flex-shrink: 0;
  transform: scale(0.85);
  transform-origin: right center;
}

.cell-hover-tip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}

.grid-cell:not(.empty):hover .cell-hover-tip {
  opacity: 1;
}

.cell-empty-text {
  color: #444;
  font-size: 20px;
  margin: auto;
}
</style>

<style>
/* 全屏层（teleport 到 body，不能 scoped） */
.camera-fullscreen-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #000;
  display: flex;
  flex-direction: column;
}

.camera-fullscreen-layer .fs-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.85);
  flex-shrink: 0;
}

.camera-fullscreen-layer .fs-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.camera-fullscreen-layer .fs-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.camera-fullscreen-layer .fs-video-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.camera-fullscreen-layer .fs-camera-name {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.camera-fullscreen-layer .fs-camera-loc {
  color: #909399;
  font-size: 16px;
  margin: 0;
}

.camera-fullscreen-layer .fs-time {
  position: absolute;
  bottom: 20px;
  right: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
