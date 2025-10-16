<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Datasets</h1>
          <p class="mt-1 text-sm text-gray-600">
            Manage your geospatial data files
          </p>
        </div>
        <RouterLink v-if="!authStore.isViewer" to="/datasets/upload" class="btn-primary">
          Upload Dataset
        </RouterLink>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex items-center space-x-4">
        <div class="flex-1 max-w-lg">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search datasets..."
            class="input"
          />
        </div>
        <select v-model="visibilityFilter" class="input w-48">
          <option value="">All visibility</option>
          <option value="PRIVATE">Private</option>
          <option value="SHARED">Shared</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>

      <!-- Datasets Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="card animate-pulse">
          <div class="card-body">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>

      <div v-else-if="datasets.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No datasets</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by uploading your first dataset.</p>
          <div class="mt-6" v-if="!authStore.isViewer">
          <RouterLink to="/datasets/upload" class="btn-primary">
            Upload Dataset
          </RouterLink>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="dataset in filteredDatasets"
          :key="dataset.id"
          class="card hover:shadow-md transition-shadow"
        >
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-medium text-gray-900 truncate">{{ dataset.name }}</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getVisibilityBadgeClass(dataset.visibility)">
                {{ dataset.visibility }}
              </span>
            </div>
            
            <p v-if="dataset.description" class="text-sm text-gray-500 line-clamp-2 mb-4">
              {{ dataset.description }}
            </p>
            
            <div class="space-y-2 text-sm text-gray-500">
              <div class="flex items-center justify-between">
                <span>File: {{ dataset.fileName }}</span>
                <span>{{ formatFileSize(dataset.fileSize) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>{{ dataset._count?.layers || 0 }} layers</span>
                <span>{{ formatDate(dataset.updatedAt) }}</span>
              </div>
            </div>
            
              <div class="mt-4 flex items-center justify-between">
              <span class="text-xs text-gray-400">by {{ dataset.uploadedBy.firstName }} {{ dataset.uploadedBy.lastName }}</span>
              <div class="flex items-center space-x-2" v-if="!authStore.isViewer">
                <button
                  @click="editDataset(dataset)"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="deleteDataset(dataset)"
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDatasetsStore } from '@/stores/datasets'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { Dataset, DatasetVisibility } from '@/types'

const router = useRouter()
const datasetsStore = useDatasetsStore()
const toast = useToast()
const authStore = useAuthStore()

const searchQuery = ref('')
const visibilityFilter = ref('')
const isLoading = ref(false)

const datasets = computed(() => datasetsStore.datasets)

const filteredDatasets = computed(() => {
  let filtered = datasets.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(dataset => 
      dataset.name.toLowerCase().includes(query) ||
      dataset.description?.toLowerCase().includes(query) ||
      dataset.fileName.toLowerCase().includes(query)
    )
  }

  if (visibilityFilter.value) {
    filtered = filtered.filter(dataset => dataset.visibility === visibilityFilter.value)
  }

  return filtered
})

const getVisibilityBadgeClass = (visibility: DatasetVisibility) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'bg-green-100 text-green-800'
    case 'SHARED':
      return 'bg-blue-100 text-blue-800'
    case 'PRIVATE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

const editDataset = (dataset: Dataset) => {
  // TODO: Implement dataset editing
  toast.info('Dataset editing coming soon!')
}

const deleteDataset = async (dataset: Dataset) => {
  if (!confirm(`Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await datasetsStore.deleteDataset(dataset.id)
    toast.success('Dataset deleted successfully')
  } catch (error) {
    toast.error('Failed to delete dataset')
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await datasetsStore.fetchDatasets()
  } catch (error) {
    toast.error('Failed to load datasets')
  } finally {
    isLoading.value = false
  }
})
</script>
