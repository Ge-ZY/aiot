<template>
  <div class="system-page">
    <div class="page-header">
      <div>
        <h2>角色管理</h2>
        <p class="page-desc">配置各角色拥有的菜单、模块与操作权限</p>
      </div>
      <el-button @click="handleResetAll">恢复默认配置</el-button>
    </div>

    <div class="panel">
      <el-table :data="roles" stripe>
        <el-table-column prop="name" label="角色名称" width="140" />
        <el-table-column prop="code" label="角色编码" width="180" />
        <el-table-column label="数据范围" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.dataScope === 'ALL' ? 'danger' : 'info'">
              {{ row.dataScope === 'ALL' ? '全部厂区' : '绑定厂区' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="只读" width="80" align="center">
          <template #default="{ row }">
            {{ row.readOnly ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column label="权限数量" width="100" align="center">
          <template #default="{ row }">
            {{ row.isSuperAdmin ? '全部' : row.permissions.length }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">配置权限</el-button>
            <el-button
              v-if="!row.isSuperAdmin"
              type="primary"
              link
              @click="handleResetOne(row.code)"
            >
              重置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="`配置权限 · ${editingRole?.name ?? ''}`"
      width="720px"
      destroy-on-close
    >
      <el-alert
        v-if="editingRole?.isSuperAdmin"
        type="info"
        :closable="false"
        show-icon
        title="总负责人拥有全部权限，不可在此修改。"
        style="margin-bottom: 16px;"
      />

      <div v-else class="perm-groups">
        <div v-for="group in PERMISSION_GROUPS" :key="group.label" class="perm-group">
          <div class="perm-group-header">
            <span class="perm-group-title">{{ group.label }}</span>
            <el-button type="primary" link size="small" @click="toggleGroup(group, true)">全选</el-button>
            <el-button type="primary" link size="small" @click="toggleGroup(group, false)">清空</el-button>
          </div>
          <el-checkbox-group v-model="checkedPermissions" class="perm-checkboxes">
            <el-checkbox
              v-for="item in group.items"
              :key="item.code"
              :label="item.code"
              :value="item.code"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="!editingRole?.isSuperAdmin" type="primary" @click="savePermissions">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PERMISSION_GROUPS,
  type PermissionCode,
  type RoleCode,
} from '@/constants/permissions'
import { useRbacStore, type EditableRole } from '@/stores/rbac'

const rbacStore = useRbacStore()
const { roles } = storeToRefs(rbacStore)

const dialogVisible = ref(false)
const editingRole = ref<EditableRole | null>(null)
const checkedPermissions = ref<PermissionCode[]>([])

const openEdit = (row: EditableRole) => {
  editingRole.value = row
  checkedPermissions.value = [...row.permissions]
  dialogVisible.value = true
}

const toggleGroup = (group: (typeof PERMISSION_GROUPS)[number], select: boolean) => {
  const codes = group.items.map((i) => i.code)
  if (select) {
    const merged = new Set([...checkedPermissions.value, ...codes])
    checkedPermissions.value = [...merged]
  } else {
    checkedPermissions.value = checkedPermissions.value.filter((c) => !codes.includes(c))
  }
}

const savePermissions = () => {
  if (!editingRole.value) return
  rbacStore.updateRolePermissions(editingRole.value.code, checkedPermissions.value)
  ElMessage.success('角色权限已保存')
  dialogVisible.value = false
}

const handleResetOne = async (code: RoleCode) => {
  await ElMessageBox.confirm('确定恢复该角色为系统默认权限？', '提示', { type: 'warning' })
  rbacStore.resetRolePermissions(code)
  ElMessage.success('已恢复默认')
}

const handleResetAll = async () => {
  await ElMessageBox.confirm('确定恢复全部角色为系统默认配置？', '提示', { type: 'warning' })
  rbacStore.resetAllRoles()
  ElMessage.success('已全部恢复默认')
}
</script>

<style scoped>
.system-page {
  padding: 20px 24px 32px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #303133;
}

.page-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.perm-groups {
  max-height: 55vh;
  overflow-y: auto;
}

.perm-group {
  margin-bottom: 20px;
}

.perm-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.perm-group-title {
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.perm-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.perm-checkboxes :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
}
</style>
