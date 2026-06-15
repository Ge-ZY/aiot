<template>
  <LayoutWithSidebar v-slot="{ currentFactory }">
    <div class="device-content">
      <div class="content-header">
        <h2>{{ currentFactory || '请选择工厂' }} - {{ selectedWorkshop ? selectedWorkshop + ' - ' : '' }}设备详情</h2>
        <el-select v-model="selectedWorkshop" placeholder="选择车间" clearable style="width: 180px;">
          <el-option
            v-for="workshop in workshopList"
            :key="workshop"
            :label="workshop"
            :value="workshop"
          />
        </el-select>
      </div>

      <div class="stats-section">
        <div 
          class="stat-card" 
          v-for="stat in workshopDeviceStats" 
          :key="stat.key"
          :class="{ active: activeStat === stat.key }"
          @click="handleStatClick(stat.key)"
        >
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="32">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.name }}</div>
          </div>
          <!-- 所有设备显示在线/离线数量 - 垂直排列在右侧 -->
          <div class="stat-sub-info-vertical" @click.stop>
            <div 
              class="stat-sub-item on"
              :class="{ active: activeStat === stat.key && activeSubStat === 'on' }"
              @click="handleSubStatClick(stat.key, 'on')"
            >
              在线: {{ stat.onLine }}
            </div>
            <div 
              class="stat-sub-item off"
              :class="{ active: activeStat === stat.key && activeSubStat === 'off' }"
              @click="handleSubStatClick(stat.key, 'off')"
            >
              离线: {{ stat.offLine }}
            </div>
          </div>
        </div>
      </div>

      <div class="panel list-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>仪器列表</h3>
          </div>
          <div class="header-right">
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
            <el-table-column prop="type" label="类型" width="140" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getDeviceStatus(row).type" size="small">
                {{ getDeviceStatus(row).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="uuid" label="UUID" width="250" />
            <el-table-column prop="attribute" label="属性名称" width="150" />
            <el-table-column prop="workshop" label="车间" />
            <el-table-column label="详情" width="100">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  size="small" 
                  @click="handleViewDetail(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 保温灯详情弹窗 -->
        <el-dialog 
          v-model="detailDialogVisible" 
          title="保温灯详情" 
          width="1000px"
          class="heat-lamp-detail-dialog"
          :close-on-click-modal="false"
          :close-on-press-escape="true"
          destroy-on-close>
          <div class="detail-dialog-content">
            <!-- 上半部分：车间保温灯分布图 -->
            <div class="distribution-section">
              <div class="section-title">车间保温灯分布图</div>
              <div class="distribution-container">
                <!-- 列标题 -->
                <div class="row-header"></div>
                <div 
                  v-for="col in 5" 
                  :key="col" 
                  class="col-header">
                  第{{ col }}列
                </div>
                <!-- 行内容 -->
                <template v-for="row in 4" :key="row">
                  <div class="row-label">第{{ row }}排</div>
                  <div 
                    v-for="col in 5" 
                    :key="`${row}-${col}`"
                    class="heat-lamp-cell"
                    :class="{
                      active: currentLamp.row === row && currentLamp.col === col,
                      'is-on': getLampStatus(row, col)
                    }"
                    @click="selectLamp(row, col)">
                    <template v-if="getLampStatus(row, col)">
                      <div class="lamp-icon"></div>
                      <div class="lamp-temp">{{ getLampTemp(row, col) }}°C</div>
                    </template>
                    <template v-else>
                      <div class="lamp-icon"></div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- 下半部分：保温灯详情数据 -->
            <div class="data-section">
              <div class="section-title">保温灯详情数据</div>
              <div class="data-row">
                <div class="data-item">
                  <div class="data-label">当前温度</div>
                  <div class="data-value">{{ currentLampData.currentTemp }}°C</div>
                </div>
                <div class="data-item">
                  <div class="data-label">目标温度</div>
                  <div class="data-value">{{ currentLampData.targetTemp }}°C</div>
                </div>
              </div>
              <div ref="detailChartRef" class="detail-chart"></div>
            </div>
          </div>
        </el-dialog>
      </div>
    </div>
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, nextTick, onUnmounted } from 'vue'
import { useChartResize } from '@/composables/useChartResize'
import { Search, Monitor, Document, Tools, Box, Coin, DataLine } from '@element-plus/icons-vue'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'
import * as echarts from 'echarts'

