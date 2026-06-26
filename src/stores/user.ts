import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type PermissionCode,
  type RoleCode,
  ROLE_DEFINITIONS,
} from '@/constants/permissions'
import { useRbacStore } from '@/stores/rbac'

const ROLE_STORAGE_KEY = 'aiot_user_role'
const USER_ID_STORAGE_KEY = 'aiot_current_user_id'

function loadStoredRole(): RoleCode {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY) as RoleCode | null
  if (stored && ROLE_DEFINITIONS.some((r) => r.code === stored)) {
    return stored
  }
  return 'HQ_ADMIN'
}

export const useUserStore = defineStore('user', () => {
  const role = ref<RoleCode>(loadStoredRole())
  const currentUserId = ref<string | null>(localStorage.getItem(USER_ID_STORAGE_KEY))

  const rbacStore = useRbacStore()

  const currentUser = computed(() =>
    currentUserId.value ? rbacStore.getUserById(currentUserId.value) : null
  )

  const roleDefinition = computed(() => rbacStore.getRoleByCode(role.value))
  const roleName = computed(() => roleDefinition.value?.name ?? role.value)
  const permissions = computed(() => rbacStore.getRolePermissions(role.value))
  const readOnly = computed(() => roleDefinition.value?.readOnly ?? false)
  const dataScope = computed(() => roleDefinition.value?.dataScope ?? 'FACTORY')
  const isHQAdmin = computed(() => role.value === 'HQ_ADMIN')
  const boundFactoryIds = computed(() => currentUser.value?.factoryIds ?? [])
  const boundFactoryNames = computed(() => currentUser.value?.factoryNames ?? [])

  function setRole(newRole: RoleCode) {
    role.value = newRole
    
    localStorage.setItem(ROLE_STORAGE_KEY, newRole)
  }

  function loginAsUser(userId: string) {
    const user = rbacStore.getUserById(userId)
    if (!user || !user.enabled) return
    currentUserId.value = userId
    localStorage.setItem(USER_ID_STORAGE_KEY, userId)
    setRole(user.roleCode)
  }

  function clearCurrentUser() {
    currentUserId.value = null
    localStorage.removeItem(USER_ID_STORAGE_KEY)
  }

  function hasPermission(code: PermissionCode | string): boolean {
    const perms = permissions.value
    if (perms.length === 1 && (perms as string[])[0] === '*') return true
    return (perms as PermissionCode[]).includes(code as PermissionCode)
  }

  function hasAnyPermission(codes: (PermissionCode | string)[]): boolean {
    return codes.some((code) => hasPermission(code))
  }

  function hasAllPermissions(codes: (PermissionCode | string)[]): boolean {
    return codes.every((code) => hasPermission(code))
  }

  return {
    role,
    currentUserId,
    currentUser,
    roleName,
    roleDefinition,
    permissions,
    readOnly,
    dataScope,
    isHQAdmin,
    boundFactoryIds,
    boundFactoryNames,
    setRole,
    loginAsUser,
    clearCurrentUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
})
