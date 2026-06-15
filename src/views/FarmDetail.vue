<template>
  <LayoutWithSidebar>
    <div class="farm-detail-content">
      <!-- 页头：场类型筛选 + 工厂信息 -->
      <div class="content-header">
        <div class="header-main">
          <h2>{{ currentFactory || '请选择工厂' }}</h2>
          <el-tag v-if="hasFactory" type="info" size="small">{{ factoryTypeLabel }}</el-tag>
          <el-tag v-if="hasFactory" :type="factoryStatusTag.type" size="small">{{ factoryStatusTag.text }}</el-tag>
        </div>
        <div class="header-actions">
          <el-radio-group v-model="selectedFactoryType" size="small" class="type-filter">
            <el-radio-button v-for="t in factoryTypes" :key="t.value" :label="t.value">
              {{ t.label }}
            </el-radio-button>
          </el-radio-group>
          <template v-if="hasFactory">
            <el-button size="small" @click="goToDashboard">监控大屏</el-button>
            <el-button size="small" @click="goToAlarmDetail">报警详情</el-button>
            <el-button size="small" @click="goToDeviceDetail">设备详情</el-button>
          </template>
        </div>
      </div>

      <!-- 未选工厂：骨架屏 -->
      <div v-if="!hasFactory" class="empty-state">
        <div class="skeleton-layout">
          <el-skeleton animated>
            <template #template>
              <div class="sk-kpi-row">
                <el-skeleton-item v-for="i in 6" :key="i" variant="rect" class="sk-kpi" />
              </div>
              <div class="sk-body-row">
                <el-skeleton-item variant="rect" class="sk-chart" />
                <el-skeleton-item variant="rect" class="sk-alarm" />
              </div>
              <div class="sk-barn-row">
                <el-skeleton-item v-for="i in 4" :key="i" variant="rect" class="sk-barn" />
              </div>
            </template>
          </el-skeleton>
        </div>
        <div class="empty-hint">
          <el-icon :size="48" color="#c0c4cc"><OfficeBuilding /></el-icon>
          <p class="empty-title">请选择工厂</p>
          <p class="empty-desc">从左侧组织树选择{{ factoryTypeLabel }}，或使用上方按钮切换场类型</p>
        </div>
      </div>

      <!-- 已选工厂：详情内容 -->
      <template v-else>
        <!-- 今日生产看板 -->
        <div class="panel today-briefing">
          <div class="panel-header-row">
            <div class="panel-title">今日生产看板</div>
            <span class="panel-meta">{{ todayDate }} · 晨会数据</span>
          </div>
          <div class="briefing-grid">
            <div v-for="item in todayBriefingItems" :key="item.key" class="briefing-card" :class="item.cardClass">
              <div class="briefing-value" :class="item.valueClass">{{ item.value }}</div>
              <div class="briefing-label">{{ item.label }}</div>
              <div v-if="item.change" class="briefing-change" :class="item.changeClass">{{ item.change }}</div>
            </div>
          </div>
        </div>

        <!-- 环境达标摘要 -->
        <div class="env-summary-row">
          <div class="env-summary-card">
            <span class="env-summary-label">全厂环境达标率</span>
            <span class="env-summary-value">{{ envCompliance.overallRate }}%</span>
            <el-progress :percentage="envCompliance.overallRate" :stroke-width="6" :show-text="false" />
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">异常栏舍</span>
            <span class="env-summary-value warn">{{ envCompliance.abnormalBarnCount }} 个</span>
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">最差舍 / 偏离时长</span>
            <span class="env-summary-value">{{ envCompliance.worstBarn }} · {{ envCompliance.worstDuration }}</span>
          </div>
          <div class="env-summary-card">
            <span class="env-summary-label">未处理报警</span>
            <span class="env-summary-value alarm">{{ unprocessedAlarmCount }} 条</span>
          </div>
        </div>

        <!-- KPI 条 -->
        <div class="kpi-row">
          <div
            v-for="item in kpiItems"
            :key="item.key"
            class="kpi-card"
            :class="{ active: activeKpiFilter === item.key }"
            @click="selectKpiFilter(item.key)"
          >
            <div class="kpi-value" :class="item.valueClass">{{ factoryKpi[item.valueKey] }}</div>
            <div class="kpi-label">{{ item.label }}</div>
          </div>
        </div>

        <!-- 经营效益 -->
        <div class="panel business-panel">
          <div class="panel-header-row">
            <div class="panel-title">经营效益</div>
            <span class="panel-meta">本月累计 · 截至 {{ todayDate }}</span>
          </div>

          <!-- 经营总览 -->
          <div class="business-section">
            <div class="business-section-title">经营总览</div>
            <div class="business-overview-grid">
              <div
                v-for="item in businessOverviewItems"
                :key="item.key"
                class="business-overview-card"
              >
                <div class="business-overview-value">
                  {{ item.value }}<span class="unit">{{ item.unit }}</span>
                </div>
                <div class="business-overview-label">{{ item.label }}</div>
                <div v-if="item.change" class="business-overview-change" :class="item.changeUp ? 'up' : 'down'">
                  {{ item.change }}
                </div>
              </div>
            </div>
          </div>

          <!-- 成本分析 -->
          <div class="business-section">
            <div class="business-section-header">
              <div class="business-section-title">成本分析</div>
              <div class="business-section-meta">
                总成本 {{ businessBenefit.costAnalysis.totalCost }} {{ businessBenefit.costAnalysis.totalUnit }}
                · {{ businessBenefit.costAnalysis.unitCostLabel }}
                {{ businessBenefit.costAnalysis.unitCost }} 元
              </div>
            </div>
            <el-table :data="businessBenefit.costAnalysis.items" size="small" stripe class="business-table">
              <el-table-column prop="name" label="成本项" min-width="120" />
              <el-table-column label="金额（万元）" width="120">
                <template #default="{ row }">{{ row.amount }}</template>
              </el-table-column>
              <el-table-column label="占比" width="100">
                <template #default="{ row }">{{ row.ratio }}%</template>
              </el-table-column>
              <el-table-column label="较上月" width="100">
                <template #default="{ row }">
                  <span :class="row.changePercent > 0 ? 'change-up' : row.changePercent < 0 ? 'change-down' : ''">
                    {{ row.changePercent > 0 ? '+' : '' }}{{ row.changePercent }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 销售业绩 -->
          <div class="business-section">
            <div class="business-section-title">销售业绩</div>
            <div class="sales-kpi-row">
              <div class="sales-kpi-card">
                <div class="sales-kpi-value">{{ businessBenefit.salesPerformance.volume }}</div>
                <div class="sales-kpi-label">
                  {{ businessBenefit.salesPerformance.volumeLabel }}（{{ businessBenefit.salesPerformance.volumeUnit }}）
                </div>
                <div class="sales-kpi-change" :class="businessBenefit.salesPerformance.volumeChange >= 0 ? 'up' : 'down'">
                  较上月 {{ businessBenefit.salesPerformance.volumeChange >= 0 ? '+' : '' }}{{ businessBenefit.salesPerformance.volumeChange }}%
                </div>
              </div>
              <div class="sales-kpi-card primary">
                <div class="sales-kpi-value">{{ businessBenefit.salesPerformance.revenue }}</div>
                <div class="sales-kpi-label">销售额（{{ businessBenefit.salesPerformance.revenueUnit }}）</div>
                <div class="sales-kpi-change" :class="businessBenefit.salesPerformance.revenueChange >= 0 ? 'up' : 'down'">
                  较上月 {{ businessBenefit.salesPerformance.revenueChange >= 0 ? '+' : '' }}{{ businessBenefit.salesPerformance.revenueChange }}%
                </div>
              </div>
            </div>
            <el-table :data="businessBenefit.salesPerformance.details" size="small" stripe class="business-table">
              <el-table-column prop="product" label="品类" min-width="140" />
              <el-table-column prop="volume" label="销量" width="140" />
              <el-table-column prop="revenue" label="销售额" width="140" />
            </el-table>
          </div>
        </div>

        <!-- 中部：趋势 + 报警列表 -->
        <div class="middle-section">
          <div class="panel chart-panel">
            <div class="panel-header-row">
              <div class="panel-title">数据监测</div>
              <div class="panel-actions">
                <el-select v-model="selectedBarnFilter" placeholder="全部舍" size="small" style="width: 120px; margin-right: 8px;" clearable>
                  <el-option label="全厂均值" value="" />
                  <el-option v-for="b in barnList" :key="b.id" :label="displayBarnName(b.name)" :value="b.id" />
                </el-select>
                <el-select v-if="selectedFactoryType === 'chicken'" v-model="chickenType" placeholder="品种" size="small" style="width: 100px;">
                  <el-option label="肉鸡" value="broiler" />
                  <el-option label="蛋鸡" value="layer" />
                </el-select>
                <el-select v-if="selectedFactoryType === 'aquatic'" v-model="aquaticType" placeholder="品种" size="small" style="width: 100px;">
                  <el-option label="鱼" value="fish" />
                  <el-option label="虾" value="shrimp" />
                </el-select>
              </div>
            </div>
            <div ref="chartRef" class="chart-container"></div>
          </div>

          <div class="panel alarm-panel">
            <div class="panel-header-row">
              <div class="panel-title">本厂报警</div>
              <span class="alarm-badge">{{ filteredAlarms.length }} 条</span>
            </div>
            <div class="alarm-list">
              <div v-if="filteredAlarms.length === 0" class="alarm-empty">暂无报警</div>
              <div
                v-for="alarm in filteredAlarms"
                :key="alarm.id"
                class="alarm-item"
                @click="goToBarnDetailFromAlarm(alarm)"
              >
                <div class="alarm-item-top">
                  <span class="alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                  <el-tag :type="alarmHandleTagType(alarm.handleStatus)" size="small">{{ alarm.handleStatus }}</el-tag>
                  <span class="alarm-time">{{ alarm.time }}</span>
                </div>
                <div class="alarm-barn">{{ displayBarnName(alarm.barnName) }}</div>
                <div class="alarm-desc">{{ alarm.type }}：{{ alarm.description }}</div>
                <div class="alarm-workflow">
                  <span>负责人：{{ alarm.assignee }}</span>
                  <span v-if="alarm.duration !== '—'">持续 {{ alarm.duration }}</span>
                  <span v-if="alarm.respondedAt">响应 {{ alarm.respondedAt }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 厂区监控 -->
        <div class="panel camera-section">
          <CameraPanel :cameras="factoryCameraList" title="厂区监控" />
        </div>

        <!-- 订单详情 -->
        <div class="panel order-section">
          <div class="panel-header-row">
            <div class="panel-title">订单详情</div>
            <div class="order-summary-tags">
              <span class="order-stat-tag">今日待交 {{ orderFulfillment.todayDue }} 笔</span>
              <span class="order-stat-tag success">已完成 {{ orderFulfillment.todayCompleted }} 笔</span>
              <span class="order-stat-tag">本周履约率 {{ orderFulfillment.weekRate }}%</span>
              <span class="order-stat-tag">本月履约率 {{ orderFulfillment.monthRate }}%</span>
              <span v-if="overdueOrderCount > 0" class="order-overdue-badge">{{ overdueOrderCount }} 笔逾期</span>
            </div>
          </div>
          <el-table
            :data="factoryOrders"
            stripe
            size="small"
            class="order-table"
            empty-text="暂无订单"
          >
            <el-table-column prop="orderNo" label="订单号" width="140" />
            <el-table-column prop="orderTime" label="下单时间" min-width="150" />
            <el-table-column prop="deliveryTime" label="交货时间" min-width="150" />
            <el-table-column label="逾期时间" min-width="160">
              <template #default="{ row }">
                <span v-if="row.overdueDays > 0" class="overdue-text">
                  {{ row.overdueTime }}
                  <el-tag type="danger" size="small" class="overdue-tag">逾期 {{ row.overdueDays }} 天</el-tag>
                </span>
                <span v-else class="no-overdue">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="contactName" label="联系人" width="100" />
            <el-table-column label="联系人电话" min-width="130">
              <template #default="{ row }">
                <a :href="`tel:${row.contactPhone}`" class="contact-phone">{{ row.contactPhone }}</a>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '已逾期' ? 'danger' : row.status === '即将到期' ? 'warning' : 'success'"
                  size="small"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 舍列表 -->
        <div class="barn-section">
          <div class="section-title">
            {{ barnSectionTitle }}
            <span class="section-sub">{{ filteredBarnList.length }} 个</span>
          </div>
          <div class="barn-grid">
            <div
              v-for="barn in filteredBarnList"
              :key="barn.id"
              class="panel barn-panel"
              :class="{ alarm: barn.status === '告警' }"
              @click="goToBarnDetail(barn)"
            >
              <div class="barn-header">
                <div class="barn-title">
                  <span class="barn-name">{{ displayBarnName(barn.name) }}</span>
                  <el-tag :type="barn.status === '正常' ? 'success' : 'danger'" size="small">
                    {{ barn.status }}
                  </el-tag>
                </div>
                <el-icon class="barn-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="barn-metrics">
                <div class="barn-stat">
                  <span class="label">{{ bioLabel }}</span>
                  <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.oxygen : barn.stock }}</span>
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
                  <span class="label">{{ envLabel4 }}</span>
                  <span class="value">{{ selectedFactoryType === 'aquatic' ? barn.ph : barn.ventilation }}{{ selectedFactoryType === 'aquatic' ? '' : '%' }}</span>
                </div>
              </div>
              <div class="barn-footer">
                <span class="device-info">
                  设备 {{ barn.deviceOnline }}/{{ barn.deviceTotal }}
                </span>
                <span v-if="barn.alarmCount > 0" class="alarm-count">{{ barn.alarmCount }} 条报警</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </LayoutWithSidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { OfficeBuilding, ArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import LayoutWithSidebar from '@/components/LayoutWithSidebar.vue'
import CameraPanel from '@/components/CameraPanel.vue'
import { useCompanyTree } from '@/composables/useCompanyTree'
import { useChartResize } from '@/composables/useChartResize'
import { factoryCameras } from '@/utils/cameraMockData'
import {
  getTodayProduction,
  getEnvCompliance,
  getOrderFulfillment,
  getBusinessBenefit,
  type AlarmHandleStatus,
} from '@/utils/farmOperationsMock'

interface BarnItem {
  id: number
  name: string
  status: '正常' | '告警'
  stock: number
  temp: number
  humidity: number
  ventilation: number
  oxygen: number
  ph: number
  alarmCount: number
  deviceOnline: number
  deviceTotal: number
  dailyDead: number
  totalDead: number
  sickCount: number
  deadFromDisease: number
  relapseCount: number
  medicineUsed: number
  pigFeedOutput: number
  chickenFeedOutput: number
  aquaticFeedOutput: number
  pigFeedShipment: number
  chickenFeedShipment: number
  aquaticFeedShipment: number
}

interface FactoryAlarm {
  id: number
  barnId: number
  barnName: string
  type: string
  description: string
  level: '严重' | '一般' | '提示'
  time: string
  processed: boolean
  assignee: string
  handleStatus: AlarmHandleStatus
  duration: string
  respondedAt?: string
}

interface FactoryOrder {
  id: string
  orderNo: string
  orderTime: string
  deliveryTime: string
  overdueTime: string | null
  overdueDays: number
  contactName: string
  contactPhone: string
  status: '正常' | '即将到期' | '已逾期'
}

type KpiFilter = 'barnTotal' | 'abnormalBarn' | 'total' | 'severe' | 'offline' | 'bio' | 'dailyDead' | 'totalDead' | 'mortalityRate' | 'morbidityRate' | 'caseFatalityRate' | 'relapseRate' | 'medicineUsed' | 'pigFeedOutput' | 'chickenFeedOutput' | 'aquaticFeedOutput' | 'pigFeedShipment' | 'chickenFeedShipment' | 'aquaticFeedShipment' | 'totalFeedOutput' | 'totalFeedShipment'

const router = useRouter()
const route = useRoute()

const {
  selectedFactoryType,
  currentFactory,
  factoryTypes,
} = useCompanyTree()

const chickenType = ref('broiler')
const aquaticType = ref('fish')
const selectedBarnFilter = ref<number | ''>('')
const activeKpiFilter = ref<KpiFilter>('total')
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const hasFactory = computed(() => !!currentFactory.value)

const factoryTypeLabel = computed(() =>
  factoryTypes.find(t => t.value === selectedFactoryType.value)?.label ?? '工厂'
)

const barnSectionTitle = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return '养殖池列表'
  if (selectedFactoryType.value === 'chicken') return '鸡舍列表'
  if (selectedFactoryType.value === 'feed') return '生产车间列表'
  return '栏舍列表'
})

