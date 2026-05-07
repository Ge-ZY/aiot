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
        <h2>{{ currentFactory || '请选择工厂' }} - 设备详情</h2>
      </div>

      <div class="stats-section">
        <div class="stat-card" v-for="stat in deviceStats" :key="stat.key">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="32">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.name }}</div>
          </div>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>仪器列表</h3>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleDebug">调试底层设备</el-button>
          </div>
        </div>

        <div class="filter-section">
          <el-select v-model="filterType" placeholder="选择设备类型" clearable style="width: 200px; margin-right: 15px;">
            <el-option
              v-for="type in deviceTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
          <el-input
            v-model="filterId"
            placeholder="输入设备ID"
            clearable
            style="width: 250px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="table-container">
          <el-table :data="filteredDeviceList" stripe style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" width="150" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="uuid" label="UUID" width="250" />
            <el-table-column prop="attribute" label="属性名称" width="150" />
            <el-table-column prop="workshop" label="车间" />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Monitor, Document, Tools, Box, Coin, DataLine } from '@element-plus/icons-vue'

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

const deviceTypes = [
  '灯塔',
  '二氧化碳传感器',
  '保温灯',
  '智能花洒',
  '环控器',
  '智能网关',
  '智能水表',
  '智能电表',
  '温度传感器',
  '湿度传感器'
]

const deviceStats = ref([
  { key: 'light', name: '灯塔', count: 24, color: '#1890ff', icon: markRaw(Monitor) },
  { key: 'co2', name: '二氧化碳传感器', count: 48, color: '#52c41a', icon: markRaw(DataLine) },
  { key: 'heater', name: '保温灯', count: 156, color: '#faad14', icon: markRaw(Tools) },
  { key: 'shower', name: '智能花洒', count: 80, color: '#eb2f96', icon: markRaw(Document) },
  { key: 'controller', name: '环控器', count: 32, color: '#722ed1', icon: markRaw(Box) },
  { key: 'gateway', name: '智能网关', count: 16, color: '#fa541c', icon: markRaw(Coin) }
])

const deviceList = ref([
  { id: 1, name: '北大门灯塔-01', type: '灯塔', uuid: 'DEV-LIGHT-001', attribute: '主入口照明', workshop: '一号车间' },
  { id: 2, name: 'CO2传感器-A01', type: '二氧化碳传感器', uuid: 'DEV-CO2-A01', attribute: '环境监测', workshop: '一号车间' },
  { id: 3, name: '保育舍保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-001', attribute: '温度控制', workshop: '保育舍' },
  { id: 4, name: '智能花洒-S01', type: '智能花洒', uuid: 'DEV-SHOWER-001', attribute: '淋浴控制', workshop: '分娩舍' },
  { id: 5, name: '环控器-C01', type: '环控器', uuid: 'DEV-CTRL-001', attribute: '环境控制', workshop: '二号车间' },
  { id: 6, name: '智能网关-G01', type: '智能网关', uuid: 'DEV-GATE-001', attribute: '数据传输', workshop: '中控室' },
  { id: 7, name: '智能水表-W01', type: '智能水表', uuid: 'DEV-WATER-001', attribute: '用水监测', workshop: '一号车间' },
  { id: 8, name: '智能电表-E01', type: '智能电表', uuid: 'DEV-ELEC-001', attribute: '用电监测', workshop: '二号车间' },
  { id: 9, name: '温度传感器-T01', type: '温度传感器', uuid: 'DEV-TEMP-001', attribute: '温度监测', workshop: '保育舍' },
  { id: 10, name: '湿度传感器-H01', type: '湿度传感器', uuid: 'DEV-HUMI-001', attribute: '湿度监测', workshop: '分娩舍' },
  { id: 11, name: '北大门灯塔-02', type: '灯塔', uuid: 'DEV-LIGHT-002', attribute: '主入口照明', workshop: '二号车间' },
  { id: 12, name: 'CO2传感器-A02', type: '二氧化碳传感器', uuid: 'DEV-CO2-A02', attribute: '环境监测', workshop: '保育舍' }
])

const filterType = ref('')
const filterId = ref('')

const filteredDeviceList = computed(() => {
  let result = deviceList.value
  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value)
  }
  if (filterId.value) {
    result = result.filter(item => 
      String(item.id).includes(filterId.value) ||
      item.name.includes(filterId.value)
    )
  }
  return result
})

const handleNodeClick = (data: any) => {
  if (!data.children || data.children.length === 0) {
    currentFactory.value = data.name
  }
}

const handleDebug = () => {
  ElMessage.info('调试底层设备功能开发中...')
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

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filter-section {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 15px;
}

.list-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
}
</style>