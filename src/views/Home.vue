<template>
  <div class="home-container">
    <div class="sidebar">
      <div class="tree-title">公司选择</div>
      <el-tree
        :data="companyTree"
        :props="treeProps"
        default-expand-all
        node-key="id"
        highlight-current
        @node-click="handleNodeClick"
      />
    </div>
    <div class="main-content">
      <div class="content-header">
        <h2>{{ currentFactory || '请选择工厂' }}</h2>
      </div>
      
      <div class="top-section">
        <div class="panel overview-panel">
          <div class="panel-title">工厂概览</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">156</div>
              <div class="stat-label">栏舍总数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">12,850</div>
              <div class="stat-label">存栏总量</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">48</div>
              <div class="stat-label">在线设备</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">3</div>
              <div class="stat-label">今日告警</div>
            </div>
          </div>
        </div>
        
        <div class="panel video-panel">
          <div class="panel-header-row">
            <div class="panel-title">视频监控</div>
            <div class="panel-actions">
              <el-select v-model="selectedCamera" placeholder="选择监控" style="width: 160px; margin-right: 10px;">
                <el-option 
                  v-for="camera in cameraList" 
                  :key="camera.id" 
                  :label="camera.name" 
                  :value="camera.id"
                />
              </el-select>
              <el-button type="primary" :icon="Refresh" circle @click="refreshVideo" />
            </div>
          </div>
          <div class="video-placeholder">
            <el-icon class="video-icon"><VideoCamera /></el-icon>
            <p>{{ currentCameraName }} - 监控画面</p>
          </div>
        </div>
        
        <div class="panel weather-panel">
          <div class="panel-title">天气信息</div>
          <div class="weather-content">
            <div class="weather-icon">☀️</div>
            <div class="weather-info">
              <div class="weather-temp">26°C</div>
              <div class="weather-desc">晴</div>
            </div>
            <div class="weather-details">
              <div>湿度: 65%</div>
              <div>风向: 东北风 2级</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bottom-section">
        <div class="panel barn-panel" v-for="barn in barnList" :key="barn.id">
          <div class="barn-header">
            <div class="barn-title">
              <span class="barn-name">{{ barn.name }}</span>
              <el-tag :type="barn.status === '正常' ? 'success' : 'warning'" size="small">
                {{ barn.status }}
              </el-tag>
            </div>
            <el-button type="primary" link @click="goToBarnDetail(barn)">查看详情</el-button>
          </div>
          <div class="barn-content">
            <div class="barn-stat">
              <span class="label">存栏</span>
              <span class="value">{{ barn.stock }}</span>
            </div>
            <div class="barn-stat">
              <span class="label">温度</span>
              <span class="value">{{ barn.temp }}°C</span>
            </div>
            <div class="barn-stat">
              <span class="label">湿度</span>
              <span class="value">{{ barn.humidity }}%</span>
            </div>
            <div class="barn-stat">
              <span class="label">通风</span>
              <span class="value">{{ barn.ventilation }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoCamera, Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const treeProps = {
  children: 'children',
  label: 'name'
}

const companyTree = ref([
  {
    id: 1,
    name: '大牧集团',
    children: [
      {
        id: 11,
        name: '华南分公司',
        children: [
          {
            id: 111,
            name: '生产部',
            children: [
              { id: 1111, name: '广州一厂' },
              { id: 1112, name: '深圳二厂' }
            ]
          },
          {
            id: 112,
            name: '技术部',
            children: [
              { id: 1121, name: '东莞研发中心' }
            ]
          }
        ]
      },
      {
        id: 12,
        name: '华东分公司',
        children: [
          {
            id: 121,
            name: '生产部',
            children: [
              { id: 1211, name: '上海一厂' },
              { id: 1212, name: '杭州二厂' }
            ]
          }
        ]
      }
    ]
  }
])

const currentFactory = ref('')

const selectedCamera = ref(1)
const cameraList = ref([
  { id: 1, name: '大门入口' },
  { id: 2, name: '猪舍A区' },
  { id: 3, name: '猪舍B区' },
  { id: 4, name: '饲料仓库' },
  { id: 5, name: '办公区域' },
  { id: 6, name: '围墙周界' }
])

const currentCameraName = computed(() => {
  const camera = cameraList.value.find(c => c.id === selectedCamera.value)
  return camera ? camera.name : '请选择监控'
})

const refreshVideo = () => {
  ElMessage.success('刷新成功')
}

const goToBarnDetail = (barn: any) => {
  router.push({ path: '/barn-detail', query: { id: barn.id, name: barn.name } })
}

const barnList = ref([
  { id: 1, name: '保育舍1', status: '正常', stock: 1200, temp: 24, humidity: 65, ventilation: 80 },
  { id: 2, name: '保育舍2', status: '正常', stock: 1150, temp: 25, humidity: 62, ventilation: 75 },
  { id: 3, name: '分娩舍1', status: '正常', stock: 580, temp: 26, humidity: 70, ventilation: 85 },
  { id: 4, name: '分娩舍2', status: '告警', stock: 620, temp: 28, humidity: 75, ventilation: 60 }
])

const handleNodeClick = (data: any) => {
  if (!data.children || data.children.length === 0) {
    currentFactory.value = data.name
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.sidebar {
  width: 240px;
  background: #ffffff;
  color: #303133;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #e6e6e6;
}

.tree-title {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e6e6e6;
}

.sidebar :deep(.el-tree) {
  background: transparent;
  color: #303133;
  border: none;
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.sidebar :deep(.el-tree-node__content:hover) {
  background: #f0f7ff;
}

.sidebar :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #e6f7ff;
  color: #1890ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  margin: 0;
  color: #333;
}

.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.video-placeholder {
  height: 150px;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.video-icon {
  font-size: 40px;
  margin-bottom: 10px;
  color: #1890ff;
}

.weather-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.weather-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.weather-info {
  text-align: center;
  margin-bottom: 10px;
}

.weather-temp {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.weather-desc {
  font-size: 14px;
  color: #666;
}

.weather-details {
  font-size: 12px;
  color: #999;
  text-align: center;
  line-height: 1.8;
}

.barn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.barn-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.barn-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.barn-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.barn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.barn-stat .label {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.barn-stat .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
</style>