const deviceTypes = [
  '料塔',
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
  { key: 'light', name: '料塔', count: 24, color: '#1890ff', icon: markRaw(Monitor) },
  { key: 'co2', name: '二氧化碳传感器', count: 48, color: '#52c41a', icon: markRaw(DataLine) },
  { key: 'heater', name: '保温灯', count: 156, color: '#faad14', icon: markRaw(Tools) },
  { key: 'shower', name: '智能花洒', count: 80, color: '#eb2f96', icon: markRaw(Document), onLine: 72, offLine: 8 },
  { key: 'controller', name: '环控器', count: 32, color: '#722ed1', icon: markRaw(Box) },
  { key: 'gateway', name: '智能网关', count: 16, color: '#fa541c', icon: markRaw(Coin) }
])

const deviceList = ref([
  { id: 1, name: '北大门料塔-01', type: '料塔', uuid: 'DEV-LIGHT-001', attribute: '主入口照明', workshop: '一号车间' },
  { id: 2, name: 'CO2传感器-A01', type: '二氧化碳传感器', uuid: 'DEV-CO2-A01', attribute: '环境监测', workshop: '一号车间' },
  { id: 3, name: '智能花洒-S01', type: '智能花洒', uuid: 'DEV-SHOWER-001', attribute: '淋浴控制', workshop: '分娩舍' },
  { id: 4, name: '环控器-C01', type: '环控器', uuid: 'DEV-CTRL-001', attribute: '环境控制', workshop: '二号车间' },
  { id: 5, name: '智能网关-G01', type: '智能网关', uuid: 'DEV-GATE-001', attribute: '数据传输', workshop: '中控室' },
  { id: 6, name: '智能水表-W01', type: '智能水表', uuid: 'DEV-WATER-001', attribute: '用水监测', workshop: '一号车间' },
  { id: 7, name: '智能电表-E01', type: '智能电表', uuid: 'DEV-ELEC-001', attribute: '用电监测', workshop: '二号车间' },
  { id: 8, name: '温度传感器-T01', type: '温度传感器', uuid: 'DEV-TEMP-001', attribute: '温度监测', workshop: '保育舍' },
  { id: 9, name: '湿度传感器-H01', type: '湿度传感器', uuid: 'DEV-HUMI-001', attribute: '湿度监测', workshop: '分娩舍' },
  { id: 10, name: '北大门料塔-02', type: '料塔', uuid: 'DEV-LIGHT-002', attribute: '主入口照明', workshop: '二号车间' },
  { id: 11, name: 'CO2传感器-A02', type: '二氧化碳传感器', uuid: 'DEV-CO2-A02', attribute: '环境监测', workshop: '保育舍' },
  // 一号车间保温灯 - 20个
  { id: 101, name: '一号车间保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-101', attribute: '温度控制', workshop: '一号车间' },
  { id: 102, name: '一号车间保温灯-02', type: '保温灯', uuid: 'DEV-HEAT-102', attribute: '温度控制', workshop: '一号车间' },
  { id: 103, name: '一号车间保温灯-03', type: '保温灯', uuid: 'DEV-HEAT-103', attribute: '温度控制', workshop: '一号车间' },
  { id: 104, name: '一号车间保温灯-04', type: '保温灯', uuid: 'DEV-HEAT-104', attribute: '温度控制', workshop: '一号车间' },
  { id: 105, name: '一号车间保温灯-05', type: '保温灯', uuid: 'DEV-HEAT-105', attribute: '温度控制', workshop: '一号车间' },
  { id: 106, name: '一号车间保温灯-06', type: '保温灯', uuid: 'DEV-HEAT-106', attribute: '温度控制', workshop: '一号车间' },
  { id: 107, name: '一号车间保温灯-07', type: '保温灯', uuid: 'DEV-HEAT-107', attribute: '温度控制', workshop: '一号车间' },
  { id: 108, name: '一号车间保温灯-08', type: '保温灯', uuid: 'DEV-HEAT-108', attribute: '温度控制', workshop: '一号车间' },
  { id: 109, name: '一号车间保温灯-09', type: '保温灯', uuid: 'DEV-HEAT-109', attribute: '温度控制', workshop: '一号车间' },
  { id: 110, name: '一号车间保温灯-10', type: '保温灯', uuid: 'DEV-HEAT-110', attribute: '温度控制', workshop: '一号车间' },
  { id: 111, name: '一号车间保温灯-11', type: '保温灯', uuid: 'DEV-HEAT-111', attribute: '温度控制', workshop: '一号车间' },
  { id: 112, name: '一号车间保温灯-12', type: '保温灯', uuid: 'DEV-HEAT-112', attribute: '温度控制', workshop: '一号车间' },
  { id: 113, name: '一号车间保温灯-13', type: '保温灯', uuid: 'DEV-HEAT-113', attribute: '温度控制', workshop: '一号车间' },
  { id: 114, name: '一号车间保温灯-14', type: '保温灯', uuid: 'DEV-HEAT-114', attribute: '温度控制', workshop: '一号车间' },
  { id: 115, name: '一号车间保温灯-15', type: '保温灯', uuid: 'DEV-HEAT-115', attribute: '温度控制', workshop: '一号车间' },
  { id: 116, name: '一号车间保温灯-16', type: '保温灯', uuid: 'DEV-HEAT-116', attribute: '温度控制', workshop: '一号车间' },
  { id: 117, name: '一号车间保温灯-17', type: '保温灯', uuid: 'DEV-HEAT-117', attribute: '温度控制', workshop: '一号车间' },
  { id: 118, name: '一号车间保温灯-18', type: '保温灯', uuid: 'DEV-HEAT-118', attribute: '温度控制', workshop: '一号车间' },
  { id: 119, name: '一号车间保温灯-19', type: '保温灯', uuid: 'DEV-HEAT-119', attribute: '温度控制', workshop: '一号车间' },
  { id: 120, name: '一号车间保温灯-20', type: '保温灯', uuid: 'DEV-HEAT-120', attribute: '温度控制', workshop: '一号车间' },
  // 二号车间保温灯 - 20个
  { id: 201, name: '二号车间保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-201', attribute: '温度控制', workshop: '二号车间' },
  { id: 202, name: '二号车间保温灯-02', type: '保温灯', uuid: 'DEV-HEAT-202', attribute: '温度控制', workshop: '二号车间' },
  { id: 203, name: '二号车间保温灯-03', type: '保温灯', uuid: 'DEV-HEAT-203', attribute: '温度控制', workshop: '二号车间' },
  { id: 204, name: '二号车间保温灯-04', type: '保温灯', uuid: 'DEV-HEAT-204', attribute: '温度控制', workshop: '二号车间' },
  { id: 205, name: '二号车间保温灯-05', type: '保温灯', uuid: 'DEV-HEAT-205', attribute: '温度控制', workshop: '二号车间' },
  { id: 206, name: '二号车间保温灯-06', type: '保温灯', uuid: 'DEV-HEAT-206', attribute: '温度控制', workshop: '二号车间' },
  { id: 207, name: '二号车间保温灯-07', type: '保温灯', uuid: 'DEV-HEAT-207', attribute: '温度控制', workshop: '二号车间' },
  { id: 208, name: '二号车间保温灯-08', type: '保温灯', uuid: 'DEV-HEAT-208', attribute: '温度控制', workshop: '二号车间' },
  { id: 209, name: '二号车间保温灯-09', type: '保温灯', uuid: 'DEV-HEAT-209', attribute: '温度控制', workshop: '二号车间' },
  { id: 210, name: '二号车间保温灯-10', type: '保温灯', uuid: 'DEV-HEAT-210', attribute: '温度控制', workshop: '二号车间' },
  { id: 211, name: '二号车间保温灯-11', type: '保温灯', uuid: 'DEV-HEAT-211', attribute: '温度控制', workshop: '二号车间' },
  { id: 212, name: '二号车间保温灯-12', type: '保温灯', uuid: 'DEV-HEAT-212', attribute: '温度控制', workshop: '二号车间' },
  { id: 213, name: '二号车间保温灯-13', type: '保温灯', uuid: 'DEV-HEAT-213', attribute: '温度控制', workshop: '二号车间' },
  { id: 214, name: '二号车间保温灯-14', type: '保温灯', uuid: 'DEV-HEAT-214', attribute: '温度控制', workshop: '二号车间' },
  { id: 215, name: '二号车间保温灯-15', type: '保温灯', uuid: 'DEV-HEAT-215', attribute: '温度控制', workshop: '二号车间' },
  { id: 216, name: '二号车间保温灯-16', type: '保温灯', uuid: 'DEV-HEAT-216', attribute: '温度控制', workshop: '二号车间' },
  { id: 217, name: '二号车间保温灯-17', type: '保温灯', uuid: 'DEV-HEAT-217', attribute: '温度控制', workshop: '二号车间' },
  { id: 218, name: '二号车间保温灯-18', type: '保温灯', uuid: 'DEV-HEAT-218', attribute: '温度控制', workshop: '二号车间' },
  { id: 219, name: '二号车间保温灯-19', type: '保温灯', uuid: 'DEV-HEAT-219', attribute: '温度控制', workshop: '二号车间' },
  { id: 220, name: '二号车间保温灯-20', type: '保温灯', uuid: 'DEV-HEAT-220', attribute: '温度控制', workshop: '二号车间' },
  // 保育舍保温灯 - 20个
  { id: 301, name: '保育舍保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-301', attribute: '温度控制', workshop: '保育舍' },
  { id: 302, name: '保育舍保温灯-02', type: '保温灯', uuid: 'DEV-HEAT-302', attribute: '温度控制', workshop: '保育舍' },
  { id: 303, name: '保育舍保温灯-03', type: '保温灯', uuid: 'DEV-HEAT-303', attribute: '温度控制', workshop: '保育舍' },
  { id: 304, name: '保育舍保温灯-04', type: '保温灯', uuid: 'DEV-HEAT-304', attribute: '温度控制', workshop: '保育舍' },
  { id: 305, name: '保育舍保温灯-05', type: '保温灯', uuid: 'DEV-HEAT-305', attribute: '温度控制', workshop: '保育舍' },
  { id: 306, name: '保育舍保温灯-06', type: '保温灯', uuid: 'DEV-HEAT-306', attribute: '温度控制', workshop: '保育舍' },
  { id: 307, name: '保育舍保温灯-07', type: '保温灯', uuid: 'DEV-HEAT-307', attribute: '温度控制', workshop: '保育舍' },
  { id: 308, name: '保育舍保温灯-08', type: '保温灯', uuid: 'DEV-HEAT-308', attribute: '温度控制', workshop: '保育舍' },
  { id: 309, name: '保育舍保温灯-09', type: '保温灯', uuid: 'DEV-HEAT-309', attribute: '温度控制', workshop: '保育舍' },
  { id: 310, name: '保育舍保温灯-10', type: '保温灯', uuid: 'DEV-HEAT-310', attribute: '温度控制', workshop: '保育舍' },
  { id: 311, name: '保育舍保温灯-11', type: '保温灯', uuid: 'DEV-HEAT-311', attribute: '温度控制', workshop: '保育舍' },
  { id: 312, name: '保育舍保温灯-12', type: '保温灯', uuid: 'DEV-HEAT-312', attribute: '温度控制', workshop: '保育舍' },
  { id: 313, name: '保育舍保温灯-13', type: '保温灯', uuid: 'DEV-HEAT-313', attribute: '温度控制', workshop: '保育舍' },
  { id: 314, name: '保育舍保温灯-14', type: '保温灯', uuid: 'DEV-HEAT-314', attribute: '温度控制', workshop: '保育舍' },
  { id: 315, name: '保育舍保温灯-15', type: '保温灯', uuid: 'DEV-HEAT-315', attribute: '温度控制', workshop: '保育舍' },
  { id: 316, name: '保育舍保温灯-16', type: '保温灯', uuid: 'DEV-HEAT-316', attribute: '温度控制', workshop: '保育舍' },
  { id: 317, name: '保育舍保温灯-17', type: '保温灯', uuid: 'DEV-HEAT-317', attribute: '温度控制', workshop: '保育舍' },
  { id: 318, name: '保育舍保温灯-18', type: '保温灯', uuid: 'DEV-HEAT-318', attribute: '温度控制', workshop: '保育舍' },
  { id: 319, name: '保育舍保温灯-19', type: '保温灯', uuid: 'DEV-HEAT-319', attribute: '温度控制', workshop: '保育舍' },
  { id: 320, name: '保育舍保温灯-20', type: '保温灯', uuid: 'DEV-HEAT-320', attribute: '温度控制', workshop: '保育舍' },
  // 分娩舍保温灯 - 20个
  { id: 401, name: '分娩舍保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-401', attribute: '温度控制', workshop: '分娩舍' },
  { id: 402, name: '分娩舍保温灯-02', type: '保温灯', uuid: 'DEV-HEAT-402', attribute: '温度控制', workshop: '分娩舍' },
  { id: 403, name: '分娩舍保温灯-03', type: '保温灯', uuid: 'DEV-HEAT-403', attribute: '温度控制', workshop: '分娩舍' },
  { id: 404, name: '分娩舍保温灯-04', type: '保温灯', uuid: 'DEV-HEAT-404', attribute: '温度控制', workshop: '分娩舍' },
  { id: 405, name: '分娩舍保温灯-05', type: '保温灯', uuid: 'DEV-HEAT-405', attribute: '温度控制', workshop: '分娩舍' },
  { id: 406, name: '分娩舍保温灯-06', type: '保温灯', uuid: 'DEV-HEAT-406', attribute: '温度控制', workshop: '分娩舍' },
  { id: 407, name: '分娩舍保温灯-07', type: '保温灯', uuid: 'DEV-HEAT-407', attribute: '温度控制', workshop: '分娩舍' },
  { id: 408, name: '分娩舍保温灯-08', type: '保温灯', uuid: 'DEV-HEAT-408', attribute: '温度控制', workshop: '分娩舍' },
  { id: 409, name: '分娩舍保温灯-09', type: '保温灯', uuid: 'DEV-HEAT-409', attribute: '温度控制', workshop: '分娩舍' },
  { id: 410, name: '分娩舍保温灯-10', type: '保温灯', uuid: 'DEV-HEAT-410', attribute: '温度控制', workshop: '分娩舍' },
  { id: 411, name: '分娩舍保温灯-11', type: '保温灯', uuid: 'DEV-HEAT-411', attribute: '温度控制', workshop: '分娩舍' },
  { id: 412, name: '分娩舍保温灯-12', type: '保温灯', uuid: 'DEV-HEAT-412', attribute: '温度控制', workshop: '分娩舍' },
  { id: 413, name: '分娩舍保温灯-13', type: '保温灯', uuid: 'DEV-HEAT-413', attribute: '温度控制', workshop: '分娩舍' },
  { id: 414, name: '分娩舍保温灯-14', type: '保温灯', uuid: 'DEV-HEAT-414', attribute: '温度控制', workshop: '分娩舍' },
  { id: 415, name: '分娩舍保温灯-15', type: '保温灯', uuid: 'DEV-HEAT-415', attribute: '温度控制', workshop: '分娩舍' },
  { id: 416, name: '分娩舍保温灯-16', type: '保温灯', uuid: 'DEV-HEAT-416', attribute: '温度控制', workshop: '分娩舍' },
  { id: 417, name: '分娩舍保温灯-17', type: '保温灯', uuid: 'DEV-HEAT-417', attribute: '温度控制', workshop: '分娩舍' },
  { id: 418, name: '分娩舍保温灯-18', type: '保温灯', uuid: 'DEV-HEAT-418', attribute: '温度控制', workshop: '分娩舍' },
  { id: 419, name: '分娩舍保温灯-19', type: '保温灯', uuid: 'DEV-HEAT-419', attribute: '温度控制', workshop: '分娩舍' },
  { id: 420, name: '分娩舍保温灯-20', type: '保温灯', uuid: 'DEV-HEAT-420', attribute: '温度控制', workshop: '分娩舍' },
  // 中控室保温灯 - 5个
  { id: 501, name: '中控室保温灯-01', type: '保温灯', uuid: 'DEV-HEAT-501', attribute: '温度控制', workshop: '中控室' },
  { id: 502, name: '中控室保温灯-02', type: '保温灯', uuid: 'DEV-HEAT-502', attribute: '温度控制', workshop: '中控室' },
  { id: 503, name: '中控室保温灯-03', type: '保温灯', uuid: 'DEV-HEAT-503', attribute: '温度控制', workshop: '中控室' },
  { id: 504, name: '中控室保温灯-04', type: '保温灯', uuid: 'DEV-HEAT-504', attribute: '温度控制', workshop: '中控室' },
  { id: 505, name: '中控室保温灯-05', type: '保温灯', uuid: 'DEV-HEAT-505', attribute: '温度控制', workshop: '中控室' }
])

