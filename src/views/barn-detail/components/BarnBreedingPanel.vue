<template>
<div class="panel breeding-production-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><TrendCharts /></el-icon> 养殖与生产</div>
          <el-radio-group v-model="breedingProdTab" size="small">
            <el-radio-button value="breeding">养殖</el-radio-button>
            <el-radio-button value="production">生产</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 养殖 -->
        <template v-if="breedingProdTab === 'breeding'">
          <!-- 环控数据（已有板块，仅指引） -->
          <div class="bp-subsection">
            <div class="bp-subtitle">环控数据</div>
            <div class="bp-ref-hint">
              <el-icon><InfoFilled /></el-icon>
              实时环控与环控趋势已在下方「环境数据」板块展示
            </div>
          </div>

          <!-- 养殖生产数据（补充：品类、生产率、成活率、死亡率） -->
          <div class="bp-subsection">
            <div class="bp-subtitle">养殖生产数据</div>
            <div class="bp-ref-hint">
              存栏、日龄、死淘数据见下方「生物数据」板块
            </div>
            <div class="bp-kpi-grid">
              <div class="bp-kpi-card">
                <div class="bp-kpi-value">{{ breedingExtra.category }}</div>
                <div class="bp-kpi-label">品类</div>
              </div>
              <div class="bp-kpi-card primary">
                <div class="bp-kpi-value">{{ breedingExtra.productionRate }}%</div>
                <div class="bp-kpi-label">生产率</div>
              </div>
              <div class="bp-kpi-card success">
                <div class="bp-kpi-value">{{ breedingExtra.survivalRate }}%</div>
                <div class="bp-kpi-label">成活率</div>
              </div>
              <div class="bp-kpi-card warn">
                <div class="bp-kpi-value">{{ breedingExtra.mortalityRate }}%</div>
                <div class="bp-kpi-label">死亡率</div>
              </div>
            </div>
          </div>

          <!-- 饲喂采食 -->
          <div v-if="factoryType !== 'feed'" class="bp-subsection">
            <div class="bp-subtitle">饲喂采食</div>
            <div class="bp-kpi-grid">
              <div class="bp-kpi-card feed">
                <div class="bp-kpi-value">{{ feedingIntake.feedAmount }}</div>
                <div class="bp-kpi-label">饲喂量（{{ feedingIntake.feedUnit }}）</div>
              </div>
              <div class="bp-kpi-card">
                <div class="bp-kpi-value">{{ feedingIntake.weightGain }}</div>
                <div class="bp-kpi-label">增重量（{{ feedingIntake.weightGainUnit }}）</div>
              </div>
              <div class="bp-kpi-card primary">
                <div class="bp-kpi-value">{{ feedingIntake.fcr }}</div>
                <div class="bp-kpi-label">{{ feedingIntake.fcrLabel }}</div>
              </div>
            </div>
            <div v-if="intakeAlarms.length" class="intake-alarm-list">
              <div class="intake-alarm-title">异常采食量报警</div>
              <div v-for="alarm in intakeAlarms" :key="alarm.id" class="intake-alarm-item">
                <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                <span class="intake-alarm-time">{{ alarm.time }}</span>
                <span class="intake-alarm-msg">{{ alarm.message }}</span>
              </div>
            </div>
            <div v-else class="bp-empty-hint">暂无异常采食量报警</div>
          </div>
          <div v-else class="bp-subsection">
            <div class="bp-subtitle">原料投料</div>
            <div class="bp-kpi-grid">
              <div class="bp-kpi-card feed">
                <div class="bp-kpi-value">{{ feedingIntake.feedAmount }}</div>
                <div class="bp-kpi-label">今日投料（{{ feedingIntake.feedUnit }}）</div>
              </div>
            </div>
          </div>

          <!-- 生物防疫 -->
          <div class="bp-subsection bio-prevention-section">
            <div class="bp-subtitle">生物防疫</div>

            <!-- 防疫消杀记录 -->
            <div class="bio-block">
              <div class="bio-block-title">防疫消杀记录</div>
              <el-table :data="bioPrevention.disinfectionRecords" size="small" stripe class="bio-table">
                <el-table-column prop="date" label="日期" width="110" />
                <el-table-column prop="type" label="消杀类型" min-width="120" />
                <el-table-column prop="agent" label="消毒药剂" min-width="130" />
                <el-table-column prop="operator" label="操作人" width="90" />
                <el-table-column prop="result" label="结果" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.result === '合格' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 疫苗使用记录 -->
            <div class="bio-block">
              <div class="bio-block-title">疫苗使用记录</div>
              <el-table
                v-if="bioPrevention.vaccineRecords.length"
                :data="bioPrevention.vaccineRecords"
                size="small"
                stripe
                class="bio-table"
              >
                <el-table-column prop="date" label="日期" width="110" />
                <el-table-column prop="vaccineName" label="疫苗名称" min-width="140" />
                <el-table-column prop="dosage" label="用量" width="100" />
                <el-table-column prop="count" label="数量" width="80" />
                <el-table-column prop="batchNo" label="批号" width="120" />
                <el-table-column prop="operator" label="操作人" width="90" />
              </el-table>
              <div v-else class="bp-empty-hint">暂无疫苗使用记录</div>
            </div>

            <!-- 疫情报警 -->
            <div class="bio-block">
              <div class="bio-block-title">疫情报警</div>
              <div v-if="bioPrevention.epidemicAlarms.length" class="bio-alarm-list">
                <div v-for="alarm in bioPrevention.epidemicAlarms" :key="alarm.id" class="bio-alarm-item">
                  <div class="bio-alarm-top">
                    <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                    <span class="bio-alarm-disease">{{ alarm.disease }}</span>
                    <el-tag size="small" :type="epidemicStatusTag(alarm.status)">{{ alarm.status }}</el-tag>
                    <span class="intake-alarm-time">{{ alarm.time }}</span>
                  </div>
                  <div class="bio-alarm-desc">{{ alarm.description }}</div>
                </div>
              </div>
              <div v-else class="bp-empty-hint">暂无疫情报警</div>
            </div>

            <!-- 体温记录 -->
            <div class="bio-block">
              <div class="bio-block-header">
                <div class="bio-block-title">{{ bioTempLabel }}记录</div>
                <span class="bio-block-meta" :class="{ warn: bioPrevention.tempSummary.warn }">
                  {{ bioPrevention.tempSummary.label }}：{{ bioPrevention.tempSummary.value }}
                </span>
              </div>
              <el-table :data="bioPrevention.temperatureRecords" size="small" stripe class="bio-table">
                <el-table-column prop="time" label="时段" width="90" />
                <el-table-column label="平均温度" width="110">
                  <template #default="{ row }">{{ row.avgTemp }} {{ row.unit }}</template>
                </el-table-column>
                <el-table-column prop="abnormalCount" label="异常数量" width="90" />
                <el-table-column prop="status" label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag :type="tempStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 异常行为/体征报警 -->
            <div class="bio-block">
              <div class="bio-block-title">异常行为 / 体征报警</div>
              <div v-if="bioPrevention.behaviorAlarms.length" class="bio-alarm-list">
                <div v-for="alarm in bioPrevention.behaviorAlarms" :key="alarm.id" class="bio-alarm-item behavior">
                  <div class="bio-alarm-top">
                    <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                    <span class="bio-alarm-disease">{{ alarm.type }}</span>
                    <span class="intake-alarm-time">{{ alarm.time }}</span>
                  </div>
                  <div class="bio-alarm-desc">{{ alarm.description }}</div>
                </div>
              </div>
              <div v-else class="bp-empty-hint">暂无异常行为 / 体征报警</div>
            </div>
          </div>
        </template>

        <!-- 生产 -->
        <template v-else>
          <!-- 饲料厂：原料管控 / 生产工艺 / 饲料出厂 -->
          <template v-if="factoryType === 'feed'">
            <!-- 1. 原料管控 -->
            <div class="prod-block">
              <div class="prod-block-title">原料管控</div>

              <div class="bio-block">
                <div class="bio-block-title">原料入场</div>
                <el-table :data="feedProduction.rawIntakes" size="small" stripe class="bio-table">
                  <el-table-column prop="intakeDate" label="入场时间" width="140" />
                  <el-table-column prop="batchNo" label="批次" width="150" />
                  <el-table-column prop="materialName" label="原料" width="90" />
                  <el-table-column label="重量" width="90">
                    <template #default="{ row }">{{ row.weight }} {{ row.weightUnit }}</template>
                  </el-table-column>
                  <el-table-column label="质检" min-width="160">
                    <template #default="{ row }">
                      <el-tag :type="qcTagType(row.qcResult)" size="small">{{ row.qcResult }}</el-tag>
                      <span class="qc-detail">{{ row.qcDetail }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div class="bio-block">
                <div class="bio-block-header">
                  <div class="bio-block-title">原料存量</div>
                  <span v-if="feedProduction.stockAlerts.length" class="bio-block-meta warn">
                    {{ feedProduction.stockAlerts.length }} 项库存预警
                  </span>
                </div>
                <el-table :data="feedProduction.rawStocks" size="small" stripe class="bio-table">
                  <el-table-column prop="materialName" label="原料" width="100" />
                  <el-table-column label="当前库存" width="110">
                    <template #default="{ row }">{{ row.currentStock }} {{ row.unit }}</template>
                  </el-table-column>
                  <el-table-column label="安全区间" width="120">
                    <template #default="{ row }">{{ row.minStock }}–{{ row.maxStock }} {{ row.unit }}</template>
                  </el-table-column>
                  <el-table-column prop="alertLevel" label="状态" width="90">
                    <template #default="{ row }">
                      <el-tag :type="stockAlertTagType(row.alertLevel)" size="small">{{ row.alertLevel }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-if="feedProduction.stockAlerts.length" class="stock-alert-list">
                  <div v-for="(alert, idx) in feedProduction.stockAlerts" :key="idx" class="stock-alert-item">
                    <el-tag :type="alert.level === '预警' ? 'danger' : 'warning'" size="small">{{ alert.level }}</el-tag>
                    <span>{{ alert.materialName }}：{{ alert.message }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. 生产工艺管理 -->
            <div class="prod-block">
              <div class="prod-block-title">生产工艺管理</div>

              <div class="bio-block">
                <div class="bio-block-title">工艺图纸</div>
                <div class="drawing-list">
                  <div v-for="drawing in feedProduction.processDrawings" :key="drawing.id" class="drawing-item">
                    <div class="drawing-info">
                      <span class="drawing-name">{{ drawing.name }}</span>
                      <span class="drawing-meta">{{ drawing.id }} · {{ drawing.version }} · 更新 {{ drawing.updatedAt }}</span>
                    </div>
                    <el-button size="small" link type="primary">查看</el-button>
                  </div>
                </div>
              </div>

              <div class="bio-block">
                <div class="bio-block-title">工艺参数</div>
                <el-table :data="feedProduction.processParams" size="small" stripe class="bio-table">
                  <el-table-column prop="name" label="参数" width="110" />
                  <el-table-column label="标准值" width="110">
                    <template #default="{ row }">{{ row.standard }} {{ row.unit }}</template>
                  </el-table-column>
                  <el-table-column label="当前值" width="110">
                    <template #default="{ row }">{{ row.current }} {{ row.unit }}</template>
                  </el-table-column>
                  <el-table-column prop="status" label="状态" width="90">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <!-- 3. 饲料出厂 -->
            <div class="prod-block">
              <div class="prod-block-title">饲料出厂</div>
              <div class="bp-kpi-grid capacity-summary">
                <div class="bp-kpi-card primary">
                  <div class="bp-kpi-value">{{ feedProduction.capacitySummary.dailyOutput }}</div>
                  <div class="bp-kpi-label">今日产量（{{ feedProduction.capacitySummary.unit }}）</div>
                </div>
                <div class="bp-kpi-card">
                  <div class="bp-kpi-value">{{ feedProduction.capacitySummary.planOutput }}</div>
                  <div class="bp-kpi-label">计划产量（{{ feedProduction.capacitySummary.unit }}）</div>
                </div>
                <div class="bp-kpi-card success">
                  <div class="bp-kpi-value">{{ feedProduction.capacitySummary.utilizationRate }}%</div>
                  <div class="bp-kpi-label">产能利用率</div>
                </div>
              </div>
              <el-table :data="feedProduction.feedDispatches" size="small" stripe class="bio-table">
                <el-table-column prop="batchNo" label="批次" width="150" />
                <el-table-column prop="productName" label="产品" min-width="130" />
                <el-table-column label="产量" width="90">
                  <template #default="{ row }">{{ row.output }} {{ row.outputUnit }}</template>
                </el-table-column>
                <el-table-column label="合格率" width="90">
                  <template #default="{ row }">{{ row.passRate }}%</template>
                </el-table-column>
                <el-table-column label="产能统计" width="100">
                  <template #default="{ row }">{{ row.capacityRate }}%</template>
                </el-table-column>
                <el-table-column label="库存数量" width="100">
                  <template #default="{ row }">{{ row.stockQty }} {{ row.stockUnit }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>

          <!-- 养殖场：保留原有生产摘要 -->
          <div v-else class="production-summary">
            <div v-if="productionOutput.todayOutput > 0" class="bp-kpi-grid">
              <div class="bp-kpi-card primary">
                <div class="bp-kpi-value">{{ productionOutput.todayOutput }}</div>
                <div class="bp-kpi-label">今日产出（{{ productionOutput.outputUnit }}）</div>
              </div>
              <div class="bp-kpi-card">
                <div class="bp-kpi-value">{{ productionOutput.planOutput }}</div>
                <div class="bp-kpi-label">计划产出（{{ productionOutput.outputUnit }}）</div>
              </div>
              <div class="bp-kpi-card success">
                <div class="bp-kpi-value">{{ productionOutput.completionRate }}%</div>
                <div class="bp-kpi-label">完成率</div>
              </div>
              <div class="bp-kpi-card">
                <div class="bp-kpi-value">{{ productionOutput.qualityPassRate }}%</div>
                <div class="bp-kpi-label">质量合格率</div>
              </div>
            </div>
            <div class="production-items">
              <div v-for="item in productionOutput.items" :key="item.label" class="production-item">
                <span class="production-item-label">{{ item.label }}</span>
                <span class="production-item-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { TrendCharts, InfoFilled } from '@element-plus/icons-vue'
import { BARN_DETAIL_KEY } from '../barnDetailContext'

const ctx = inject(BARN_DETAIL_KEY)!
const {
  breedingProdTab,
  factoryType,
  breedingExtra,
  feedingIntake,
  intakeAlarms,
  bioPrevention,
  bioTempLabel,
  productionOutput,
  feedProduction,
  qcTagType,
  epidemicStatusTag,
  tempStatusTag,
  stockAlertTagType,
} = ctx
</script>
