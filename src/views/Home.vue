<template>
  <div class="home">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 AIOT-web</span>
        </div>
      </template>
      <div class="counter">
        <p>计数: {{ count }}</p>
        <el-button type="primary" @click="increment">+1</el-button>
        <el-button type="danger" @click="decrement">-1</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '../stores/counter'

const counterStore = useCounterStore()
const { count, increment, decrement } = counterStore
</script>

<style scoped>
.home {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.counter {
  text-align: center;
  padding: 20px;
}
.counter p {
  font-size: 24px;
  margin-bottom: 20px;
}
</style>