const filterType = ref('')
const filterId = ref('')
const activeStat = ref('')
const activeSubStat = ref('')
const workshopList = ['一号车间', '二号车间', '保育舍', '分娩舍', '中控室']
const selectedWorkshop = ref(workshopList[0])

// 设备类型与统计 key 的映射
const statKeyToTypeMap: Record<string, string> = {
  light: '料塔',
  co2: '二氧化碳传感器',
  heater: '保温灯',
  shower: '智能花洒',
  controller: '环控器',
  gateway: '智能网关'
}

// 所有设备的状态（模拟数据）
const allDeviceStatus: Record<number, string> = {
  1: 'on',
  2: 'on',
  3: 'on',
  4: 'on',
  5: 'on',
  6: 'off',
  7: 'on',
  8: 'on',
  9: 'off',
  10: 'on',
  11: 'on',
  12: 'off',
  // 一号车间保温灯
  101: 'on', 102: 'on', 103: 'off', 104: 'on', 105: 'on',
  106: 'off', 107: 'on', 108: 'on', 109: 'off', 110: 'on',
  111: 'on', 112: 'off', 113: 'on', 114: 'on', 115: 'off',
  116: 'on', 117: 'on', 118: 'off', 119: 'on', 120: 'on',
  // 二号车间保温灯
  201: 'on', 202: 'on', 203: 'off', 204: 'on', 205: 'on',
  206: 'off', 207: 'on', 208: 'on', 209: 'off', 210: 'on',
  211: 'on', 212: 'off', 213: 'on', 214: 'on', 215: 'off',
  216: 'on', 217: 'on', 218: 'off', 219: 'on', 220: 'on',
  // 保育舍保温灯
  301: 'on', 302: 'on', 303: 'off', 304: 'on', 305: 'on',
  306: 'off', 307: 'on', 308: 'on', 309: 'off', 310: 'on',
  311: 'on', 312: 'off', 313: 'on', 314: 'on', 315: 'off',
  316: 'on', 317: 'on', 318: 'off', 319: 'on', 320: 'on',
  // 分娩舍保温灯
  401: 'on', 402: 'on', 403: 'off', 404: 'on', 405: 'on',
  406: 'off', 407: 'on', 408: 'on', 409: 'off', 410: 'on',
  411: 'on', 412: 'off', 413: 'on', 414: 'on', 415: 'off',
  416: 'on', 417: 'on', 418: 'off', 419: 'on', 420: 'on',
  // 中控室保温灯
  501: 'on', 502: 'on', 503: 'off', 504: 'on', 505: 'on'
}

