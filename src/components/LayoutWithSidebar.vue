<template>
  <div class="layout-with-sidebar">
    <div class="sidebar">
      <el-card>
        <template #header>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <h4>公司列表</h4>
              <el-input v-model="filterText" placeholder="输入关键字过滤" size="small" style="width: 150px;" clearable />
            </div>
            <el-select v-model="selectedFactoryType" placeholder="选择工厂类型" size="small" style="width: 100%;">
              <el-option
                v-for="type in factoryTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </div>
        </template>
        <el-tree 
          :data="companies" 
          node-key="id" 
          :props="{
            label: 'name',
            value: 'id',
            children: 'children'
          }" 
          @node-click="handleNodeClick" 
          highlight-current
          :expand-on-click-node="false" 
          :filter-node-method="filterNode" 
          ref="companyTree"
          :default-expand-all="false"
        />
      </el-card>
    </div>
    <div class="main-content">
      <slot :currentFactory="currentFactory" :selectedFactoryType="selectedFactoryType" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompanyTree } from '@/composables/useCompanyTree'

const {
  companies,
  filterText,
  companyTree,
  currentFactory,
  selectedFactoryType,
  factoryTypes,
  filterNode,
  handleNodeClick
} = useCompanyTree()

// 显式使用 companyTree 以避免 TypeScript 报错
void companyTree

defineExpose({
  currentFactory,
  selectedFactoryType
})
</script>

<style scoped>
.layout-with-sidebar {
  display: flex;
  width: 100%;
  min-height: 100%;
  align-items: flex-start;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid #e6e6e6;
}

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
  min-width: 0;
}
</style>
