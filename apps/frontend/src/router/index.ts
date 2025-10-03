import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/maps',
      name: 'maps',
      component: () => import('@/views/MapsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/maps/create',
      name: 'create-map',
      component: () => import('@/views/CreateMapView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/maps/:id',
      name: 'map-editor',
      component: () => import('@/views/MapEditorView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/maps/:id/view',
      name: 'map-view',
      component: () => import('@/views/MapViewView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/datasets',
      name: 'datasets',
      component: () => import('@/views/DatasetsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/datasets/upload',
      name: 'upload-dataset',
      component: () => import('@/views/UploadDatasetView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresRole: 'SUPER_ADMIN' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresRole && authStore.user?.role !== to.meta.requiresRole) {
    next('/dashboard')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