const getDeviceStatus = (row: any) => {
  const status = allDeviceStatus[row.id]
  if (status === 'on') {
    return { type: 'success', text: '在线' }
  } else {
    return { type: 'danger', text: '离线' }
  }
}

const handleStatClick = (key: string) => {
  if (activeStat.value === key) {
    if (activeSubStat.value) {
      activeSubStat.value = ''
    } else {
      activeStat.value = ''
    }
  } else {
    activeStat.value = key
    activeSubStat.value = ''
  }
}

const handleSubStatClick = (statKey: string, subKey: string) => {
  if (activeStat.value !== statKey) {
    activeStat.value = statKey
    activeSubStat.value = subKey
  } else {
    if (activeSubStat.value === subKey) {
      activeSubStat.value = ''
    } else {
      activeSubStat.value = subKey
    }
  }
}

// 过滤后的设备列表
const filteredDeviceList = computed(() => {
  let result = deviceList.value
  
  // 先根据车间过滤
  if (selectedWorkshop.value) {
    result = result.filter(item => item.workshop === selectedWorkshop.value)
  }
  
  // 如果有激活的统计卡片，先根据类型过滤
  if (activeStat.value) {
    const type = statKeyToTypeMap[activeStat.value]
    result = result.filter(item => item.type === type)
    
    // 如果有子状态激活，根据在线/离线过滤
    if (activeSubStat.value) {
      result = result.filter(item => {
        const status = allDeviceStatus[item.id]
        if (activeSubStat.value === 'on') {
          return status === 'on'
        } else {
          return status !== 'on'
        }
      })
    }
  }
  
  // 再根据筛选条件过滤
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

// 根据车间过滤后的统计数据
const workshopDeviceStats = computed(() => {
  let filteredDevices = [...deviceList.value]
  if (selectedWorkshop.value) {
    filteredDevices = deviceList.value.filter(item => item.workshop === selectedWorkshop.value)
  }
  
  return deviceStats.value.map(stat => {
    const type = statKeyToTypeMap[stat.key]
    const count = filteredDevices.filter(item => item.type === type).length
    const onLineCount = filteredDevices.filter(item => 
      item.type === type && allDeviceStatus[item.id] === 'on'
    ).length
    const offLineCount = count - onLineCount
    
    return {
      ...stat,
      count,
      onLine: onLineCount,
      offLine: offLineCount
    }
  })
})

// 弹窗相关
const detailDialogVisible = ref(false)
const detailChartRef = ref<HTMLElement>()
let detailChart: echarts.ECharts | null = null

// 当前选中的保温灯位置
const currentLamp = ref({ row: 1, col: 1 })

// 当前选中的保温灯数据
const currentLampData = ref({
  currentTemp: 35,
  targetTemp: 38
})

// 保温灯分布图数据（模拟）
const heatLampDistribution = ref<any[]>([])

// 生成模拟的保温灯分布数据
const generateHeatLampDistribution = () => {
  const lamps: any[] = []
  // 4排5列共20个
  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= 5; col++) {
      const isOn = Math.random() > 0.3 // 70%的概率开启
      const temp = isOn ? Math.floor(30 + Math.random() * 10) : null
      lamps.push({
        row,
        col,
        isOn,
        temp
      })
    }
  }
  return lamps
}

