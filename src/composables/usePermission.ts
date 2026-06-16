import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PERMISSION, type PermissionCode, type RoleCode } from '@/constants/permissions'
import { useUserStore } from '@/stores/user'
import { useRbacStore } from '@/stores/rbac'

export function usePermission() {
  const userStore = useUserStore()
  const rbacStore = useRbacStore()
  const { role, roleName, readOnly, dataScope, isHQAdmin, currentUser, boundFactoryNames } =
    storeToRefs(userStore)

  const can = (code: PermissionCode | string) => userStore.hasPermission(code)
  const canAny = (codes: (PermissionCode | string)[]) => userStore.hasAnyPermission(codes)
  const canAll = (codes: (PermissionCode | string)[]) => userStore.hasAllPermissions(codes)

  const roleOptions = computed(() =>
    rbacStore.roles.map((r) => ({ value: r.code as RoleCode, label: r.name }))
  )

  function setRole(newRole: RoleCode) {
    userStore.clearCurrentUser()
    userStore.setRole(newRole)
  }

  return {
    PERMISSION,
    role,
    roleName,
    readOnly,
    dataScope,
    isHQAdmin,
    currentUser,
    boundFactoryNames,
    roleOptions,
    can,
    canAny,
    canAll,
    setRole,
  }
}
