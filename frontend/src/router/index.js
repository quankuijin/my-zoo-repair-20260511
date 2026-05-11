import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: () => {
      const authStore = useAuthStore()
      return authStore.hasRole('ADMIN') ? '/dashboard' : '/users'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: '🏠', roles: ['ADMIN'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: '👥', permission: 'USER_LIST' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/Roles.vue'),
        meta: { title: '角色管理', icon: '🎭', permission: 'ROLE_LIST', roles: ['ADMIN'] }
      },
      {
        path: 'permissions',
        name: 'Permissions',
        component: () => import('@/views/Permissions.vue'),
        meta: { title: '权限管理', icon: '🔐', permission: 'PERMISSION_LIST', roles: ['ADMIN'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next(authStore.hasRole('ADMIN') ? '/dashboard' : '/users')
  } else {
    // 检查角色权限（只有当页面明确配置了roles时才检查）
    if (to.meta.roles && to.meta.roles.length > 0) {
      if (!to.meta.roles.some(role => authStore.hasRole(role))) {
        // 静默重定向到用户有权限的页面
        next(authStore.hasRole('ADMIN') ? '/dashboard' : '/users')
        return
      }
    }
    
    // 检查功能权限（只有当页面配置了permission时才检查）
    if (to.meta.permission) {
      if (!authStore.hasPermission(to.meta.permission)) {
        // 静默重定向到用户有权限的页面
        next(authStore.hasRole('ADMIN') ? '/dashboard' : '/users')
        return
      }
    }
    
    next()
  }
})

export default router
