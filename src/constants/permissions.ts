/** 五角色权限码与配置 */

export type RoleCode =
  | 'HQ_ADMIN'
  | 'FACTORY_ADMIN'
  | 'FACTORY_OPERATOR'
  | 'FACTORY_PRODUCTION'
  | 'VIEWER'

export type DataScope = 'ALL' | 'FACTORY'

export const PERMISSION = {
  ORG_ALL: 'org:all',
  ORG_FACTORY: 'org:factory',
  ORG_BARN: 'org:barn',

  MENU_DASHBOARD: 'menu:dashboard',
  MENU_FARM: 'menu:farm',
  MENU_BARN: 'menu:barn',
  MENU_ALARM: 'menu:alarm',
  MENU_DEVICE: 'menu:device',
  MENU_MONITOR: 'menu:monitor',
  MENU_COMPARE: 'menu:compare',
  MENU_ROLE_MANAGE: 'menu:role_manage',
  MENU_USER_MANAGE: 'menu:user_manage',

  MODULE_TODAY_BOARD: 'module:today_board',
  MODULE_ENV_SUMMARY: 'module:env_summary',
  MODULE_BUSINESS: 'module:business',
  MODULE_ORDER: 'module:order',
  MODULE_DATA_MONITOR: 'module:data_monitor',
  MODULE_BREEDING: 'module:breeding',
  MODULE_BIO: 'module:bio',
  MODULE_ENV_DETAIL: 'module:env_detail',
  MODULE_DEVICE_MGMT: 'module:device_mgmt',
  MODULE_DEVICE_DETAIL: 'module:device_detail',
  MODULE_ENERGY: 'module:energy',
  MODULE_SAFETY: 'module:safety',
  MODULE_BIO_PREVENTION: 'module:bio_prevention',
  MODULE_FEEDING: 'module:feeding',
  MODULE_FEED_PRODUCTION: 'module:feed_production',
  MODULE_DASHBOARD_NATIONAL: 'module:dashboard_national',
  MODULE_COMPARE_PLATFORM: 'module:compare_platform',
  MODULE_COMPARE_BENCHMARK: 'module:compare_benchmark',

  ALARM_READ: 'alarm:read',
  ALARM_HANDLE: 'alarm:handle',
  ALARM_EXPORT: 'alarm:export',
  MONITOR_VIEW: 'monitor:view',
  MONITOR_FULLSCREEN: 'monitor:fullscreen',
  DEVICE_CONTROL: 'device:control',
  DATA_EXPORT: 'data:export',
  COMPARE_READ: 'compare:read',
} as const

export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION]

export interface RoleDefinition {
  code: RoleCode
  name: string
  dataScope: DataScope
  readOnly: boolean
  permissions: PermissionCode[] | ['*']
}

const FACTORY_ADMIN_PERMISSIONS: PermissionCode[] = [
  PERMISSION.ORG_FACTORY,
  PERMISSION.MENU_DASHBOARD,
  PERMISSION.MENU_FARM,
  PERMISSION.MENU_BARN,
  PERMISSION.MENU_ALARM,
  PERMISSION.MENU_DEVICE,
  PERMISSION.MENU_MONITOR,
  PERMISSION.MODULE_TODAY_BOARD,
  PERMISSION.MODULE_ENV_SUMMARY,
  PERMISSION.MODULE_BUSINESS,
  PERMISSION.MODULE_ORDER,
  PERMISSION.MODULE_DATA_MONITOR,
  PERMISSION.MODULE_COMPARE_BENCHMARK,
  PERMISSION.MODULE_BREEDING,
  PERMISSION.MODULE_FEEDING,
  PERMISSION.MODULE_BIO_PREVENTION,
  PERMISSION.MODULE_FEED_PRODUCTION,
  PERMISSION.MODULE_BIO,
  PERMISSION.MODULE_ENV_DETAIL,
  PERMISSION.MODULE_DEVICE_MGMT,
  PERMISSION.MODULE_DEVICE_DETAIL,
  PERMISSION.MODULE_ENERGY,
  PERMISSION.MODULE_SAFETY,
  PERMISSION.ALARM_READ,
  PERMISSION.ALARM_HANDLE,
  PERMISSION.ALARM_EXPORT,
  PERMISSION.MONITOR_VIEW,
  PERMISSION.MONITOR_FULLSCREEN,
  PERMISSION.DEVICE_CONTROL,
  PERMISSION.DATA_EXPORT,
]

