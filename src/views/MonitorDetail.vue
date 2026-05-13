<template>
  <LayoutWithSidebar v-slot="{ currentFactory }">
    <div class="monitor-content">
      <div class="camera-header">
        <div class="header-left">
          <h2>{{ currentFactory || '请选择工厂' }} - 监控点</h2>
        </div>
        <div class="header-right">
          <el-select v-model="selectedCamera" placeholder="选择摄像头" style="width: 200px; margin-right: 10px;">
            <el-option
              v-for="camera in cameraList"
              :key="camera.id"
              :label="camera.name"
              :value="camera.id"
            />
          </el-select>
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshCamera" />
            <el-button :icon="FullScreen" @click="toggleFullScreen" />
          </el-button-group>
        </div>
      </div>

      <div class="camera-panel">
        <div class="video-wrapper">
          <div class="video-placeholder">
            <el-icon :size="100" color="#666"><VideoCamera /></el-icon>
            <p class="video-name">{{ currentCamera?.name || '请选择摄像头' }}</p>
            <p class="video-location">{{ currentCamera?.location || '-' }}</p>
            <p class="video-status" :class="{ online: currentCamera?.status === '在线' }">
              {{ currentCamera?.status || '离线' }}
            </p>
          </div>
        </div>
        <div class="panel-overlay">
          <span class="camera-label">{{ currentCamera?.name || '-' }}</span>
          <span class="camera-time">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VideoCamera, Refresh, FullScreen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'

const selectedCamera = ref('CAM-001')
const currentTime = ref('')
let timer: any = null

const cameraList = ref([
  { id: 'CAM-001', name: '北大门入口', type: '全景摄像头', location: '一号车间正门', status: '在线', ip: '192.168.1.101' },
  { id: 'CAM-002', name: '保育舍A区', type: '红外摄像头', location: '保育舍东走廊', status: '在线', ip: '192.168.1.102' },
  { id: 'CAM-003', name: '保育舍B区', type: '红外摄像头', location: '保育舍西走廊', status: '在线', ip: '192.168.1.103' },
  { id: 'CAM-004', name: '分娩舍监控', type: '半球摄像头', location: '分娩舍入口', status: '在线', ip: '192.168.1.104' },
  { id: 'CAM-005', name: '饲料仓库', type: '球型摄像头', location: '仓库正门', status: '离线', ip: '192.168.1.105' },
  { id: 'CAM-006', name: '中控室全景', type: '全景摄像头', location: '中控室', status: '在线', ip: '192.168.1.106' },
  { id: 'CAM-007', name: '二号车间入口', type: '枪机摄像头', location: '二号车间正门', status: '在线', ip: '192.168.1.107' },
  { id: 'CAM-008', name: '围墙周界A', type: '热成像摄像头', location: '北侧围墙', status: '在线', ip: '192.168.1.108' }
])

const currentCamera = computed(() => {
  return cameraList.value.find(c => c.id === selectedCamera.value)
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const refreshCamera = () => {
  ElMessage.success('刷新成功')
}

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.monitor-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f0f2f5;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.camera-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.camera-panel {
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.video-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.video-name {
  color: #fff;
  font-size: 24px;
  margin: 0;
}

.video-location {
  color: #999;
  font-size: 16px;
  margin: 0;
}

.video-status {
  color: #ff4d4f;
  font-size: 18px;
  margin: 0;
}

.video-status.online {
  color: #52c41a;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}

.camera-label {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 4px;
}

.camera-time {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 4px;
}
</style>
