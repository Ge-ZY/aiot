<template>
<div class="panel device-mgmt-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Monitor /></el-icon> 设备管理</div>
        </div>

        <!-- 1. 在线情况 -->
        <div class="bio-block">
          <div class="bio-block-title">在线情况</div>
          <div class="online-summary">
            <div class="online-rate-row">
              <span class="online-rate-label">设备在线率</span>
              <span class="online-rate-value" :class="{ warn: deviceOnlineRate < 90 }">{{ deviceOnlineRate }}%</span>
              <span class="online-rate-meta">在线 {{ deviceOnlineCount }} / 共 {{ deviceList.length }} 台</span>
            </div>
            <el-progress
              :percentage="deviceOnlineRate"
              :stroke-width="10"
              :color="deviceOnlineRate >= 90 ? '#67c23a' : deviceOnlineRate >= 75 ? '#e6a23c' : '#f56c6c'"
            />
          </div>
          <div class="offline-section">
            <div class="bio-block-title sub">离线设备列表</div>
            <el-table v-if="offlineDevices.length" :data="offlineDevices" size="small" stripe class="bio-table">
              <el-table-column prop="name" label="设备名称" min-width="120" />
              <el-table-column prop="type" label="类型" width="90" />
              <el-table-column prop="uuid" label="编号" width="130" />
              <el-table-column prop="attribute" label="功能" width="100" />
              <el-table-column prop="offlineSince" label="离线时长" width="100" />
            </el-table>
            <div v-else class="bp-empty-hint">暂无离线设备</div>
          </div>
        </div>

        <!-- 2. 运行参数 -->
        <div class="bio-block">
          <div class="bio-block-title">运行参数</div>
          <el-table v-if="deviceRunningParams.length" :data="deviceRunningParams" size="small" stripe class="bio-table">
            <el-table-column prop="deviceName" label="设备" min-width="120" />
            <el-table-column prop="deviceType" label="类型" width="90" />
            <el-table-column prop="paramName" label="参数" width="100" />
            <el-table-column prop="paramValue" label="当前值" width="120" />
            <el-table-column prop="runStatus" label="开关状态" width="90">
              <template #default="{ row }">
                <el-tag
                  v-if="row.runStatus === '监测中'"
                  type="primary"
                  size="small"
                >监测中</el-tag>
                <el-tag
                  v-else
                  :type="row.runStatus === '开' ? 'success' : 'info'"
                  size="small"
                >{{ row.runStatus }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="bp-empty-hint">暂无运行参数数据</div>
        </div>

        <!-- 3. 故障报警 -->
        <div class="bio-block">
          <div class="bio-block-title">故障报警</div>
          <div v-if="deviceFaultAlarms.length" class="bio-alarm-list">
            <div v-for="alarm in deviceFaultAlarms" :key="alarm.id" class="bio-alarm-item">
              <div class="bio-alarm-top">
                <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                <span class="bio-alarm-disease">{{ alarm.deviceName }} · {{ alarm.faultType }}</span>
                <el-tag size="small" :type="epidemicStatusTag(alarm.status)">{{ alarm.status }}</el-tag>
                <span class="intake-alarm-time">{{ alarm.time }}</span>
              </div>
              <div class="bio-alarm-desc">{{ alarm.description }}</div>
            </div>
          </div>
          <div v-else class="bp-empty-hint">暂无故障报警</div>
        </div>

        <!-- 4. 设备详情（已有板块，仅指引） -->
        <div class="bio-block">
          <div class="bio-block-title">设备详情</div>
          <div class="bp-ref-hint">
            <el-icon><InfoFilled /></el-icon>
            设备卡片、运行状态及维保信息见下方「设备详情」板块
          </div>
        </div>
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { Monitor, InfoFilled } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  deviceOnlineRate,
  deviceOnlineCount,
  deviceList,
  offlineDevices,
  deviceRunningParams,
  deviceFaultAlarms,
  epidemicStatusTag,
} = ctx
</script>