// 获取保温灯状态
const getLampStatus = (row: number, col: number) => {
  const lamp = heatLampDistribution.value.find(l => l.row === row && l.col === col)
  return lamp ? lamp.isOn : false
}

// 获取保温灯温度
const getLampTemp = (row: number, col: number) => {
  const lamp = heatLampDistribution.value.find(l => l.row === row && l.col === col)
  return lamp ? lamp.temp : null
}

// 选择保温灯
const selectLamp = (row: number, col: number) => {
  currentLamp.value = { row, col }
  // 更新温度数据
  const lamp = heatLampDistribution.value.find(l => l.row === row && l.col === col)
  if (lamp) {
    currentLampData.value = {
      currentTemp: lamp.temp || 25,
      targetTemp: 38
    }
  }
  updateDetailChart()
}

// 查看详情
const handleViewDetail = (row: any) => {
  if (row.type === '料塔') {
    // 料塔打开新页面
    window.open('https://gt.cpzxrobot.com/#/ft/1809857942188032?name=1%23', '_blank')
    return
  }
  if (row.type !== '保温灯') {
    // 如果不是保温灯和料塔，暂时不处理
    return
  }
  // 打开弹窗
  detailDialogVisible.value = true
  // 生成分布数据
  heatLampDistribution.value = generateHeatLampDistribution()
  // 默认选中第一个
  currentLamp.value = { row: 1, col: 1 }
  const firstLamp = heatLampDistribution.value.find(l => l.row === 1 && l.col === 1)
  if (firstLamp) {
    currentLampData.value = {
      currentTemp: firstLamp.temp || 25,
      targetTemp: 38
    }
  }
  // 等待DOM更新后渲染图表
  nextTick(() => {
    initDetailChart()
  })
}

