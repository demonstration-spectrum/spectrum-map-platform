<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Maps</h1>
          <p class="mt-1 text-sm text-gray-600">
            Create and manage your interactive maps
          </p>
        </div>
        <RouterLink v-if="!authStore.isViewer" to="/maps/create" class="btn-primary">
          Create New Map
        </RouterLink>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex items-center space-x-4">
        <div class="flex-1 max-w-lg">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search maps..."
            class="input"
          />
        </div>
        <select v-model="visibilityFilter" class="input w-48">
          <option value="">All visibility</option>
          <option value="PRIVATE">Private</option>
          <option value="PASSWORD_PROTECTED">Password Protected</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>

      <!-- Maps Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="card animate-pulse">
          <div class="card-body">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>

  <div v-else-if="filteredMaps.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No maps</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new map.</p>
          <div class="mt-6" v-if="!authStore.isViewer">
          <RouterLink to="/maps/create" class="btn-primary">
            Create Map
          </RouterLink>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="map in filteredMaps"
          :key="map.id"
          class="card hover:shadow-md transition-shadow cursor-pointer"
          @click="$router.push(`/maps/${map.id}`)"
        >
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-medium text-gray-900 truncate">{{ map.name }}</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getVisibilityBadgeClass(map.visibility)">
                {{ map.visibility }}
              </span>
            </div>
            
            <p v-if="map.description" class="text-sm text-gray-500 line-clamp-2 mb-4">
              {{ map.description }}
            </p>
            
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>{{ map._count?.layers || 0 }} layers</span>
              <span>{{ formatDate(map.updatedAt) }}</span>
            </div>
            
            <div class="mt-4 flex items-center justify-between">
              <span class="text-xs text-gray-400">by {{ map.createdBy.firstName }} {{ map.createdBy.lastName }}</span>
              <div class="flex items-center space-x-2" v-if="!authStore.isViewer">
                <button
                  @click.stop="editMap(map)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="deleteMap(map)"
                  class="text-gray-400 hover:text-red-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { Map, MapVisibility } from '@/types'

const router = useRouter()
const mapsStore = useMapsStore()
const authStore = useAuthStore()
const toast = useToast()

const searchQuery = ref('')
const visibilityFilter = ref('')
const isLoading = ref(false)

const filteredMaps = computed(() => {
  let filtered = mapsStore.maps

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(map => 
      map.name.toLowerCase().includes(query) ||
      map.description?.toLowerCase().includes(query)
    )
  }

  if (visibilityFilter.value) {
    filtered = filtered.filter(map => map.visibility === visibilityFilter.value)
  }

  return filtered
})

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

const editMap = (map: Map) => {
  router.push(`/maps/${map.id}`)
}

const deleteMap = async (map: Map) => {
  if (!confirm(`Are you sure you want to delete "${map.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await mapsStore.deleteMap(map.id)
    toast.success('Map deleted successfully')
  } catch (error) {
    toast.error('Failed to delete map')
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await mapsStore.fetchMaps()
  } catch (error) {
    toast.error('Failed to load maps')
  } finally {
    isLoading.value = false
  }
})
</script>