const FACTORY_OPERATOR_PERMISSIONS: PermissionCode[] = [
  PERMISSION.ORG_FACTORY,
  PERMISSION.MENU_DASHBOARD,
  PERMISSION.MENU_FARM,
  PERMISSION.MENU_BARN,
  PERMISSION.MENU_ALARM,
  PERMISSION.MENU_DEVICE,
  PERMISSION.MENU_MONITOR,
  PERMISSION.MODULE_TODAY_BOARD,
  PERMISSION.MODULE_ENV_SUMMARY,
  PERMISSION.MODULE_DATA_MONITOR,
  PERMISSION.MODULE_ENV_DETAIL,
  PERMISSION.MODULE_DEVICE_MGMT,
  PERMISSION.MODULE_DEVICE_DETAIL,
  PERMISSION.MODULE_SAFETY,
  PERMISSION.ALARM_READ,
  PERMISSION.ALARM_HANDLE,
  PERMISSION.MONITOR_VIEW,
  PERMISSION.MONITOR_FULLSCREEN,
  PERMISSION.DEVICE_CONTROL,
]

const FACTORY_PRODUCTION_PERMISSIONS: PermissionCode[] = [
  PERMISSION.ORG_FACTORY,
  PERMISSION.ORG_BARN,
  PERMISSION.MENU_FARM,
  PERMISSION.MENU_BARN,
  PERMISSION.MENU_ALARM,
  PERMISSION.MODULE_TODAY_BOARD,
  PERMISSION.MODULE_ENV_SUMMARY,
  PERMISSION.MODULE_DATA_MONITOR,
  PERMISSION.MODULE_BREEDING,
  PERMISSION.MODULE_FEEDING,
  PERMISSION.MODULE_BIO_PREVENTION,
  PERMISSION.MODULE_BIO,
  PERMISSION.MODULE_ENV_DETAIL,
  PERMISSION.MODULE_SAFETY,
  PERMISSION.ALARM_READ,
]

const VIEWER_PERMISSIONS: PermissionCode[] = [
  PERMISSION.ORG_FACTORY,
  PERMISSION.MENU_FARM,
  PERMISSION.MENU_BARN,
  PERMISSION.MENU_ALARM,
  PERMISSION.MODULE_TODAY_BOARD,
  PERMISSION.MODULE_ENV_SUMMARY,
  PERMISSION.MODULE_DATA_MONITOR,
  PERMISSION.MODULE_BREEDING,
  PERMISSION.MODULE_BIO,
  PERMISSION.MODULE_ENV_DETAIL,
  PERMISSION.ALARM_READ,
]

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: 'HQ_ADMIN',
    name: '总负责人',
    dataScope: 'ALL',
    readOnly: false,
    permissions: ['*'],
  },
  {
    code: 'FACTORY_ADMIN',
    name: '厂区管理员',
    dataScope: 'FACTORY',
    readOnly: false,
    permissions: FACTORY_ADMIN_PERMISSIONS,
  },
  {
    code: 'FACTORY_OPERATOR',
    name: '厂区运维',
    dataScope: 'FACTORY',
    readOnly: false,
    permissions: FACTORY_OPERATOR_PERMISSIONS,
  },
  {
    code: 'FACTORY_PRODUCTION',
    name: '厂区生产',
    dataScope: 'FACTORY',
    readOnly: false,
    permissions: FACTORY_PRODUCTION_PERMISSIONS,
  },
  {
    code: 'VIEWER',
    name: '只读访客',
    dataScope: 'FACTORY',
    readOnly: true,
    permissions: VIEWER_PERMISSIONS,
  },
]

export const ROLE_MAP = Object.fromEntries(
  ROLE_DEFINITIONS.map((r) => [r.code, r])
) as Record<RoleCode, RoleDefinition>

export function getDefaultRolePermissions(role: RoleCode): PermissionCode[] | ['*'] {
  return ROLE_MAP[role]?.permissions ?? []
}

/** @deprecated 请使用 rbac store 的 getRolePermissions */
export function getRolePermissions(role: RoleCode): PermissionCode[] | ['*'] {
  return getDefaultRolePermissions(role)
}

/** 权限分组（角色管理页勾选） */
export interface PermissionGroupItem {
  code: PermissionCode
  label: string
}

