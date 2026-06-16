import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  type PermissionCode,
  type RoleCode,
  ROLE_DEFINITIONS,
  getDefaultRolePermissions,
} from '@/constants/permissions'

const ROLES_STORAGE_KEY = 'aiot_rbac_roles'
const USERS_STORAGE_KEY = 'aiot_rbac_users'

export interface EditableRole {
  code: RoleCode
  name: string
  dataScope: 'ALL' | 'FACTORY'
  readOnly: boolean
  /** true 表示拥有全部权限，不可在界面逐项取消 */
  isSuperAdmin: boolean
  permissions: PermissionCode[]
  description?: string
}

export interface ManagedUser {
  id: string
  username: string
  displayName: string
  phone: string
  roleCode: RoleCode
  /** 绑定厂区 ID，空数组且非总负责人时表示未绑定 */
  factoryIds: string[]
  factoryNames: string[]
  enabled: boolean
  createdAt: string
}

export interface FactoryOption {
  id: string
  name: string
  region?: string
}

/** 可选厂区（后续可对接组织树 API） */
export const FACTORY_OPTIONS: FactoryOption[] = [
  { id: 'f001', name: '正芯一号猪场', region: '华东' },
  { id: 'f002', name: '正芯二号鸡场', region: '华北' },
  { id: 'f003', name: '正芯三号水产场', region: '华南' },
  { id: 'f004', name: '正芯饲料厂', region: '华东' },
  { id: 'f005', name: '正芯五号猪场', region: '西南' },
  { id: 'f006', name: '正芯六号蛋鸡场', region: '华中' },
]

function cloneDefaultRoles(): EditableRole[] {
  return ROLE_DEFINITIONS.map((r) => {
    const isSuperAdmin = r.permissions.length === 1 && r.permissions[0] === '*'
    return {
      code: r.code,
      name: r.name,
      dataScope: r.dataScope,
      readOnly: r.readOnly,
      isSuperAdmin,
      permissions: isSuperAdmin
        ? []
        : ([...getDefaultRolePermissions(r.code)] as PermissionCode[]),
      description: getRoleDescription(r.code),
    }
  })
}

function getRoleDescription(code: RoleCode): string {
  const map: Record<RoleCode, string> = {
    HQ_ADMIN: '集团总负责人，可见全部厂区与系统管理',
    FACTORY_ADMIN: '厂长/场长，管理本厂全部业务',
    FACTORY_OPERATOR: '环控与设备运维，侧重报警与设备',
    FACTORY_PRODUCTION: '生产一线，查看养殖与环境数据',
    VIEWER: '临时只读账号，最小可见范围',
  }
  return map[code]
}

function cloneDefaultUsers(): ManagedUser[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'u001',
      username: 'admin',
      displayName: '系统管理员',
      phone: '13800000001',
      roleCode: 'HQ_ADMIN',
      factoryIds: [],
      factoryNames: [],
      enabled: true,
      createdAt: now,
    },
    {
      id: 'u002',
      username: 'zhangchang',
      displayName: '张厂长',
      phone: '13800000002',
      roleCode: 'FACTORY_ADMIN',
      factoryIds: ['f001'],
      factoryNames: ['正芯一号猪场'],
      enabled: true,
      createdAt: now,
    },
    {
      id: 'u003',
      username: 'yunwei01',
      displayName: '李运维',
      phone: '13800000003',
      roleCode: 'FACTORY_OPERATOR',
      factoryIds: ['f001'],
      factoryNames: ['正芯一号猪场'],
      enabled: true,
      createdAt: now,
    },
    {
      id: 'u004',
      username: 'siyang01',
      displayName: '王饲养',
      phone: '13800000004',
      roleCode: 'FACTORY_PRODUCTION',
      factoryIds: ['f001'],
      factoryNames: ['正芯一号猪场'],
      enabled: true,
      createdAt: now,
    },
  ]
}

function loadRoles(): EditableRole[] {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as EditableRole[]
  } catch {
    /* ignore */
  }
  return cloneDefaultRoles()
}

function loadUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ManagedUser[]
  } catch {
    /* ignore */
  }
  return cloneDefaultUsers()
}

function persistRoles(roles: EditableRole[]) {
  localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
}

function persistUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export const useRbacStore = defineStore('rbac', () => {
  const roles = ref<EditableRole[]>(loadRoles())
  const users = ref<ManagedUser[]>(loadUsers())

  function getRoleByCode(code: RoleCode): EditableRole | undefined {
    return roles.value.find((r) => r.code === code)
  }

  function getRolePermissions(code: RoleCode): PermissionCode[] | ['*'] {
    const role = getRoleByCode(code)
    if (!role) return getDefaultRolePermissions(code)
    if (role.isSuperAdmin) return ['*']
    return role.permissions
  }

  function updateRolePermissions(code: RoleCode, permissions: PermissionCode[]) {
    const role = getRoleByCode(code)
    if (!role || role.isSuperAdmin) return
    role.permissions = [...permissions]
    persistRoles(roles.value)
  }

  function resetRolePermissions(code: RoleCode) {
    const role = getRoleByCode(code)
    if (!role || role.isSuperAdmin) return
    role.permissions = [...getDefaultRolePermissions(code)] as PermissionCode[]
    persistRoles(roles.value)
  }

  function resetAllRoles() {
    roles.value = cloneDefaultRoles()
    persistRoles(roles.value)
  }

  function addUser(payload: Omit<ManagedUser, 'id' | 'createdAt'>) {
    const user: ManagedUser = {
      ...payload,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    users.value.push(user)
    persistUsers(users.value)
    return user
  }

  function updateUser(id: string, payload: Partial<Omit<ManagedUser, 'id' | 'createdAt'>>) {
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx < 0) return
    users.value[idx] = { ...users.value[idx], ...payload }
    persistUsers(users.value)
  }

  function removeUser(id: string) {
    users.value = users.value.filter((u) => u.id !== id)
    persistUsers(users.value)
  }

  function getUserById(id: string) {
    return users.value.find((u) => u.id === id)
  }

  function getFactoryNames(ids: string[]) {
    return ids
      .map((id) => FACTORY_OPTIONS.find((f) => f.id === id)?.name)
      .filter(Boolean) as string[]
  }

  return {
    roles,
    users,
    getRoleByCode,
    getRolePermissions,
    updateRolePermissions,
    resetRolePermissions,
    resetAllRoles,
    addUser,
    updateUser,
    removeUser,
    getUserById,
    getFactoryNames,
  }
})
