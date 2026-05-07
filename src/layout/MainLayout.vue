<template>
  <div class="main-layout">
    <div class="layout-sidebar">
      <div class="logo">
        <h3>AIOT物联</h3>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>后台管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>大屏可视化</span>
        </el-menu-item>
        <el-menu-item index="/barn-detail">
          <el-icon><VideoCamera /></el-icon>
          <span>栏舍详情</span>
        </el-menu-item>
        <el-menu-item index="/alarm-detail">
          <el-icon><Warning /></el-icon>
          <span>报警详情</span>
        </el-menu-item>
        <el-menu-item index="/device-detail">
          <el-icon><Setting /></el-icon>
          <span>设备详情</span>
        </el-menu-item>
        <el-menu-item index="/monitor-detail">
          <el-icon><Camera /></el-icon>
          <span>监控点</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="layout-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { House, Monitor, VideoCamera, Warning, Setting, Camera } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
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
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  border-right: 3px solid #1890ff;
}

.layout-content {
  flex: 1;
  overflow: hidden;
  background: #f0f2f5;
}
</style>