import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import MainLayout from '../layout/MainLayout.vue'
import { PERMISSION } from '@/constants/permissions'
import { getRoutePermission } from '@/constants/permissions'
import { useUserStore } from '@/stores/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { permission: PERMISSION.MENU_DASHBOARD },
  },
  {
    path: '/farm',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'FarmDetail',
        component: () => import('../views/FarmDetail.vue'),
        meta: { permission: PERMISSION.MENU_FARM },
      },
      {
        path: 'barn-detail',
        name: 'BarnDetail',
        component: () => import('../views/BarnDetail.vue'),
        meta: { hidden: true, permission: PERMISSION.MENU_BARN },
      },
      {
        path: 'alarm-detail',
        name: 'AlarmDetail',
        component: () => import('../views/AlarmDetail.vue'),
        meta: { permission: PERMISSION.MENU_ALARM },
      },
      {
        path: 'device-detail',
        name: 'DeviceDetail',
        component: () => import('../views/DeviceDetail.vue'),
        meta: { permission: PERMISSION.MENU_DEVICE },
      },
      {
        path: 'monitor-detail',
        name: 'MonitorDetail',
        component: () => import('../views/MonitorDetail.vue'),
        meta: { permission: PERMISSION.MENU_MONITOR },
      },
      {
        path: 'comparison-detail',
        name: 'ComparisonDetail',
        component: () => import('../views/ComparisonDetail.vue'),
        meta: { permission: PERMISSION.MENU_COMPARE },
      },
      {
        path: 'system/role-manage',
        name: 'RoleManage',
        component: () => import('../views/system/RoleManage.vue'),
        meta: { permission: PERMISSION.MENU_ROLE_MANAGE },
      },
      {
        path: 'system/user-manage',
        name: 'UserManage',
        component: () => import('../views/system/UserManage.vue'),
        meta: { permission: PERMISSION.MENU_USER_MANAGE },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const required =
    (to.meta.permission as string | undefined) ?? getRoutePermission(to.path)

  if (required && !userStore.hasPermission(required)) {
    ElMessage.warning('当前角色无权限访问该页面')
    if (userStore.hasPermission(PERMISSION.MENU_FARM)) {
      next('/farm')
    } else {
      next(false)
    }
    return
  }
  next()
})

export default router
