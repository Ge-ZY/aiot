<template>
  <div class="barn-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" circle />
        <div>
          <div class="header-title-row">
            <h2>{{ barnName }}</h2>
            <el-tag :type="barnStatus === '正常' ? 'success' : 'danger'" size="small">{{ barnStatus }}</el-tag>
          </div>
          <span class="header-sub">舍内详情 · {{ factoryTypeLabel }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="selectedBarn" @change="handleBarnChange" placeholder="切换栏舍" style="width: 160px;">
          <el-option v-for="barn in barnList" :key="barn.id" :label="barn.name" :value="barn.id" />
        </el-select>
      </div>
    </div>

    <div class="pillars-stack">
      <!-- 养殖与生产 -->
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

      <!-- 1. 生物数据 -->
      <div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><DataLine /></el-icon> 生物数据</div>
        </div>

        <!-- 批次信息 -->
        <div class="batch-info-bar">
          <div class="batch-item"><span class="batch-label">批次号</span><span class="batch-value">{{ batchInfo.batchNo }}</span></div>
          <div class="batch-item"><span class="batch-label">进栏日期</span><span class="batch-value">{{ batchInfo.entryDate }}</span></div>
          <div class="batch-item"><span class="batch-label">日龄</span><span class="batch-value">{{ batchInfo.ageDays }} 天</span></div>
          <div class="batch-item"><span class="batch-label">初始 / 当前</span><span class="batch-value">{{ batchInfo.initialStock }} → {{ batchInfo.currentStock }}</span></div>
          <div v-if="batchInfo.targetWeight" class="batch-item"><span class="batch-label">目标</span><span class="batch-value">{{ batchInfo.targetWeight }}</span></div>
        </div>

        <div class="bio-kpi-grid">
          <div
            v-for="item in bioKpiItems"
            :key="item.key"
            class="kpi-card"
            :class="item.cardClass"
          >
            <div class="kpi-value" :class="item.valueClass">{{ item.value }}</div>
            <div class="kpi-label">{{ item.label }}</div>
          </div>
        </div>

        <div v-if="specialMetrics.length" class="special-section">
          <div class="special-title">{{ specialSectionTitle }}</div>
          <div class="special-grid">
            <div
              v-for="item in specialMetrics"
              :key="item.key"
              class="special-card"
              :class="item.cardClass"
            >
              <div class="special-value" :class="item.valueClass">{{ item.value }}</div>
              <div class="special-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <div class="sub-chart-wrap">
          <div class="sub-chart-title">{{ bioChartTitle }}</div>
          <div ref="bioChartRef" class="sub-chart"></div>
        </div>
        <div class="sub-chart-wrap batch-chart-wrap">
          <div class="sub-chart-title">批次进栏至今 · 存栏 & 死淘趋势</div>
          <div ref="batchChartRef" class="sub-chart batch-chart"></div>
        </div>
      </div>

      <!-- 2. 环境数据 -->
      <div class="panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Sunny /></el-icon> 环境数据</div>
          <span class="panel-meta">达标率 {{ envComplianceRate }}%</span>
        </div>
        <div class="env-compliance-row">
          <div class="env-compliance-item">
            <span class="label">温度达标</span>
            <el-progress :percentage="envRates.temp" :stroke-width="8" />
          </div>
          <div class="env-compliance-item">
            <span class="label">湿度达标</span>
            <el-progress :percentage="envRates.humidity" :stroke-width="8" />
          </div>
          <div class="env-compliance-item">
            <span class="label">气体达标</span>
            <el-progress :percentage="envRates.gas" :stroke-width="8" color="#67c23a" />
          </div>
          <div class="env-compliance-item">
            <span class="label">今日偏离累计</span>
            <span class="deviation-value">{{ envDeviationDuration }}</span>
          </div>
        </div>
        <div class="env-indicators">
          <div
            v-for="item in envIndicators"
            :key="item.label"
            class="env-item"
            :class="{ alarm: item.alarm }"
          >
            <div class="env-label">{{ item.label }}</div>
            <div class="env-value" :class="{ alarm: item.alarm }">{{ item.value }}</div>
            <el-tag v-if="item.alarm" type="danger" size="small" class="env-alarm-tag">异常</el-tag>
          </div>
        </div>
        <div class="sub-chart-wrap">
          <div class="sub-chart-title">近30日环境趋势</div>
          <div ref="chartRef" class="sub-chart"></div>
        </div>
      </div>

      <!-- 舍内监控 -->
      <div class="panel">
        <CameraPanel :cameras="barnCameraList" title="舍内监控" />
      </div>

      <!-- 设备管理 -->
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

      <!-- 3. 设备详情 -->
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

      <!-- 能耗监测 -->
      <div class="panel energy-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Odometer /></el-icon> 能耗监测</div>
        </div>

        <!-- 1. 能耗统计 -->
        <div class="bio-block">
          <div class="bio-block-title">能耗统计</div>
          <div class="energy-stat-grid">
            <div v-for="stat in energyMonitoring.stats" :key="stat.key" class="energy-stat-card">
              <div class="energy-stat-top">
                <span class="energy-stat-label">{{ stat.label }}</span>
                <span class="energy-stat-change" :class="stat.changePercent >= 0 ? 'up' : 'down'">
                  {{ stat.changePercent >= 0 ? '+' : '' }}{{ stat.changePercent }}%
                </span>
              </div>
              <div class="energy-stat-value">{{ stat.todayValue }} <span class="unit">{{ stat.unit }}</span></div>
              <div class="energy-quota-row">
                <span class="quota-text">定额 {{ stat.quota }} {{ stat.unit }}</span>
                <span class="quota-rate" :class="{ warn: energyUsageRate(stat) >= 85 }">{{ energyUsageRate(stat) }}%</span>
              </div>
              <el-progress
                :percentage="energyUsageRate(stat)"
                :stroke-width="6"
                :show-text="false"
                :color="energyUsageRate(stat) >= 90 ? '#f56c6c' : energyUsageRate(stat) >= 75 ? '#e6a23c' : '#409eff'"
              />
            </div>
          </div>
        </div>

        <!-- 2. 能耗报警 -->
        <div class="bio-block">
          <div class="bio-block-title">能耗报警</div>
          <div v-if="energyMonitoring.alarms.length" class="bio-alarm-list">
            <div v-for="alarm in energyMonitoring.alarms" :key="alarm.id" class="bio-alarm-item energy-alarm">
              <div class="bio-alarm-top">
                <span class="intake-alarm-level" :class="`level-${alarm.level}`">{{ alarm.level }}</span>
                <el-tag size="small" :type="alarm.alarmType === '超定额' ? 'danger' : 'warning'">{{ alarm.alarmType }}</el-tag>
                <span class="bio-alarm-disease">{{ alarm.energyType }}</span>
                <span class="intake-alarm-time">{{ alarm.time }}</span>
              </div>
              <div class="bio-alarm-desc">{{ alarm.description }}</div>
              <div class="energy-alarm-threshold">
                当前 {{ alarm.currentValue }} · 阈值 {{ alarm.threshold }}
              </div>
            </div>
          </div>
          <div v-else class="bp-empty-hint">暂无能耗报警</div>
        </div>

        <!-- 3. 排污与环保指标 -->
        <div class="bio-block">
          <div class="bio-block-title">排污与环保指标</div>
          <el-table :data="energyMonitoring.pollutionIndicators" size="small" stripe class="bio-table">
            <el-table-column prop="name" label="指标" min-width="130" />
            <el-table-column prop="value" label="当前值" width="110" />
            <el-table-column prop="standard" label="标准" width="120" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="pollutionStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 生产安全 -->
      <div class="panel safety-panel">
        <div class="panel-header-row">
          <div class="panel-title"><el-icon><Warning /></el-icon> 生产安全</div>
        </div>

        <!-- 1. 超限报警 -->
        <div class="bio-block">
          <div class="bio-block-title">超限报警</div>
          <div v-for="cat in overlimitCategories" :key="cat.key" class="safety-sub-block">
            <div class="bio-block-title sub">{{ cat.label }}</div>
            <el-table
              v-if="overlimitAlarmsByCategory(cat.key).length"
              :data="overlimitAlarmsByCategory(cat.key)"
              size="small"
              stripe
              class="bio-table"
            >
              <el-table-column prop="time" label="时间" width="90" />
              <el-table-column prop="indicator" label="指标" width="100" />
              <el-table-column prop="currentValue" label="当前值" width="100" />
              <el-table-column prop="limitValue" label="限值" width="100" />
              <el-table-column prop="level" label="等级" width="80">
                <template #default="{ row }">
                  <span class="intake-alarm-level" :class="`level-${row.level}`">{{ row.level }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" min-width="160" />
            </el-table>
            <div v-else class="bp-empty-hint">暂无{{ cat.label }}</div>
          </div>
        </div>

        <!-- 2. 突发事件与处置 -->
        <div class="bio-block">
          <div class="bio-block-title">突发事件与处置</div>
          <el-table :data="productionSafety.emergencyEvents" size="small" stripe class="bio-table">
            <el-table-column prop="time" label="时间" width="140" />
            <el-table-column prop="eventType" label="事件类型" width="110" />
            <el-table-column prop="location" label="位置" min-width="120" />
            <el-table-column prop="level" label="等级" width="80">
              <template #default="{ row }">
                <span class="intake-alarm-level" :class="`level-${row.level}`">{{ row.level }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="handleStatus" label="处置情况" width="90">
              <template #default="{ row }">
                <el-tag :type="emergencyHandleStatusTag(row.handleStatus)" size="small">{{ row.handleStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="handleDetail" label="处置详情" min-width="180" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 3. 应急资源管理 -->
        <div class="bio-block">
          <div class="bio-block-title">应急资源管理</div>

          <div class="safety-sub-block">
            <div class="bio-block-title sub">消防设备</div>
            <el-table :data="fireEmergencyResources" size="small" stripe class="bio-table">
              <el-table-column prop="name" label="名称" min-width="130" />
              <el-table-column prop="location" label="位置" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="90" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="emergencyResourceStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastCheck" label="最近检查" width="110" />
            </el-table>
          </div>

          <div class="safety-sub-block">
            <div class="bio-block-title sub">应急物资</div>
            <el-table :data="supplyEmergencyResources" size="small" stripe class="bio-table">
              <el-table-column prop="name" label="名称" min-width="130" />
              <el-table-column prop="location" label="位置" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="90" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="emergencyResourceStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastCheck" label="最近检查" width="110" />
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, DataLine, Sunny, Setting, TrendCharts, InfoFilled, Monitor, Odometer, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import CameraPanel from '@/components/CameraPanel.vue'
import { useCompanyTree } from '@/composables/useCompanyTree'
import { useChartResize } from '@/composables/useChartResize'
import { getBarnCameras } from '@/utils/cameraMockData'
import {
  getBatchInfo,
  getDeviceMaintenance,
  getBreedingProductionExtra,
  getFeedingIntake,
  getIntakeAlarms,
  getBioPrevention,
  getBioPreventionTempLabel,
  getProductionOutput,
  getFeedProductionDetail,
  stockAlertTagType,
  getDeviceFaultAlarms,
  getEnergyMonitoring,
  pollutionStatusTagType,
  energyUsageRate,
  getProductionSafety,
  emergencyResourceStatusTag,
  emergencyHandleStatusTag,
  type SafetyOverlimitCategory,
} from '@/utils/farmOperationsMock'

interface BarnOption {
  id: number
  name: string
  status: '正常' | '告警'
}

interface MetricItem {
  key: string
  value: string | number
  label: string
  valueClass?: string
  cardClass?: string
}

interface DeviceItem {
  id: number
  name: string
  type: string
  uuid: string
  attribute: string
  online: boolean
  controllable: boolean
  on: boolean
  extra?: Record<string, string | number>
  faultCount: number
  nextMaintainDate: string
  maintainStatus: '正常' | '即将到期' | '已超期'
}

const router = useRouter()
const route = useRoute()
const { selectedFactoryType, factoryTypes } = useCompanyTree()

type FactoryType = 'pig' | 'chicken' | 'aquatic' | 'feed'

const factoryType = computed<FactoryType>(() => {
  const fromQuery = route.query.factoryType as FactoryType | undefined
  if (fromQuery && ['pig', 'chicken', 'aquatic', 'feed'].includes(fromQuery)) return fromQuery
  return selectedFactoryType.value
})

const factoryTypeLabel = computed(() =>
  factoryTypes.find(t => t.value === factoryType.value)?.label ?? '栏舍'
)

const barnListByType: Record<FactoryType, BarnOption[]> = {
  pig: [
    { id: 1, name: '保育舍1', status: '正常' },
    { id: 2, name: '保育舍2', status: '正常' },
    { id: 3, name: '分娩舍1', status: '正常' },
    { id: 4, name: '保育舍4', status: '告警' },
    { id: 6, name: '分娩舍2', status: '告警' },
  ],
  chicken: [
    { id: 101, name: '蛋鸡舍1', status: '正常' },
    { id: 102, name: '蛋鸡舍2', status: '告警' },
    { id: 103, name: '肉鸡舍1', status: '正常' },
    { id: 104, name: '肉鸡舍2', status: '告警' },
  ],
  aquatic: [
    { id: 201, name: '养殖池1', status: '正常' },
    { id: 202, name: '养殖池2', status: '正常' },
    { id: 203, name: '养殖池3', status: '告警' },
  ],
  feed: [
    { id: 301, name: '猪饲料车间', status: '正常' },
    { id: 302, name: '鸡饲料车间', status: '正常' },
    { id: 303, name: '水产饲料车间', status: '告警' },
    { id: 304, name: '成品仓库', status: '正常' },
  ],
}

const barnList = computed(() => barnListByType[factoryType.value] ?? barnListByType.pig)

const selectedBarn = ref<number>(1)
const breedingProdTab = ref<'breeding' | 'production'>('breeding')

const chartRef = ref<HTMLElement>()
const bioChartRef = ref<HTMLElement>()
const batchChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
let bioChartInstance: echarts.ECharts | null = null
let batchChartInstance: echarts.ECharts | null = null

const barnName = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.name ?? '栏舍'
})

const barnStatus = computed(() => {
  const barn = barnList.value.find(b => b.id === selectedBarn.value)
  return barn?.status ?? '正常'
})

const barnCameraList = computed(() => getBarnCameras(selectedBarn.value))

const batchInfo = computed(() => getBatchInfo(factoryType.value, barnName.value))
const breedingExtra = computed(() => getBreedingProductionExtra(factoryType.value))
const feedingIntake = computed(() => getFeedingIntake(factoryType.value))
const intakeAlarms = computed(() => getIntakeAlarms(factoryType.value, barnName.value))
const bioPrevention = computed(() => getBioPrevention(factoryType.value, barnName.value))
const bioTempLabel = computed(() => getBioPreventionTempLabel(factoryType.value))
const productionOutput = computed(() => getProductionOutput(factoryType.value))
const feedProduction = computed(() => getFeedProductionDetail(barnName.value))

const qcTagType = (result: string) => {
  if (result === '合格') return 'success'
  if (result === '不合格') return 'danger'
  return 'info'
}

const epidemicStatusTag = (status: string) => {
  if (status === '已关闭') return 'success'
  if (status === '处理中') return 'warning'
  return 'danger'
}

const tempStatusTag = (status: string) => {
  if (status === '正常') return 'success'
  if (status === '偏高') return 'danger'
  return 'warning'
}

const envComplianceRate = computed(() => (barnStatus.value === '告警' ? 82 : 96))
const envRates = computed(() => ({
  temp: barnStatus.value === '告警' ? 78 : 94,
  humidity: barnStatus.value === '告警' ? 85 : 92,
  gas: barnStatus.value === '告警' ? 72 : 88,
}))
const envDeviationDuration = computed(() => barnStatus.value === '告警' ? '2小时15分' : '18分')

const maintainTagType = (s: DeviceItem['maintainStatus']) => {
  if (s === '已超期') return 'danger'
  if (s === '即将到期') return 'warning'
  return 'success'
}

const withMaintenance = (devices: Omit<DeviceItem, 'faultCount' | 'nextMaintainDate' | 'maintainStatus'>[]): DeviceItem[] =>
  devices.map(d => {
    const m = getDeviceMaintenance(d.online, d.id)
    return { ...d, ...m }
  })

const bioData = ref({
  stock: 1200,
  todayMortality: 3,
  totalMortality: 28,
  mortalityRate: 0.25,
  todayFeed: 856,
  avgFeedPerHead: 0.71,
  todayWater: 12.5,
  totalFeed: 28500,
  avgWaterPerHead: 0.01,
  todayEggs: 8200,
  feedEggRatio: 2.1,
  todayBait: 320,
  todayWaterChange: 45,
  avgOxygen: 6.8,
  feedCoefficient: 1.35,
})

const envIndicators = ref([
  { label: '平均温度', value: '24.5°C', alarm: false },
  { label: '温度一', value: '24.2°C', alarm: false },
  { label: '温度二', value: '27.8°C', alarm: true },
  { label: '相对湿度', value: '65%', alarm: false },
  { label: 'CO₂浓度', value: '1250 ppm', alarm: true },
  { label: '氨气浓度', value: '12 ppm', alarm: false },
  { label: '舍外温度', value: '18°C', alarm: false },
  { label: '光照强度', value: '450 Lux', alarm: false },
])

const deviceList = ref<DeviceItem[]>(withMaintenance([
  { id: 1, name: '24寸变频风机', type: '风机', uuid: 'DEV-FAN-024', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '2小时30分', mode: 'normal' } },
  { id: 2, name: '吊顶小窗', type: '通风窗', uuid: 'DEV-WIN-001', attribute: '进风控制', online: true, controllable: true, on: true, extra: { opening: 'half', mode: 'auto' } },
  { id: 3, name: '36寸风机', type: '风机', uuid: 'DEV-FAN-036', attribute: '通风控制', online: false, controllable: true, on: false },
  { id: 4, name: '50寸风机', type: '风机', uuid: 'DEV-FAN-050', attribute: '通风控制', online: true, controllable: true, on: true, extra: { runtime: '1小时15分', mode: 'max' } },
  { id: 5, name: '水帘系统', type: '降温', uuid: 'DEV-WC-001', attribute: '降温控制', online: true, controllable: true, on: false, extra: { waterLevel: 75 } },
  { id: 6, name: '温度传感器-T01', type: '传感器', uuid: 'DEV-TEMP-001', attribute: '温度监测', online: true, controllable: false, on: true },
  { id: 7, name: '湿度传感器-H01', type: '传感器', uuid: 'DEV-HUMI-001', attribute: '湿度监测', online: true, controllable: false, on: true },
  { id: 8, name: 'CO₂传感器', type: '传感器', uuid: 'DEV-CO2-001', attribute: '气体监测', online: true, controllable: false, on: true },
]))

const deviceOnlineCount = computed(() => deviceList.value.filter(d => d.online).length)

const deviceOnlineRate = computed(() => {
  const total = deviceList.value.length
  if (!total) return 100
  return Math.round((deviceOnlineCount.value / total) * 1000) / 10
})

const offlineDevices = computed(() =>
  deviceList.value
    .filter(d => !d.online)
    .map(d => ({
      name: d.name,
      type: d.type,
      uuid: d.uuid,
      attribute: d.attribute,
      offlineSince: d.id === 3 ? '2小时15分' : '45分',
    }))
)

const deviceFaultAlarms = computed(() => getDeviceFaultAlarms(factoryType.value, barnName.value))
const energyMonitoring = computed(() => getEnergyMonitoring(factoryType.value, barnName.value))
const productionSafety = computed(() => getProductionSafety(factoryType.value, barnName.value))

const overlimitCategories: { key: SafetyOverlimitCategory; label: string }[] = [
  { key: '环控', label: '环控超限' },
  { key: '设备', label: '设备超限' },
  { key: '其他', label: '其他安全指标' },
]

const overlimitAlarmsByCategory = (category: SafetyOverlimitCategory) =>
  productionSafety.value.overlimitAlarms.filter(a => a.category === category)

const fireEmergencyResources = computed(() =>
  productionSafety.value.emergencyResources.filter(r => r.category === '消防设备')
)

const supplyEmergencyResources = computed(() =>
  productionSafety.value.emergencyResources.filter(r => r.category === '应急物资')
)

const bioKpiItems = computed<MetricItem[]>(() => {
  const d = bioData.value
  if (factoryType.value === 'chicken') {
    return [
      { key: 'stock', value: d.stock, label: '存栏（羽）', cardClass: 'primary' },
      { key: 'todayMortality', value: d.todayMortality, label: '今日死淘', valueClass: 'warn' },
      { key: 'totalMortality', value: d.totalMortality, label: '累计死淘' },
      { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '死淘率' },
    ]
  }
  if (factoryType.value === 'aquatic') {
    return [
      { key: 'stock', value: `${d.avgOxygen} mg/L`, label: '当前溶氧', cardClass: 'primary' },
      { key: 'todayMortality', value: d.todayMortality, label: '今日损耗', valueClass: 'warn' },
      { key: 'totalMortality', value: d.totalMortality, label: '累计损耗' },
      { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '损耗率' },
    ]
  }
  return [
    { key: 'stock', value: d.stock, label: '存栏（头）', cardClass: 'primary' },
    { key: 'todayMortality', value: d.todayMortality, label: '今日死淘', valueClass: 'warn' },
    { key: 'totalMortality', value: d.totalMortality, label: '累计死淘' },
    { key: 'mortalityRate', value: `${d.mortalityRate}%`, label: '死淘率' },
  ]
})

const specialSectionTitle = computed(() => {
  if (factoryType.value === 'pig') return '资源消耗'
  if (factoryType.value === 'chicken') return '生产消耗'
  return '养殖消耗'
})

const specialMetrics = computed<MetricItem[]>(() => {
  const d = bioData.value
  if (factoryType.value === 'pig') {
    return [
      { key: 'todayFeed', value: d.todayFeed, label: '今日饲料消耗（kg）', cardClass: 'feed' },
      { key: 'todayWater', value: d.todayWater, label: '今日用水消耗（m³）', cardClass: 'water' },
      { key: 'totalFeed', value: d.totalFeed.toLocaleString(), label: '累计饲料消耗（kg）' },
      { key: 'avgWaterPerHead', value: d.avgWaterPerHead, label: '头均用水（m³）' },
    ]
  }
  if (factoryType.value === 'chicken') {
    return [
      { key: 'todayFeed', value: d.todayFeed, label: '今日饲料消耗（kg）', cardClass: 'feed' },
      { key: 'todayEggs', value: d.todayEggs.toLocaleString(), label: '今日产蛋量（枚）', cardClass: 'egg' },
      { key: 'feedEggRatio', value: d.feedEggRatio, label: '料蛋比' },
      { key: 'todayWater', value: d.todayWater, label: '今日饮水量（m³）', cardClass: 'water' },
    ]
  }
  return [
    { key: 'todayBait', value: d.todayBait, label: '今日投饵量（kg）', cardClass: 'feed' },
    { key: 'todayWaterChange', value: d.todayWaterChange, label: '今日换水量（m³）', cardClass: 'water' },
    { key: 'avgOxygen', value: `${d.avgOxygen} mg/L`, label: '平均溶氧' },
    { key: 'feedCoefficient', value: d.feedCoefficient, label: '饵料系数' },
  ]
})

const bioChartTitle = computed(() => {
  if (factoryType.value === 'pig') return '近7日饲料消耗 & 用水消耗'
  if (factoryType.value === 'chicken') return '近7日饲料消耗 & 产蛋趋势'
  return '近7日投饵量 & 换水量'
})

const extraLabelMap: Record<string, string> = {
  runtime: '运行时长',
  mode: '运行模式',
  opening: '开度',
  waterLevel: '水池水位',
}

const modeMap: Record<string, string> = {
  min: '最小', normal: '常规', max: '最大', emergency: '紧急',
  manual: '手动', auto: '自动', timer: '定时',
  full: '全开', close: '全关', half: '半开', moving: '正在动作',
}

const formatExtraValue = (key: string, val: string | number) => {
  if (key === 'mode' || key === 'opening') return modeMap[String(val)] ?? val
  if (key === 'waterLevel') return `${val}%`
  return val
}

const sensorReadings: Record<number, Record<string, string>> = {
  6: { 当前温度: '24.5°C' },
  7: { 当前湿度: '65%' },
  8: { 'CO₂浓度': '1250 ppm' },
}

const deviceRunningParams = computed(() => {
  const rows: {
    deviceName: string
    deviceType: string
    paramName: string
    paramValue: string
    runStatus: string
  }[] = []

  for (const d of deviceList.value) {
    if (!d.online) continue
    const runStatus = d.controllable ? (d.on ? '开' : '关') : '监测中'

    if (d.extra && d.on) {
      for (const [key, val] of Object.entries(d.extra)) {
        rows.push({
          deviceName: d.name,
          deviceType: d.type,
          paramName: extraLabelMap[key] || key,
          paramValue: String(formatExtraValue(key, val)),
          runStatus,
        })
      }
    }

    const readings = sensorReadings[d.id]
    if (readings) {
      for (const [paramName, paramValue] of Object.entries(readings)) {
        rows.push({ deviceName: d.name, deviceType: d.type, paramName, paramValue, runStatus: '监测中' })
      }
    }
  }
  return rows
})

const goBack = () => router.push('/farm')

const generateDateData = (days: number) => {
  const dates: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
  }
  return dates
}

const rand = (min: number, max: number, fixed?: number) => {
  const v = min + Math.random() * (max - min)
  return fixed !== undefined ? Number(v.toFixed(fixed)) : Math.round(v)
}

const lightChartBase = {
  tooltip: { trigger: 'axis' as const },
  grid: { left: '3%', right: '4%', bottom: '14%', top: '12%', containLabel: true },
  splitLine: { lineStyle: { color: '#ebeef5' } },
  axisLabel: { color: '#909399', fontSize: 11 },
  axisLine: { lineStyle: { color: '#dcdfe6' } },
  legendText: { color: '#606266', fontSize: 12 },
}

const initBioChart = () => {
  if (!bioChartRef.value) return
  bioChartInstance?.dispose()
  bioChartInstance = echarts.init(bioChartRef.value)
  const dates = generateDateData(7)
  const type = factoryType.value

  let legend: string[]
  let series: EChartsOption['series']

  if (type === 'pig') {
    legend = ['饲料消耗', '用水消耗']
    series = [
      { name: '饲料消耗', type: 'bar', data: dates.map(() => rand(780, 920)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '用水消耗', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(10, 16, 1)), lineStyle: { color: '#67c23a' }, itemStyle: { color: '#67c23a' } },
    ]
  } else if (type === 'chicken') {
    legend = ['饲料消耗', '产蛋量']
    series = [
      { name: '饲料消耗', type: 'bar', data: dates.map(() => rand(700, 900)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '产蛋量', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(7500, 8800)), lineStyle: { color: '#e6a23c' }, itemStyle: { color: '#e6a23c' } },
    ]
  } else {
    legend = ['投饵量', '换水量']
    series = [
      { name: '投饵量', type: 'bar', data: dates.map(() => rand(280, 360)), itemStyle: { color: '#409eff' }, barMaxWidth: 28 },
      { name: '换水量', type: 'line', yAxisIndex: 1, smooth: true, data: dates.map(() => rand(35, 55)), lineStyle: { color: '#67c23a' }, itemStyle: { color: '#67c23a' } },
    ]
  }

  const yAxisRightName = type === 'pig' ? 'm³' : type === 'chicken' ? '枚' : 'm³'

  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: legend, bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: {
      type: 'category', data: dates,
      axisLabel: lightChartBase.axisLabel,
      axisLine: lightChartBase.axisLine,
    },
    yAxis: [
      { type: 'value', name: 'kg', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: yAxisRightName, nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series,
  }
  bioChartInstance.setOption(option)
}

const initBatchChart = () => {
  if (!batchChartRef.value) return
  batchChartInstance?.dispose()
  batchChartInstance = echarts.init(batchChartRef.value)
  const days = batchInfo.value.ageDays
  const count = Math.min(days, 30)
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const stockBase = batchInfo.value.currentStock
  const stockData = dates.map((_, i) => stockBase + rand(-30, 10) + Math.floor(i * 0.5))
  const deadData = dates.map(() => rand(0, 4))
  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: ['存栏', '死淘'], bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: { type: 'category', data: dates, axisLabel: { ...lightChartBase.axisLabel, interval: Math.floor(count / 6) }, axisLine: lightChartBase.axisLine },
    yAxis: [
      { type: 'value', name: '头', axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: '头', axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series: [
      { name: '存栏', type: 'line', smooth: true, data: stockData, lineStyle: { color: '#409eff', width: 2 }, areaStyle: { color: 'rgba(64,158,255,0.1)' }, itemStyle: { color: '#409eff' } },
      { name: '死淘', type: 'bar', yAxisIndex: 1, data: deadData, itemStyle: { color: '#f56c6c' }, barMaxWidth: 16 },
    ],
  }
  batchChartInstance.setOption(option)
}

const initEnvChart = () => {
  if (!chartRef.value) return
  if (chartRef.value.offsetWidth === 0) {
    setTimeout(initEnvChart, 50)
    return
  }
  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  const dates = generateDateData(30)
  const avgTemp = dates.map((_, i) => (24 + Math.sin(i / 5) * 1 + (Math.random() - 0.5)).toFixed(1))
  const humidity = dates.map(() => rand(58, 72))
  const option: EChartsOption = {
    tooltip: lightChartBase.tooltip,
    legend: { data: ['平均温度', '湿度'], bottom: 0, textStyle: lightChartBase.legendText },
    grid: lightChartBase.grid,
    xAxis: {
      type: 'category', boundaryGap: false, data: dates,
      axisLabel: { ...lightChartBase.axisLabel, interval: 5 },
      axisLine: lightChartBase.axisLine,
    },
    yAxis: [
      { type: 'value', name: '°C', nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: lightChartBase.splitLine },
      { type: 'value', name: '%', max: 100, nameTextStyle: { color: '#909399', fontSize: 11 }, axisLabel: lightChartBase.axisLabel, splitLine: { show: false } },
    ],
    series: [
      { name: '平均温度', type: 'line', smooth: true, data: avgTemp, lineStyle: { color: '#409eff', width: 2 }, areaStyle: { color: 'rgba(64,158,255,0.12)' }, itemStyle: { color: '#409eff' } },
      { name: '湿度', type: 'line', yAxisIndex: 1, smooth: true, data: humidity, lineStyle: { color: '#67c23a', width: 2 }, itemStyle: { color: '#67c23a' } },
    ],
  }
  chartInstance.setOption(option)
}

const refreshBarnData = () => {
  bioData.value = {
    stock: rand(1000, 1300),
    todayMortality: rand(1, 5),
    totalMortality: rand(20, 40),
    mortalityRate: rand(0.1, 0.4, 2),
    todayFeed: rand(780, 920),
    avgFeedPerHead: rand(0.6, 0.85, 2),
    todayWater: rand(10, 16, 1),
    totalFeed: rand(26000, 30000),
    avgWaterPerHead: rand(0.008, 0.012, 3),
    todayEggs: rand(7500, 8800),
    feedEggRatio: rand(1.9, 2.3, 1),
    todayBait: rand(280, 360),
    todayWaterChange: rand(35, 55),
    avgOxygen: rand(6.2, 7.5, 1),
    feedCoefficient: rand(1.2, 1.5, 2),
  }

  deviceList.value = deviceList.value.map(d => ({
    ...d,
    online: Math.random() > 0.15,
    on: d.controllable ? Math.random() > 0.4 : d.on,
    ...getDeviceMaintenance(Math.random() > 0.15, d.id),
  }))

  initBioChart()
  initBatchChart()
  initEnvChart()
}

const handleBarnChange = () => refreshBarnData()

const initSelectedBarn = () => {
  const idFromRoute = Number(route.query.id)
  const nameFromRoute = route.query.name as string
  const list = barnList.value
  if (idFromRoute && list.some(b => b.id === idFromRoute)) {
    selectedBarn.value = idFromRoute
    return
  }
  if (nameFromRoute) {
    const barn = list.find(b => b.name === nameFromRoute)
    if (barn) {
      selectedBarn.value = barn.id
      return
    }
  }
  selectedBarn.value = list[0]?.id ?? 1
}

watch(factoryType, () => {
  initSelectedBarn()
  refreshBarnData()
})

const { resizeCharts, observeContainers } = useChartResize(
  () => [chartInstance, bioChartInstance, batchChartInstance],
  () => [chartRef.value, bioChartRef.value, batchChartRef.value]
)

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initSelectedBarn()
      initBioChart()
      initBatchChart()
      initEnvChart()
      observeContainers()
      resizeCharts()
    }, 100)
  })
})