const bioLabel = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return '溶氧'
  if (selectedFactoryType.value === 'feed') return '产量'
  return '存栏'
})

const envLabel4 = computed(() => {
  if (selectedFactoryType.value === 'aquatic') return 'PH值'
  if (selectedFactoryType.value === 'feed') return '出货量'
  return '通风'
})

const displayBarnName = (name: string) => {
  if (selectedFactoryType.value === 'aquatic') return name.replace('保育舍', '养殖池').replace('分娩舍', '车间')
  if (selectedFactoryType.value === 'feed') return name.replace('保育舍', '车间').replace('分娩舍', '仓库')
  return name
}
// 按场类型的 mock 舍数据
const barnDataByType: Record<string, BarnItem[]> = {
  pig: [
    { id: 1, name: '保育舍1', status: '正常', stock: 1200, temp: 24, humidity: 65, ventilation: 80, oxygen: 85, ph: 7.2, alarmCount: 0, deviceOnline: 12, deviceTotal: 12, dailyDead: 2, totalDead: 35, sickCount: 15, deadFromDisease: 8, relapseCount: 3, medicineUsed: 120, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 2, name: '保育舍2', status: '正常', stock: 1150, temp: 25, humidity: 62, ventilation: 75, oxygen: 82, ph: 7.1, alarmCount: 0, deviceOnline: 11, deviceTotal: 12, dailyDead: 1, totalDead: 28, sickCount: 12, deadFromDisease: 5, relapseCount: 2, medicineUsed: 98, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 3, name: '保育舍3', status: '正常', stock: 1100, temp: 24, humidity: 68, ventilation: 82, oxygen: 88, ph: 7.3, alarmCount: 0, deviceOnline: 12, deviceTotal: 12, dailyDead: 0, totalDead: 42, sickCount: 8, deadFromDisease: 12, relapseCount: 1, medicineUsed: 75, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 4, name: '保育舍4', status: '告警', stock: 1080, temp: 27, humidity: 78, ventilation: 55, oxygen: 72, ph: 6.8, alarmCount: 2, deviceOnline: 10, deviceTotal: 12, dailyDead: 5, totalDead: 58, sickCount: 35, deadFromDisease: 18, relapseCount: 8, medicineUsed: 256, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 5, name: '分娩舍1', status: '正常', stock: 580, temp: 26, humidity: 70, ventilation: 85, oxygen: 90, ph: 7.4, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 1, totalDead: 15, sickCount: 5, deadFromDisease: 3, relapseCount: 1, medicineUsed: 45, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 6, name: '分娩舍2', status: '告警', stock: 620, temp: 28, humidity: 75, ventilation: 60, oxygen: 68, ph: 6.5, alarmCount: 1, deviceOnline: 7, deviceTotal: 8, dailyDead: 3, totalDead: 22, sickCount: 18, deadFromDisease: 7, relapseCount: 4, medicineUsed: 135, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 7, name: '分娩舍3', status: '正常', stock: 550, temp: 25, humidity: 68, ventilation: 88, oxygen: 86, ph: 7.2, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 18, sickCount: 4, deadFromDisease: 4, relapseCount: 0, medicineUsed: 38, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 8, name: '分娩舍4', status: '正常', stock: 560, temp: 26, humidity: 72, ventilation: 83, oxygen: 83, ph: 7.1, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 2, totalDead: 20, sickCount: 6, deadFromDisease: 5, relapseCount: 2, medicineUsed: 52, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  chicken: [
    { id: 101, name: '蛋鸡舍1', status: '正常', stock: 8000, temp: 22, humidity: 60, ventilation: 90, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 10, deviceTotal: 10, dailyDead: 15, totalDead: 380, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 102, name: '蛋鸡舍2', status: '告警', stock: 7800, temp: 26, humidity: 72, ventilation: 65, oxygen: 0, ph: 0, alarmCount: 2, deviceOnline: 8, deviceTotal: 10, dailyDead: 28, totalDead: 450, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 103, name: '肉鸡舍1', status: '正常', stock: 12000, temp: 23, humidity: 58, ventilation: 88, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 14, deviceTotal: 14, dailyDead: 35, totalDead: 680, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 104, name: '肉鸡舍2', status: '告警', stock: 11500, temp: 27, humidity: 75, ventilation: 55, oxygen: 0, ph: 0, alarmCount: 1, deviceOnline: 12, deviceTotal: 14, dailyDead: 42, totalDead: 720, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 105, name: '育雏舍1', status: '正常', stock: 6000, temp: 28, humidity: 65, ventilation: 80, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 20, totalDead: 320, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  aquatic: [
    { id: 201, name: '养殖池1', status: '正常', stock: 0, temp: 24, humidity: 0, ventilation: 0, oxygen: 6.8, ph: 7.2, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 202, name: '养殖池2', status: '正常', stock: 0, temp: 25, humidity: 0, ventilation: 0, oxygen: 7.1, ph: 7.0, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 203, name: '养殖池3', status: '告警', stock: 0, temp: 26, humidity: 0, ventilation: 0, oxygen: 4.2, ph: 8.5, alarmCount: 2, deviceOnline: 5, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 204, name: '养殖池4', status: '正常', stock: 0, temp: 24, humidity: 0, ventilation: 0, oxygen: 6.5, ph: 7.1, alarmCount: 0, deviceOnline: 6, deviceTotal: 6, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
  feed: [
    { id: 301, name: '猪饲料车间', status: '正常', stock: 0, temp: 25, humidity: 45, ventilation: 70, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 2500, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 2300, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
    { id: 302, name: '鸡饲料车间', status: '正常', stock: 0, temp: 24, humidity: 42, ventilation: 75, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 8, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 3200, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 3000, aquaticFeedShipment: 0 },
    { id: 303, name: '水产饲料车间', status: '告警', stock: 0, temp: 26, humidity: 50, ventilation: 60, oxygen: 0, ph: 0, alarmCount: 1, deviceOnline: 6, deviceTotal: 8, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 1800, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 1650 },
    { id: 304, name: '成品仓库', status: '正常', stock: 0, temp: 23, humidity: 40, ventilation: 65, oxygen: 0, ph: 0, alarmCount: 0, deviceOnline: 4, deviceTotal: 4, dailyDead: 0, totalDead: 0, sickCount: 0, deadFromDisease: 0, relapseCount: 0, medicineUsed: 0, pigFeedOutput: 0, chickenFeedOutput: 0, aquaticFeedOutput: 0, pigFeedShipment: 0, chickenFeedShipment: 0, aquaticFeedShipment: 0 },
  ],
}

const alarmDataByType: Record<string, FactoryAlarm[]> = {
  pig: [
    { id: 1, barnId: 4, barnName: '保育舍4', type: '温度异常', description: '温度超过阈值，当前27°C', level: '严重', time: '10:32', processed: false, assignee: '张工', handleStatus: '待处理', duration: '2小时15分' },
    { id: 2, barnId: 4, barnName: '保育舍4', type: '通风不足', description: '通风量低于标准值', level: '一般', time: '10:15', processed: false, assignee: '李主管', handleStatus: '处理中', duration: '45分', respondedAt: '10:05' },
    { id: 3, barnId: 6, barnName: '分娩舍2', type: '湿度异常', description: '湿度过高，当前75%', level: '严重', time: '09:48', processed: false, assignee: '王巡检', handleStatus: '待处理', duration: '1小时30分' },
  ],
  chicken: [
    { id: 11, barnId: 102, barnName: '蛋鸡舍2', type: '氨气超标', description: '氨气浓度超标', level: '严重', time: '10:20', processed: false, assignee: '张工', handleStatus: '待处理', duration: '2小时05分' },
    { id: 12, barnId: 102, barnName: '蛋鸡舍2', type: '温度异常', description: '温度26°C超限', level: '一般', time: '09:55', processed: false, assignee: '李主管', handleStatus: '处理中', duration: '30分', respondedAt: '09:50' },
    { id: 13, barnId: 104, barnName: '肉鸡舍2', type: '通风故障', description: '风机运行异常', level: '严重', time: '09:30', processed: false, assignee: '赵技术员', handleStatus: '待处理', duration: '3小时10分' },
  ],
  aquatic: [
    { id: 21, barnId: 203, barnName: '养殖池3', type: '溶氧偏低', description: '溶氧量4.2mg/L', level: '严重', time: '10:10', processed: false, assignee: '周工', handleStatus: '待处理', duration: '1小时50分' },
    { id: 22, barnId: 203, barnName: '养殖池3', type: 'pH异常', description: 'pH值8.5超出范围', level: '一般', time: '09:40', processed: false, assignee: '吴主管', handleStatus: '处理中', duration: '20分', respondedAt: '09:35' },
  ],
  feed: [
    { id: 31, barnId: 301, barnName: '制粒车间1', type: '温度异常', description: '制粒机出口温度超限', level: '严重', time: '10:25', processed: false, assignee: '陈工', handleStatus: '待处理', duration: '1小时40分' },
    { id: 32, barnId: 302, barnName: '混合车间2', type: '粉尘超标', description: '车间粉尘浓度偏高', level: '一般', time: '09:50', processed: false, assignee: '刘主管', handleStatus: '处理中', duration: '35分', respondedAt: '09:42' },
    { id: 33, barnId: 303, barnName: '成品仓', type: '湿度异常', description: '成品仓湿度超过标准', level: '提示', time: '08:30', processed: true, assignee: '系统自动', handleStatus: '已关闭', duration: '—' },
  ],
}

const orderDataByType: Record<string, FactoryOrder[]> = {
  pig: [
    { id: '1', orderNo: 'PO-202505-001', orderTime: '2025-05-08 09:30', deliveryTime: '2025-05-20 18:00', overdueTime: '2025-05-20 18:00', overdueDays: 1, contactName: '张经理', contactPhone: '138-0013-8001', status: '已逾期' },
    { id: '2', orderNo: 'PO-202505-002', orderTime: '2025-05-10 14:20', deliveryTime: '2025-05-22 12:00', overdueTime: null, overdueDays: 0, contactName: '李主管', contactPhone: '139-0013-9002', status: '即将到期' },
    { id: '3', orderNo: 'PO-202505-003', orderTime: '2025-05-12 11:00', deliveryTime: '2025-05-28 17:00', overdueTime: null, overdueDays: 0, contactName: '王采购', contactPhone: '137-0013-7003', status: '正常' },
    { id: '4', orderNo: 'PO-202504-018', orderTime: '2025-04-25 16:45', deliveryTime: '2025-05-15 10:00', overdueTime: '2025-05-15 10:00', overdueDays: 6, contactName: '赵主任', contactPhone: '136-0013-6004', status: '已逾期' },
  ],
  chicken: [
    { id: '11', orderNo: 'PO-202505-011', orderTime: '2025-05-09 08:15', deliveryTime: '2025-05-21 16:00', overdueTime: null, overdueDays: 0, contactName: '陈场长', contactPhone: '135-0013-5005', status: '正常' },
    { id: '12', orderNo: 'PO-202505-012', orderTime: '2025-05-11 10:30', deliveryTime: '2025-05-23 09:00', overdueTime: null, overdueDays: 0, contactName: '刘供应', contactPhone: '134-0013-4006', status: '即将到期' },
    { id: '13', orderNo: 'PO-202504-022', orderTime: '2025-04-20 13:00', deliveryTime: '2025-05-18 14:00', overdueTime: '2025-05-18 14:00', overdueDays: 3, contactName: '孙经理', contactPhone: '133-0013-3007', status: '已逾期' },
  ],
  aquatic: [
    { id: '21', orderNo: 'PO-202505-021', orderTime: '2025-05-07 15:20', deliveryTime: '2025-05-25 11:00', overdueTime: null, overdueDays: 0, contactName: '周技术员', contactPhone: '132-0013-2008', status: '正常' },
    { id: '22', orderNo: 'PO-202505-022', orderTime: '2025-05-13 09:40', deliveryTime: '2025-05-21 08:00', overdueTime: null, overdueDays: 0, contactName: '吴采购', contactPhone: '131-0013-1009', status: '即将到期' },
    { id: '23', orderNo: 'PO-202504-015', orderTime: '2025-04-18 11:30', deliveryTime: '2025-05-10 17:00', overdueTime: '2025-05-10 17:00', overdueDays: 11, contactName: '郑主任', contactPhone: '130-0013-0010', status: '已逾期' },
  ],
  feed: [
    { id: '31', orderNo: 'SO-202505-031', orderTime: '2025-05-06 10:00', deliveryTime: '2025-05-21 14:00', overdueTime: null, overdueDays: 0, contactName: '饲料销售部', contactPhone: '138-0013-8031', status: '即将到期' },
    { id: '32', orderNo: 'SO-202505-032', orderTime: '2025-05-10 16:30', deliveryTime: '2025-05-28 09:00', overdueTime: null, overdueDays: 0, contactName: '华东经销', contactPhone: '139-0013-9032', status: '正常' },
    { id: '33', orderNo: 'SO-202504-028', orderTime: '2025-04-22 11:15', deliveryTime: '2025-05-15 17:00', overdueTime: '2025-05-15 17:00', overdueDays: 6, contactName: '华南客户', contactPhone: '137-0013-7033', status: '已逾期' },
  ],
}

const barnList = computed(() => barnDataByType[selectedFactoryType.value] ?? [])
const factoryAlarms = computed(() => alarmDataByType[selectedFactoryType.value] ?? [])
const factoryOrders = computed(() => orderDataByType[selectedFactoryType.value] ?? [])
const overdueOrderCount = computed(() => factoryOrders.value.filter(o => o.status === '已逾期').length)
const factoryCameraList = factoryCameras

const todayDate = new Date().toLocaleDateString('zh-CN')
const todayProduction = computed(() => getTodayProduction(selectedFactoryType.value))
const envCompliance = computed(() => {
  const abnormal = barnList.value.filter(b => b.status === '告警')
  return getEnvCompliance(abnormal.length, abnormal.map(b => displayBarnName(b.name)))
})
const unprocessedAlarmCount = computed(() =>
  factoryAlarms.value.filter(a => a.handleStatus !== '已关闭').length
)
const orderFulfillment = computed(() => getOrderFulfillment(factoryOrders.value))
const businessBenefit = computed(() => getBusinessBenefit(selectedFactoryType.value))

const businessOverviewItems = computed(() => {
  const { stock, output, outputValue } = businessBenefit.value.overview
  return [
    { key: 'stock', label: stock.label, value: stock.value, unit: stock.unit, change: stock.change, changeUp: stock.changeUp },
    { key: 'output', label: output.label, value: output.value, unit: output.unit, change: output.change, changeUp: output.changeUp },
    { key: 'outputValue', label: outputValue.label, value: outputValue.value, unit: outputValue.unit, change: outputValue.change, changeUp: outputValue.changeUp },
  ]
})

const todayBriefingItems = computed(() => {
  const t = todayProduction.value
  const kpi = factoryKpi.value
  const type = selectedFactoryType.value
  const deadChangeStr = t.dailyDeadChange >= 0 ? `较昨日 +${t.dailyDeadChange}` : `较昨日 ${t.dailyDeadChange}`
  const feedChangeStr = t.feedChange >= 0 ? `较昨日 +${t.feedChange}%` : `较昨日 ${t.feedChange}%`

  if (type === 'feed') {
    return [
      { key: 'output', label: '今日产量(吨)', value: t.actualOutput, change: `计划 ${t.planOutput}`, cardClass: 'primary', valueClass: '', changeClass: '' },
      { key: 'ship', label: '今日出货(吨)', value: kpi.totalFeedShipment, change: null, cardClass: '', valueClass: '', changeClass: '' },
      { key: 'alarm', label: '未处理报警', value: unprocessedAlarmCount.value, change: null, cardClass: 'warn', valueClass: 'alarm', changeClass: '' },
      { key: 'abnormal', label: '异常车间', value: kpi.abnormalBarn, change: null, cardClass: '', valueClass: 'warn', changeClass: '' },
      { key: 'water', label: '今日用水(m³)', value: t.waterConsumption, change: `较昨日 ${t.waterChange}%`, cardClass: '', valueClass: '', changeClass: '' },
      { key: 'offline', label: '离线设备', value: kpi.offline, change: null, cardClass: '', valueClass: 'offline', changeClass: '' },
    ]
  }

  return [
    { key: 'dead', label: '今日死淘', value: kpi.dailyDead, change: deadChangeStr, cardClass: kpi.dailyDead > 20 ? 'warn' : '', valueClass: 'dead', changeClass: t.dailyDeadChange > 0 ? 'up' : 'down' },
    { key: 'feed', label: '今日料耗(kg)', value: t.feedConsumption, change: feedChangeStr, cardClass: 'primary', valueClass: '', changeClass: t.feedChange > 5 ? 'up' : 'down' },
    { key: 'water', label: '今日用水(m³)', value: t.waterConsumption, change: `较昨日 ${t.waterChange}%`, cardClass: '', valueClass: '', changeClass: '' },
    { key: 'abnormal', label: '异常栏舍', value: kpi.abnormalBarn, change: envCompliance.value.worstBarn !== '—' ? `最差 ${envCompliance.value.worstDuration}` : null, cardClass: '', valueClass: 'warn', changeClass: '' },
    { key: 'alarm', label: '未处理报警', value: unprocessedAlarmCount.value, change: null, cardClass: 'warn', valueClass: 'alarm', changeClass: '' },
    { key: 'batch', label: '在养批次 / 日龄', value: `${t.batchCount}批 · ${t.avgAge}天`, change: type === 'chicken' ? `产蛋 ${t.actualOutput.toLocaleString()}枚` : null, cardClass: '', valueClass: '', changeClass: '' },
  ]
})

const alarmHandleTagType = (status: AlarmHandleStatus) => {
  if (status === '已关闭') return 'success'
  if (status === '处理中') return 'warning'
  return 'danger'
}

const factoryKpi = computed(() => {
  const barns = barnList.value
  const alarms = factoryAlarms.value
  const offlineDevices = barns.reduce((sum, b) => sum + (b.deviceTotal - b.deviceOnline), 0)
  const bioTotal = selectedFactoryType.value === 'aquatic'
    ? Math.round(barns.reduce((s, b) => s + b.oxygen, 0) / (barns.length || 1) * 10) / 10
    : selectedFactoryType.value === 'feed'
    ? barns.reduce((s, b) => s + b.pigFeedOutput + b.chickenFeedOutput + b.aquaticFeedOutput, 0)
    : barns.reduce((s, b) => s + b.stock, 0)
  const dailyDead = barns.reduce((sum, b) => sum + b.dailyDead, 0)
  const totalDead = barns.reduce((sum, b) => sum + b.totalDead, 0)
  const mortalityRate = bioTotal > 0 ? `${((totalDead / (bioTotal + totalDead)) * 100).toFixed(2)}%` : '0.00%'

  const totalSick = barns.reduce((sum, b) => sum + b.sickCount, 0)
  const totalDeadFromDisease = barns.reduce((sum, b) => sum + b.deadFromDisease, 0)
  const totalRelapse = barns.reduce((sum, b) => sum + b.relapseCount, 0)
  const totalMedicineUsed = barns.reduce((sum, b) => sum + b.medicineUsed, 0)
  
  const morbidityRate = bioTotal > 0 ? `${((totalSick / bioTotal) * 100).toFixed(2)}%` : '0.00%'
  const caseFatalityRate = totalSick > 0 ? `${((totalDeadFromDisease / totalSick) * 100).toFixed(2)}%` : '0.00%'
  const relapseRate = totalSick > 0 ? `${((totalRelapse / totalSick) * 100).toFixed(2)}%` : '0.00%'

  const pigFeedOutput = barns.reduce((sum, b) => sum + b.pigFeedOutput, 0)
  const chickenFeedOutput = barns.reduce((sum, b) => sum + b.chickenFeedOutput, 0)
  const aquaticFeedOutput = barns.reduce((sum, b) => sum + b.aquaticFeedOutput, 0)
  const pigFeedShipment = barns.reduce((sum, b) => sum + b.pigFeedShipment, 0)
  const chickenFeedShipment = barns.reduce((sum, b) => sum + b.chickenFeedShipment, 0)
  const aquaticFeedShipment = barns.reduce((sum, b) => sum + b.aquaticFeedShipment, 0)
  const totalFeedOutput = pigFeedOutput + chickenFeedOutput + aquaticFeedOutput
  const totalFeedShipment = pigFeedShipment + chickenFeedShipment + aquaticFeedShipment

  return {
    barnTotal: barns.length,
    abnormalBarn: barns.filter(b => b.status === '告警').length,
    total: alarms.length,
    severe: alarms.filter(a => a.level === '严重').length,
    offline: offlineDevices,
    bio: bioTotal,
    dailyDead,
    totalDead,
    mortalityRate,
    morbidityRate,
    caseFatalityRate,
    relapseRate,
    medicineUsed: totalMedicineUsed,
    pigFeedOutput,
    chickenFeedOutput,
    aquaticFeedOutput,
    pigFeedShipment,
    chickenFeedShipment,
    aquaticFeedShipment,
    totalFeedOutput,
    totalFeedShipment,
  }
})

const factoryStatusTag = computed(() => {
  const abnormal = factoryKpi.value.abnormalBarn
  if (abnormal > 0) return { type: 'danger' as const, text: `${abnormal} 个舍异常` }
  return { type: 'success' as const, text: '运行正常' }
})

const kpiItems = computed(() => {
  if (selectedFactoryType.value === 'feed') {
    return [
      { key: 'barnTotal' as KpiFilter, label: '车间总数', valueKey: 'barnTotal' as const, valueClass: '' },
      { key: 'total' as KpiFilter, label: '当前报警', valueKey: 'total' as const, valueClass: 'alarm' },
      { key: 'abnormalBarn' as KpiFilter, label: '异常车间', valueKey: 'abnormalBarn' as const, valueClass: 'warn' },
      { key: 'offline' as KpiFilter, label: '离线设备', valueKey: 'offline' as const, valueClass: 'offline' },
      { key: 'bio' as KpiFilter, label: '总产量(吨)', valueKey: 'bio' as const, valueClass: '' },
      { key: 'totalFeedShipment' as KpiFilter, label: '总出货(吨)', valueKey: 'totalFeedShipment' as const, valueClass: 'feed' },
      { key: 'pigFeedOutput' as KpiFilter, label: '猪饲料产出(吨)', valueKey: 'pigFeedOutput' as const, valueClass: 'feed' },
      { key: 'chickenFeedOutput' as KpiFilter, label: '鸡饲料产出(吨)', valueKey: 'chickenFeedOutput' as const, valueClass: 'feed' },
      { key: 'aquaticFeedOutput' as KpiFilter, label: '水产饲料产出(吨)', valueKey: 'aquaticFeedOutput' as const, valueClass: 'feed' },
      { key: 'pigFeedShipment' as KpiFilter, label: '猪饲料出货(吨)', valueKey: 'pigFeedShipment' as const, valueClass: 'feed' },
      { key: 'chickenFeedShipment' as KpiFilter, label: '鸡饲料出货(吨)', valueKey: 'chickenFeedShipment' as const, valueClass: 'feed' },
      { key: 'aquaticFeedShipment' as KpiFilter, label: '水产饲料出货(吨)', valueKey: 'aquaticFeedShipment' as const, valueClass: 'feed' },
    ]
  }

  const barnLabel = selectedFactoryType.value === 'aquatic' ? '池塘总数' : selectedFactoryType.value === 'chicken' ? '鸡舍总数' : '栏舍总数'
  const bioLabelText = selectedFactoryType.value === 'aquatic' ? '平均溶氧' : '存栏总量'
  
  const baseItems = [
    { key: 'barnTotal' as KpiFilter, label: barnLabel, valueKey: 'barnTotal' as const, valueClass: '' },
    { key: 'total' as KpiFilter, label: '当前报警', valueKey: 'total' as const, valueClass: 'alarm' },
    { key: 'abnormalBarn' as KpiFilter, label: '异常舍数', valueKey: 'abnormalBarn' as const, valueClass: 'warn' },
    { key: 'severe' as KpiFilter, label: '严重报警', valueKey: 'severe' as const, valueClass: 'severe' },
    { key: 'offline' as KpiFilter, label: '离线设备', valueKey: 'offline' as const, valueClass: 'offline' },
    { key: 'bio' as KpiFilter, label: bioLabelText, valueKey: 'bio' as const, valueClass: '' },
    { key: 'dailyDead' as KpiFilter, label: '今日死淘', valueKey: 'dailyDead' as const, valueClass: 'dead' },
    { key: 'totalDead' as KpiFilter, label: '累计死淘', valueKey: 'totalDead' as const, valueClass: 'dead' },
    { key: 'mortalityRate' as KpiFilter, label: '死淘率', valueKey: 'mortalityRate' as const, valueClass: 'rate' },
  ]

  if (selectedFactoryType.value === 'pig') {
    return [
      ...baseItems,
      { key: 'morbidityRate' as KpiFilter, label: '发病率', valueKey: 'morbidityRate' as const, valueClass: 'rate' },
      { key: 'caseFatalityRate' as KpiFilter, label: '病死率', valueKey: 'caseFatalityRate' as const, valueClass: 'rate' },
      { key: 'relapseRate' as KpiFilter, label: '复发率', valueKey: 'relapseRate' as const, valueClass: 'rate' },
      { key: 'medicineUsed' as KpiFilter, label: '用药量(kg)', valueKey: 'medicineUsed' as const, valueClass: 'medicine' },
    ]
  }

  return baseItems
})

const filteredAlarms = computed(() => {
  const alarms = factoryAlarms.value
  switch (activeKpiFilter.value) {
    case 'severe':
      return alarms.filter(a => a.level === '严重')
    case 'abnormalBarn':
      return alarms
    default:
      return alarms
  }
})

const filteredBarnList = computed(() => {
  const barns = barnList.value
  switch (activeKpiFilter.value) {
    case 'abnormalBarn':
      return barns.filter(b => b.status === '告警')
    case 'severe':
    case 'total':
      return barns.some(b => b.alarmCount > 0)
        ? barns.filter(b => b.alarmCount > 0)
        : barns
    case 'offline':
      return barns.filter(b => b.deviceOnline < b.deviceTotal)
    case 'barnTotal':
    case 'bio':
    default:
      return barns
  }
})

const selectKpiFilter = (key: KpiFilter) => {
  activeKpiFilter.value = key
}

const goToBarnDetail = (barn: BarnItem) => {
  router.push({
    path: '/farm/barn-detail',
    query: { id: barn.id, name: barn.name, factoryType: selectedFactoryType.value },
  })
}

const goToBarnDetailFromAlarm = (alarm: FactoryAlarm) => {
  router.push({
    path: '/farm/barn-detail',
    query: { id: alarm.barnId, name: alarm.barnName, factoryType: selectedFactoryType.value },
  })
}

const goToDeviceDetail = () => router.push('/farm/device-detail')
const goToAlarmDetail = () => router.push('/farm/alarm-detail')
const goToDashboard = () => router.push('/farm/dashboard')

const generateRandomData = (count: number, min: number, max: number) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)

const generateChartData = (factoryType: string): EChartsOption => {
  const dates: string[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(`${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`)
  }

  const baseAxis = {
    type: 'category' as const,
    boundaryGap: false,
    data: dates,
    axisLabel: { fontSize: 10, rotate: 45 },
  }

  if (factoryType === 'pig') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['水耗', '料耗', '估重'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '水耗', type: 'line', smooth: true, data: generateRandomData(30, 100, 350), areaStyle: { opacity: 0.3 } },
        { name: '料耗', type: 'line', smooth: true, data: generateRandomData(30, 200, 350), areaStyle: { opacity: 0.3 } },
        { name: '估重', type: 'line', smooth: true, data: generateRandomData(30, 150, 600), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  if (factoryType === 'chicken') {
    const names = chickenType.value === 'broiler' ? ['料耗', '增重'] : ['料耗', '产蛋量']
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: names, bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: names.map((name, i) => ({
        name,
        type: 'line' as const,
        smooth: true,
        data: generateRandomData(30, 70 + i * 80, 200 + i * 800),
        areaStyle: { opacity: 0.3 },
      })),
    }
  }

  if (factoryType === 'feed') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['猪饲料产出', '鸡饲料产出', '水产饲料产出'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '猪饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 2000, 3000), areaStyle: { opacity: 0.3 } },
        { name: '鸡饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 2500, 3500), areaStyle: { opacity: 0.3 } },
        { name: '水产饲料产出', type: 'line', smooth: true, data: generateRandomData(30, 1500, 2200), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  if (factoryType === 'aquatic') {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['溶氧', '投饵量', 'pH'], bottom: 0 },
      grid: { top: 40, left: '3%', right: '4%', bottom: 40, containLabel: true },
      xAxis: baseAxis,
      yAxis: { type: 'value' },
      series: [
        { name: '溶氧', type: 'line', smooth: true, data: generateRandomData(30, 4, 8), areaStyle: { opacity: 0.3 } },
        { name: '投饵量', type: 'line', smooth: true, data: generateRandomData(30, 150, 280), areaStyle: { opacity: 0.3 } },
        { name: 'pH', type: 'line', smooth: true, data: generateRandomData(30, 65, 85), areaStyle: { opacity: 0.3 } },
      ],
    }
  }

  return { xAxis: baseAxis, yAxis: { type: 'value' }, series: [] }
}

const { resizeCharts, observeContainers } = useChartResize(
  () => [chartInstance],
  () => [chartRef.value]
)

const initChart = () => {
  if (!chartRef.value || !hasFactory.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  nextTick(() => {
    observeContainers()
    resizeCharts()
  })
}

const updateChart = () => {
  if (!chartInstance) return
  chartInstance.clear()
  chartInstance.setOption(generateChartData(selectedFactoryType.value), { notMerge: true })
}

watch([selectedFactoryType, chickenType, aquaticType, hasFactory], async () => {
  activeKpiFilter.value = 'total'
  if (hasFactory.value) {
    await nextTick()
    if (!chartInstance && chartRef.value) initChart()
    else updateChart()
  }
})

watch(hasFactory, async (val) => {
  if (val) {
    await nextTick()
    setTimeout(initChart, 100)
  } else if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onMounted(() => {
  if (route.query.farmName) {
    currentFactory.value = route.query.farmName as string
  }
  if (hasFactory.value) setTimeout(initChart, 100)
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style scoped>
.farm-detail-content {
  padding-bottom: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-main h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.type-filter {
  margin-right: 4px;
}

/* 空状态骨架屏 */
.empty-state {
  position: relative;
  min-height: 480px;
}

.skeleton-layout {
  height: 100%;
  padding: 8px;
}

.sk-kpi-row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.sk-kpi {
  height: 64px;
  border-radius: 8px;
}

.sk-body-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.sk-chart {
  height: 220px;
  border-radius: 8px;
}

.sk-alarm {
  height: 220px;
  border-radius: 8px;
}

.sk-barn-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.sk-barn {
  height: 160px;
  border-radius: 8px;
}

.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
}

.empty-title {
  margin: 12px 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #606266;
}

.empty-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* 今日生产看板 */
.today-briefing {
  margin-bottom: 16px;
}

.briefing-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.briefing-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
}

.briefing-card.primary {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.briefing-card.warn {
  background: #fef0f0;
  border-color: #fde2e2;
}

.briefing-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.briefing-value.alarm { color: #f56c6c; }
.briefing-value.warn { color: #e6a23c; }
.briefing-value.dead { color: #fa541c; }
.briefing-value.offline { color: #909399; }

.briefing-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.briefing-change {
  font-size: 11px;
  margin-top: 4px;
  color: #909399;
}

.briefing-change.up { color: #f56c6c; }
.briefing-change.down { color: #67c23a; }

.env-summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.env-summary-card {
  background: white;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.env-summary-label {
  font-size: 12px;
  color: #909399;
}

.env-summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.env-summary-value.warn { color: #e6a23c; }
.env-summary-value.alarm { color: #f56c6c; }

.alarm-workflow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #909399;
}

.order-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.order-stat-tag {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-stat-tag.success {
  color: #67c23a;
  background: #f0f9eb;
}

/* KPI */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.kpi-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.kpi-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.kpi-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px #409eff;
}

.kpi-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;
}

.kpi-value.alarm { color: #f56c6c; }
.kpi-value.severe { color: #ff7875; }
.kpi-value.warn { color: #e6a23c; }
.kpi-value.offline { color: #909399; }
.kpi-value.dead { color: #fa541c; }
.kpi-value.rate { color: #722ed1; }
.kpi-value.medicine { color: #13c2c2; }
.kpi-value.feed { color: #52c41a; }

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.kpi-card.active .kpi-label {
  color: #409eff;
  font-weight: 600;
}

/* 经营效益 */
.business-panel {
  margin-bottom: 16px;
}

.business-section {
  padding: 14px 0;
  border-top: 1px solid #f0f0f0;
}

.business-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.business-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.business-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.business-section-header .business-section-title {
  margin-bottom: 0;
}

.business-section-meta {
  font-size: 12px;
  color: #909399;
}

.business-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.business-overview-card {
  padding: 16px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: center;
}

.business-overview-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.business-overview-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  margin-left: 4px;
}

.business-overview-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.business-overview-change {
  font-size: 11px;
  font-weight: 500;
}

.business-overview-change.up { color: #f56c6c; }
.business-overview-change.down { color: #67c23a; }

.business-table {
  width: 100%;
}

.change-up { color: #f56c6c; }
.change-down { color: #67c23a; }

.sales-kpi-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.sales-kpi-card {
  padding: 16px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: center;
}

.sales-kpi-card.primary {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.sales-kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.sales-kpi-card.primary .sales-kpi-value {
  color: #409eff;
}

.sales-kpi-label {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.sales-kpi-change {
  font-size: 11px;
  font-weight: 500;
}

.sales-kpi-change.up { color: #67c23a; }
.sales-kpi-change.down { color: #f56c6c; }

/* 中部布局 */
.middle-section {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
  min-height: 240px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-actions {
  display: flex;
  align-items: center;
}

.chart-container {
  flex: 1;
  min-height: 200px;
  width: 100%;
}

.alarm-badge {
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alarm-empty {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 13px;
}

.alarm-item {
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.alarm-item:hover {
  border-color: #409eff;
  background: #f5f9ff;
}

.alarm-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.alarm-level {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}

.alarm-level.level-严重 { color: #f56c6c; background: #fef0f0; }
.alarm-level.level-一般 { color: #e6a23c; background: #fdf6ec; }
.alarm-level.level-提示 { color: #909399; background: #f4f4f5; }

.alarm-time {
  font-size: 11px;
  color: #c0c4cc;
}

.alarm-barn {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.alarm-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 订单详情 */
.order-section {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.camera-section {
  margin-bottom: 16px;
}

.order-overdue-badge {
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.order-table {
  width: 100%;
}

.overdue-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #f56c6c;
  font-size: 13px;
}

.overdue-tag {
  flex-shrink: 0;
}

.no-overdue {
  color: #c0c4cc;
}

.contact-phone {
  color: #409eff;
  text-decoration: none;
}

.contact-phone:hover {
  text-decoration: underline;
}

/* 舍列表 */
.barn-section {
  margin-top: 4px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.section-sub {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 8px;
}

.barn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  padding-bottom: 4px;
}

.barn-panel {
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
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

.barn-panel.alarm::before {
  background: linear-gradient(90deg, #f56c6c, #e6a23c);
}

.barn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.barn-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.barn-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.barn-arrow {
  color: #c0c4cc;
  font-size: 14px;
  flex-shrink: 0;
}

.barn-panel:hover .barn-arrow {
  color: #409eff;
}

.barn-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.barn-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  background: #f5f7fa;
  border-radius: 6px;
}

.barn-stat .label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.barn-stat .value {
  font-size: 16px;
  font-weight: 700;
  color: #409eff;
}

.barn-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.device-info {
  color: #909399;
}

.alarm-count {
  color: #f56c6c;
  font-weight: 600;
}

.alarm-list::-webkit-scrollbar,
.barn-grid::-webkit-scrollbar {
  width: 4px;
}

.alarm-list::-webkit-scrollbar-thumb,
.barn-grid::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}
</style>