const { resizeCharts, observeContainers } = useChartResize(
  () => [detailChart],
  () => [detailChartRef.value]
)

// 初始化详情图表
const initDetailChart = () => {
  if (!detailChartRef.value) return
  detailChart?.dispose()
  detailChart = echarts.init(detailChartRef.value)
  updateDetailChart()
  nextTick(() => {
    observeContainers()
    resizeCharts()
  })
}

onUnmounted(() => {
  detailChart?.dispose()
})

// 更新详情图表
const updateDetailChart = () => {
  if (!detailChart) return
  // 生成近12小时每15分钟一个数据（共48个数据点）
  const hours = []
  const data = []
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    hours.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    data.push(30 + Math.floor(Math.random() * 10))
  }
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours,
      axisLabel: {
        interval: 3, // 每4个显示一个标签
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: 20,
      max: 45,
      name: '温度(°C)'
    },
    series: [
      {
        name: '温度',
        type: 'line',
        smooth: true,
        data: data,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 165, 0, 0.5)' },
            { offset: 1, color: 'rgba(255, 165, 0, 0.1)' }
          ])
        },
        lineStyle: {
          color: '#ff9800',
          width: 2
        },
        itemStyle: {
          color: '#ff9800'
        }
      }
    ]
  }
  detailChart.setOption(option)
}
</script>

