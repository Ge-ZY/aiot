import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'barn-detail',
        name: 'BarnDetail',
        component: () => import('../views/BarnDetail.vue')
      },
      {
        path: 'alarm-detail',
        name: 'AlarmDetail',
        component: () => import('../views/AlarmDetail.vue')
      },
      {
        path: 'device-detail',
        name: 'DeviceDetail',
        component: () => import('../views/DeviceDetail.vue')
      },
      {
        path: 'monitor-detail',
        name: 'MonitorDetail',
        component: () => import('../views/MonitorDetail.vue')
      }
    ]
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
