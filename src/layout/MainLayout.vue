<template>
  <div class="main-layout">
    <div class="layout-sidebar">
      <div class="logo">
        <h3>AIOT物联</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>大屏可视化</span>
        </el-menu-item>
        <el-menu-item index="/farm">
          <el-icon><House /></el-icon>
          <span>农场详情</span>
        </el-menu-item>
        <el-menu-item index="/farm/alarm-detail">
          <el-icon><Warning /></el-icon>
          <span>报警详情</span>
        </el-menu-item>
        <el-menu-item index="/farm/device-detail">
          <el-icon><Setting /></el-icon>
          <span>设备详情</span>
        </el-menu-item>
        <el-menu-item index="/farm/monitor-detail">
          <el-icon><Camera /></el-icon>
          <span>监控点位</span>
        </el-menu-item>
        <el-menu-item index="/farm/comparison-detail">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据对比</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="layout-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Monitor, Warning, Setting, Camera, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => {
  if (route.meta.hidden || route.path.startsWith('/farm/barn-detail')) {
    return '/farm'
  }
  return route.path
})

const handleMenuSelect = (index: string) => {
  if (index === route.path) return
  
  router.push(index)
}
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  width: 220px;
  height: 100%;
  background: linear-gradient(180deg, #001529 0%, #002140 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.sidebar-menu {
  border: none;
  background: transparent;
  color: white;
  flex: 1;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: none !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-right: 3px solid #1890ff;
}

.layout-content {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: #f0f2f5;
  position: relative;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>