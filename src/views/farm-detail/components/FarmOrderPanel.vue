<template>
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
</template>
<script setup lang="ts">
import { inject } from 'vue'
import { FARM_DETAIL_KEY } from '../farmDetailContext'

const ctx = inject(FARM_DETAIL_KEY)!
const { orderFulfillment, overdueOrderCount, factoryOrders } = ctx
</script>