onUnmounted(() => {
  chartInstance?.dispose()
  bioChartInstance?.dispose()
  batchChartInstance?.dispose()
})
</script>

<style scoped>
.barn-detail {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  padding-bottom: 32px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-sub {
  font-size: 13px;
  color: #909399;
}

/* 垂直堆叠 */
.pillars-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: white;
  border-radius: 8px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-meta {
  font-size: 12px;
  color: #909399;
}

.batch-info-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.batch-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-label {
  font-size: 11px;
  color: #909399;
}

.batch-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 养殖与生产 */
.breeding-production-panel .panel-header-row {
  margin-bottom: 12px;
}

.bp-subsection {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.bp-subsection:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.bp-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.bp-ref-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.bp-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.bp-kpi-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}

.bp-kpi-card.primary { background: #ecf5ff; border-color: #d9ecff; }
.bp-kpi-card.success { background: #f0f9eb; border-color: #e1f3d8; }
.bp-kpi-card.warn { background: #fdf6ec; border-color: #faecd8; }
.bp-kpi-card.feed { background: #fff7e6; border-color: #ffe7ba; }

.bp-kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.bp-kpi-card.primary .bp-kpi-value { color: #409eff; }
.bp-kpi-card.success .bp-kpi-value { color: #67c23a; }
.bp-kpi-card.warn .bp-kpi-value { color: #e6a23c; }

.bp-kpi-label {
  font-size: 12px;
  color: #909399;
}

.bp-empty-hint {
  font-size: 12px;
  color: #c0c4cc;
  padding: 8px 0;
}

.intake-alarm-list {
  margin-top: 12px;
}

.intake-alarm-title,
.bio-task-title {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.intake-alarm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #fef0f0;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}

.intake-alarm-level {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.intake-alarm-level.level-严重 { background: #f56c6c; color: #fff; }
.intake-alarm-level.level-一般 { background: #e6a23c; color: #fff; }
.intake-alarm-level.level-提示 { background: #909399; color: #fff; }

.intake-alarm-time { color: #909399; flex-shrink: 0; }
.intake-alarm-msg { color: #606266; }

.bio-prevention-section .bio-block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}

.bio-prevention-section .bio-block:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.bio-block-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.bio-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bio-block-header .bio-block-title {
  margin-bottom: 0;
}

.bio-block-meta {
  font-size: 12px;
  color: #909399;
}

.bio-block-meta.warn {
  color: #e6a23c;
  font-weight: 500;
}

.bio-table {
  width: 100%;
}

.bio-alarm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bio-alarm-item {
  padding: 10px 12px;
  background: #fef0f0;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
}

.bio-alarm-item.behavior {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.bio-alarm-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.bio-alarm-disease {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.bio-alarm-desc {
  font-size: 12px;
  color: #606266;
}

.production-summary {
  padding-top: 4px;
}

.prod-block {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.prod-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prod-block-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.qc-detail {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.stock-alert-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stock-alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fdf6ec;
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
}

.drawing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.drawing-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.drawing-meta {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.capacity-summary {
  margin-bottom: 12px;
  grid-template-columns: repeat(3, 1fr);
}

.online-summary {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.online-rate-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.online-rate-label {
  font-size: 13px;
  color: #606266;
}

.online-rate-value {
  font-size: 24px;
  font-weight: 700;
  color: #67c23a;
}

.online-rate-value.warn {
  color: #e6a23c;
}

.online-rate-meta {
  font-size: 12px;
  color: #909399;
}

.offline-section {
  margin-top: 4px;
}

.bio-block-title.sub {
  font-size: 12px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.device-mgmt-panel .bio-block:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.energy-panel .bio-block:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.energy-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.energy-stat-card {
  padding: 14px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.energy-stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.energy-stat-label {
  font-size: 12px;
  color: #909399;
}

.energy-stat-change {
  font-size: 11px;
  font-weight: 600;
}

.energy-stat-change.up { color: #f56c6c; }
.energy-stat-change.down { color: #67c23a; }

.energy-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.energy-stat-value .unit {
  font-size: 13px;
  font-weight: 500;
  color: #909399;
}

.energy-quota-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
}

.quota-rate.warn {
  color: #e6a23c;
  font-weight: 600;
}

.bio-alarm-item.energy-alarm {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.energy-alarm-threshold {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.safety-panel .bio-block:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.safety-sub-block {
  margin-bottom: 12px;
}

.safety-sub-block:last-child {
  margin-bottom: 0;
}

.production-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 14px;
}

.production-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.production-item-label {
  font-size: 12px;
  color: #909399;
}

.production-item-value {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.env-compliance-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.env-compliance-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px 12px;
}

.env-compliance-item .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.deviation-value {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.batch-chart-wrap {
  margin-top: 12px;
}

.batch-chart {
  height: 220px;
}

/* 生物 KPI */
.bio-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
}

.kpi-card.primary {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.kpi-card.highlight {
  background: #fdf6ec;
  border-color: #faecd8;
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.2;
}

.kpi-card.primary .kpi-value {
  color: #409eff;
}

.kpi-card.highlight .kpi-value {
  color: #e6a23c;
}

.kpi-value.warn {
  color: #f56c6c;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* 舍内专览指标 */
.special-section {
  margin-bottom: 16px;
  padding: 14px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.special-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.special-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.special-card {
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 10px;
  text-align: center;
}

.special-card.feed {
  border-color: #d9ecff;
  background: #ecf5ff;
}

.special-card.water {
  border-color: #e1f3d8;
  background: #f0f9eb;
}

.special-card.egg {
  border-color: #faecd8;
  background: #fdf6ec;
}

.special-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.special-card.feed .special-value {
  color: #409eff;
}

.special-card.water .special-value {
  color: #67c23a;
}

.special-card.egg .special-value {
  color: #e6a23c;
}

.special-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

/* 环境指标 */
.env-indicators {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.env-item {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  position: relative;
}

.env-item.alarm {
  border-color: #fde2e2;
  background: #fef0f0;
}

.env-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.env-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.env-value.alarm {
  color: #f56c6c;
}

.env-alarm-tag {
  position: absolute;
  top: 6px;
  right: 6px;
}

/* 图表 */
.sub-chart-wrap {
  margin-top: 4px;
}

.sub-chart-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.sub-chart {
  width: 100%;
  height: 280px;
}

/* 设备网格 */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.device-card {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  transition: box-shadow 0.2s;
}

.device-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.device-card.offline {
  background: #fafafa;
  border-color: #e4e7ed;
  opacity: 0.85;
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.device-type {
  font-size: 12px;
  color: #909399;
}

.device-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.device-fields.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.device-fields.maintain-fields {
  grid-template-columns: minmax(0, 0.9fr) minmax(96px, 1.1fr) minmax(0, 0.9fr);
  gap: 8px 10px;
}

.device-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.device-field.compact {
  gap: 3px;
}

.device-field-label {
  font-size: 11px;
  line-height: 1.2;
  color: #909399;
  font-weight: 500;
}

.device-field-value {
  font-size: 13px;
  line-height: 1.35;
  color: #303133;
  font-weight: 600;
}

.device-field-value.nowrap {
  white-space: nowrap;
  font-size: 12px;
}

.device-field-value.mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  word-break: break-all;
}

.device-field-value.highlight {
  color: #409eff;
}

.device-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px 12px;
}

.device-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #ebeef5;
}

.device-card.offline .device-field-value.highlight {
  color: #909399;
}

@media (max-width: 1200px) {
  .bio-kpi-grid,
  .special-grid,
  .bp-kpi-grid,
  .production-items,
  .energy-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .device-fields.cols-3,
  .device-fields.maintain-fields {
    grid-template-columns: 1fr 1fr;
  }

  .env-indicators {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .bio-kpi-grid,
  .special-grid,
  .bp-kpi-grid,
  .production-items,
  .energy-stat-grid,
  .device-fields,
  .device-fields.cols-3,
  .device-fields.maintain-fields {
    grid-template-columns: 1fr 1fr;
  }

  .env-indicators {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