<style scoped>
.device-content {
  padding-bottom: 24px;
}

.content-header {
  margin-bottom: 20px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  flex-shrink: 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-card.active {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
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

/* 智能花洒在线/离线垂直排列在右侧 */
.stat-sub-info-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 12px;
}

.stat-sub-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.stat-sub-item.on {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.stat-sub-item.on:hover {
  background: rgba(82, 196, 26, 0.2);
}

.stat-sub-item.on.active {
  background: rgba(82, 196, 26, 0.2);
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

.stat-sub-item.off {
  background: rgba(250, 84, 28, 0.1);
  color: #fa541c;
}

.stat-sub-item.off:hover {
  background: rgba(250, 84, 28, 0.2);
}

.stat-sub-item.off.active {
  background: rgba(250, 84, 28, 0.2);
  border-color: #fa541c;
  box-shadow: 0 0 0 2px rgba(250, 84, 28, 0.2);
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
  flex-shrink: 0;
}

.list-panel {
  display: flex;
  flex-direction: column;
}

.table-container {
  width: 100%;
}

/* 弹窗样式 */
:deep(.heat-lamp-detail-dialog .el-dialog) {
  max-height: 80vh;
  margin-top: 10vh !important;
}

:deep(.heat-lamp-detail-dialog .el-dialog__body) {
  max-height: calc(80vh - 85px);
  overflow-y: auto;
  padding: 20px;
}

.detail-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.distribution-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.distribution-container {
  display: grid;
  grid-template-columns: auto repeat(5, 1fr);
  gap: 10px;
  max-width: 600px;
}

.row-header {
  width: 60px;
}

.col-header {
  text-align: center;
  font-weight: 600;
  color: #606266;
  padding: 5px;
}

.row-label {
  text-align: center;
  font-weight: 600;
  color: #606266;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heat-lamp-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #dcdfe6;
  background: #f5f7fa;
}

.heat-lamp-cell:hover {
  transform: scale(1.05);
}

.heat-lamp-cell.is-on {
  background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%);
  border-color: #ff9800;
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.4);
}

.heat-lamp-cell.active {
  border: 3px solid #1890ff !important;
  box-shadow: 0 0 20px rgba(24, 144, 255, 0.5) !important;
}

.lamp-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #909399;
}

.heat-lamp-cell.is-on .lamp-icon {
  background: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.lamp-temp {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.heat-lamp-cell:not(.is-on) .lamp-temp {
  display: none;
}

.data-section {
  padding-top: 10px;
}

.data-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.data-item {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.data-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.data-value {
  font-size: 24px;
  font-weight: 600;
  color: #ff9800;
}

.detail-chart {
  width: 100%;
  height: 300px;
}
</style>