export interface PermissionGroup {
  label: string
  items: PermissionGroupItem[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: '系统管理',
    items: [
      { code: PERMISSION.MENU_ROLE_MANAGE, label: '角色管理' },
      { code: PERMISSION.MENU_USER_MANAGE, label: '用户管理' },
    ],
  },
  {
    label: '菜单权限',
    items: [
      { code: PERMISSION.MENU_DASHBOARD, label: '大屏可视化' },
      { code: PERMISSION.MENU_FARM, label: '农场详情' },
      { code: PERMISSION.MENU_BARN, label: '舍详情' },
      { code: PERMISSION.MENU_ALARM, label: '报警详情' },
      { code: PERMISSION.MENU_DEVICE, label: '设备详情' },
      { code: PERMISSION.MENU_MONITOR, label: '监控点位' },
      { code: PERMISSION.MENU_COMPARE, label: '数据对比' },
    ],
  },
  {
    label: '组织范围',
    items: [
      { code: PERMISSION.ORG_ALL, label: '全部厂区' },
      { code: PERMISSION.ORG_FACTORY, label: '绑定厂区' },
      { code: PERMISSION.ORG_BARN, label: '栏舍级范围' },
    ],
  },
  {
    label: '农场详情模块',
    items: [
      { code: PERMISSION.MODULE_TODAY_BOARD, label: '今日生产看板' },
      { code: PERMISSION.MODULE_ENV_SUMMARY, label: '环境达标摘要' },
      { code: PERMISSION.MODULE_BUSINESS, label: '经营效益' },
      { code: PERMISSION.MODULE_ORDER, label: '订单详情' },
      { code: PERMISSION.MODULE_DATA_MONITOR, label: '数据监测' },
      { code: PERMISSION.MODULE_COMPARE_BENCHMARK, label: '本厂区域对标' },
    ],
  },
  {
    label: '舍详情模块',
    items: [
      { code: PERMISSION.MODULE_BREEDING, label: '养殖与生产' },
      { code: PERMISSION.MODULE_FEEDING, label: '饲喂采食' },
      { code: PERMISSION.MODULE_BIO_PREVENTION, label: '生物防疫' },
      { code: PERMISSION.MODULE_FEED_PRODUCTION, label: '饲料生产' },
      { code: PERMISSION.MODULE_BIO, label: '生物数据' },
      { code: PERMISSION.MODULE_ENV_DETAIL, label: '环境数据' },
      { code: PERMISSION.MODULE_DEVICE_MGMT, label: '设备管理' },
      { code: PERMISSION.MODULE_DEVICE_DETAIL, label: '设备详情' },
      { code: PERMISSION.MODULE_ENERGY, label: '能耗监测' },
      { code: PERMISSION.MODULE_SAFETY, label: '生产安全' },
    ],
  },
  {
    label: '大屏模块',
    items: [
      { code: PERMISSION.MODULE_DASHBOARD_NATIONAL, label: '跨厂统计（重点工厂/等级/类型）' },
      { code: PERMISSION.MODULE_COMPARE_PLATFORM, label: '全平台区域对比' },
    ],
  },
  {
    label: '操作权限',
    items: [
      { code: PERMISSION.ALARM_READ, label: '查看报警' },
      { code: PERMISSION.ALARM_HANDLE, label: '处理报警' },
      { code: PERMISSION.ALARM_EXPORT, label: '导出报警' },
      { code: PERMISSION.MONITOR_VIEW, label: '查看监控' },
      { code: PERMISSION.MONITOR_FULLSCREEN, label: '监控全屏' },
      { code: PERMISSION.DEVICE_CONTROL, label: '设备控制' },
      { code: PERMISSION.DATA_EXPORT, label: '数据导出' },
      { code: PERMISSION.COMPARE_READ, label: '查看对比数据' },
    ],
  },
]

export const ALL_ASSIGNABLE_PERMISSIONS: PermissionCode[] = PERMISSION_GROUPS.flatMap(
  (g) => g.items.map((i) => i.code)
)

/** 路由 path → 所需菜单权限 */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionCode> = {
  '/': PERMISSION.MENU_DASHBOARD,
  '/farm': PERMISSION.MENU_FARM,
  '/farm/barn-detail': PERMISSION.MENU_BARN,
  '/farm/alarm-detail': PERMISSION.MENU_ALARM,
  '/farm/device-detail': PERMISSION.MENU_DEVICE,
  '/farm/monitor-detail': PERMISSION.MENU_MONITOR,
  '/farm/comparison-detail': PERMISSION.MENU_COMPARE,
  '/farm/system/role-manage': PERMISSION.MENU_ROLE_MANAGE,
  '/farm/system/user-manage': PERMISSION.MENU_USER_MANAGE,
}

export function getRoutePermission(path: string): PermissionCode | undefined {
  if (ROUTE_PERMISSION_MAP[path]) return ROUTE_PERMISSION_MAP[path]
  if (path.startsWith('/farm/barn-detail')) return PERMISSION.MENU_BARN
  return undefined
}
