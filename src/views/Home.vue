<template>
  <div class="home-container">
    <div class="sidebar">
      <el-card>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h4>公司列表</h4>
            <el-input v-model="filterText" placeholder="输入关键字过滤" size="small" style="width: 150px" clearable />
          </div>
        </template>
        <el-tree :data="companies" node-key="id" :props="{
          label: 'name',
          value: 'id',
          children: 'children'
        }" @node-click="handleNodeClick" highlight-current
          :expand-on-click-node="false" :filter-node-method="filterNode" ref="companyTree">
        </el-tree>
      </el-card>
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
            <div class="weather-right">
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoCamera, Refresh } from '@element-plus/icons-vue'
import { sdk } from '@/utils/sdk'

const router = useRouter()

const companies = ref<any[]>([])
const filterText = ref('')
const companyTree = ref()

const currentNodeData = ref<any>(null)
const lastLeafNode = ref<any>(null) // 记录最后一次选择的叶子节点

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
  { id: 3, name: '保育舍3', status: '正常', stock: 1100, temp: 24, humidity: 68, ventilation: 82 },
  { id: 4, name: '保育舍4', status: '告警', stock: 1080, temp: 27, humidity: 78, ventilation: 55 },
  { id: 5, name: '分娩舍1', status: '正常', stock: 580, temp: 26, humidity: 70, ventilation: 85 },
  { id: 6, name: '分娩舍2', status: '告警', stock: 620, temp: 28, humidity: 75, ventilation: 60 },
  { id: 7, name: '分娩舍3', status: '正常', stock: 550, temp: 25, humidity: 68, ventilation: 88 },
  { id: 8, name: '分娩舍4', status: '正常', stock: 560, temp: 26, humidity: 72, ventilation: 83 }
])

watch(filterText, (val) => {
  companyTree.value?.filter(val)
})

function filterNode(value: string, data: any) {
  if (!value) return true
  return data.name.includes(value) || data.code.includes(value)
}

onMounted(async () => {
  await loadCompanys()
})

async function loadCompanys() {
  try {
    const res = await sdk.company.treenode()
    if (res.data && res.data.data) {
      companies.value = res.data.data.map((group: any) => ({
        ...group,
        children: [] // 初始化空子节点
      }))
    }
  } catch (err) {
    console.error('Failed to load groups:', err)
  }
}

const handleNodeClick = async (data: any) => {
  currentNodeData.value = data
  // 如果节点有子节点但未加载，则从API获取
  if (data.children.length === 0) {
    refreshNodeData()
  }

  // 判断是否为叶子节点（没有子节点）
  const isLeafNode = !data.children || data.children.length === 0
  
  if (isLeafNode) {
    // 如果是叶子节点，更新显示
    lastLeafNode.value = data
    currentFactory.value = data.name
    console.log('点击叶子节点，:', data)
    // let res = await sdk.factory.info.get(data.id)
    // console.log('获取工厂详情，:', res)
  } else {
    // 如果不是叶子节点，保持显示最后一次选择的叶子节点
    if (lastLeafNode.value) {
      currentFactory.value = lastLeafNode.value.name
    }
  }
}

async function refreshNodeData() {
  if (!currentNodeData.value) return
  
  try {
    // const res = await axios.get(`/api/tenant/groups/${currentNodeData.value.id}/children`)
    const res = await sdk.company.treenode(currentNodeData.value.id)
    if (res.data && res.data.data) {
      currentNodeData.value.children = res.data.data.map((child: any) => ({
        ...child,
        children: [] // 初始化空子节点
      }))
      companyTree.value?.updateKeyChildren(currentNodeData.value.id, currentNodeData.value.children)
      // 展开当前节点
    }
  } catch (err) {
    console.error('Failed to refresh node data:', err)
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
  width: 300px;
  flex-shrink: 0;
  overflow: auto;
  border-right: 1px solid #e6e6e6;
}

/* 树节点样式 */
.sidebar :deep(.el-tree) {
  background: transparent;
}

.sidebar :deep(.el-tree-node__content) {
  height: 36px;
}

.sidebar :deep(.el-tree-node__content:hover) {
  background-color: #f0f7ff;
}

.sidebar :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 15px 10px;
}

.weather-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.weather-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weather-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.weather-temp {
  font-size: 28px;
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
  text-align: left;
  line-height: 1.6;
}

.barn-panel {
  position: relative;
  overflow: hidden;
}

.barn-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
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
  gap: 12px;
}

.barn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  transition: all 0.2s;
}

.barn-stat:hover {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  transform: scale(1.02);
}

.barn-stat .label {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  font-weight: 500;
}

.barn-stat .value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}
</style>