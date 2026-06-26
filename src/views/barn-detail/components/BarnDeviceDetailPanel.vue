<template>
<div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Setting /></el-icon> 设备详情</div>
          <span class="panel-meta">在线 {{ deviceOnlineCount }}/{{ deviceList.length }}</span>
        </div>
        <div class="device-grid">
          <div
            v-for="device in deviceList"
            :key="device.id"
            class="device-card"
            :class="{ offline: !device.online }"
          >
            <div class="device-card-header">
              <div class="device-info">
                <span class="device-name">{{ device.name }}</span>
                <span class="device-type">{{ device.type }}</span>
              </div>
              <el-tag :type="device.online ? 'success' : 'info'" size="small">
                {{ device.online ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="device-body">
              <div class="device-fields">
                <div class="device-field">
                  <span class="device-field-label">编号</span>
                  <span class="device-field-value mono">{{ device.uuid }}</span>
                </div>
                <div class="device-field">
                  <span class="device-field-label">功能</span>
                  <span class="device-field-value">{{ device.attribute }}</span>
                </div>
                <div v-if="device.controllable" class="device-field">
                  <span class="device-field-label">开关状态</span>
                  <span class="device-field-value">
                    <el-tag :type="device.on ? 'success' : 'info'" size="small">{{ device.on ? '开' : '关' }}</el-tag>
                  </span>
                </div>
              </div>

              <div v-if="device.on && device.online && device.extra" class="device-section">
                <div class="device-section-title">运行参数</div>
                <div class="device-fields">
                  <div v-for="(val, key) in device.extra" :key="key" class="device-field compact">
                    <span class="device-field-label">{{ extraLabelMap[key] || key }}</span>
                    <span class="device-field-value highlight">{{ formatExtraValue(key, val) }}</span>
                  </div>
                </div>
              </div>

              <div class="device-section">
                <div class="device-section-title">维保信息</div>
                <div class="device-fields maintain-fields">
                  <div class="device-field compact">
                    <span class="device-field-label">故障次数</span>
                    <span class="device-field-value">{{ device.faultCount }} 次</span>
                  </div>
                  <div class="device-field compact">
                    <span class="device-field-label">下次保养</span>
                    <span class="device-field-value nowrap">{{ device.nextMaintainDate }}</span>
                  </div>
                  <div class="device-field compact">
                    <span class="device-field-label">维保状态</span>
                    <span class="device-field-value">
                      <el-tag :type="maintainTagType(device.maintainStatus)" size="small">{{ device.maintainStatus }}</el-tag>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  deviceOnlineCount,
  deviceList,
  extraLabelMap,
  formatExtraValue,
  maintainTagType,
} = ctx
</script>
