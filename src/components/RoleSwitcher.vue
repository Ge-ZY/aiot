<template>
  <div class="role-switcher" :class="theme">
    <div v-if="currentUser" class="current-user">
      <span class="user-label">当前用户</span>
      <span class="user-name">{{ currentUser.displayName }}</span>
    </div>
    <span class="role-label">{{ currentUser ? '角色' : '模拟角色' }}</span>
    <el-select
      :model-value="role"
      size="small"
      class="role-select"
      @change="handleRoleChange"
    >
      <el-option
        v-for="item in roleOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { getRoutePermission } from '@/constants/permissions'
import type { RoleCode } from '@/constants/permissions'

withDefaults(
  defineProps<{ theme?: 'dark' | 'light' }>(),
  { theme: 'dark' }
)

const router = useRouter()
const { role, roleOptions, setRole, can, currentUser } = usePermission()

const handleRoleChange = (newRole: RoleCode) => {
  const label = roleOptions.value.find((r) => r.value === newRole)?.label ?? newRole
  setRole(newRole)
  ElMessage.success(`已切换为：${label}`)

  const required = getRoutePermission(router.currentRoute.value.path)
  if (required && !can(required)) {
    router.push('/farm')
  }
}
</script>

<style scoped>
.role-switcher {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.role-switcher.light {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0;
  border-top: none;
}

.current-user {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.role-switcher.light .current-user {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 0;
}

.user-label,
.role-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}

.role-switcher.light .role-label,
.role-switcher.light .user-label {
  color: rgba(255, 255, 255, 0.75);
}

.user-name {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.role-select {
  width: 100%;
}

.role-switcher.light .role-select {
  width: 130px;
}
</style>
