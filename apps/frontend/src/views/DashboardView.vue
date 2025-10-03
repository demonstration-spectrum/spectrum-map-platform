<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {{ authStore.user?.firstName }}!
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Here's what's happening with your maps and datasets.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Maps</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.maps }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Datasets</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.datasets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Recent Activity</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.recentActivity }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.teamMembers }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            to="/maps/create"
            class="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-primary-500 text-white mb-4">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Create New Map</h3>
              <p class="text-sm text-gray-500">Start building a new interactive map</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/datasets/upload"
            class="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-green-500 text-white mb-4">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Upload Dataset</h3>
              <p class="text-sm text-gray-500">Add new geospatial data to your library</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/maps"
            class="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="card-body text-center">
              <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-md bg-blue-500 text-white mb-4">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Browse Maps</h3>
              <p class="text-sm text-gray-500">View and manage your existing maps</p>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Recent Maps -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Recent Maps</h2>
          <RouterLink to="/maps" class="text-sm text-primary-600 hover:text-primary-500">
            View all
          </RouterLink>
        </div>
        
        <div v-if="recentMaps.length === 0" class="card">
          <div class="card-body text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No maps yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating your first map.</p>
            <div class="mt-6">
              <RouterLink to="/maps/create" class="btn-primary">
                Create Map
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="map in recentMaps"
            :key="map.id"
            class="card hover:shadow-md transition-shadow cursor-pointer"
            @click="$router.push(`/maps/${map.id}`)"
          >
            <div class="card-body">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 truncate">{{ map.name }}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getVisibilityBadgeClass(map.visibility)">
                  {{ map.visibility }}
                </span>
              </div>
              <p v-if="map.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
                {{ map.description }}
              </p>
              <div class="mt-4 flex items-center text-sm text-gray-500">
                <span>{{ map._count?.layers || 0 }} layers</span>
                <span class="mx-2">•</span>
                <span>{{ formatDate(map.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMapsStore } from '@/stores/maps'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { Map, MapVisibility } from '@/types'

const authStore = useAuthStore()
const mapsStore = useMapsStore()

const stats = ref({
  maps: 0,
  datasets: 0,
  recentActivity: 0,
  teamMembers: 0
})

const recentMaps = ref<Map[]>([])

const getVisibilityBadgeClass = (visibility: MapVisibility) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'bg-green-100 text-green-800'
    case 'PASSWORD_PROTECTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'PRIVATE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

onMounted(async () => {
  try {
    // Fetch recent maps
    await mapsStore.fetchMaps()
    recentMaps.value = mapsStore.maps.slice(0, 6)
    
    // Update stats
    stats.value.maps = mapsStore.maps.length
    // TODO: Fetch other stats from API
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
})
</script>
