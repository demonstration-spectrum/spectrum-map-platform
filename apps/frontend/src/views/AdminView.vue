<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage corporations, users, and system settings
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Corporations</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.corporations }}</dd>
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.users }}</dd>
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
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Datasets</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.datasets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Corporations Management -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Corporations</h2>
          <button
            @click="showCreateCorporationModal = true"
            class="btn-primary"
          >
            Create Corporation
          </button>
        </div>

        <div class="card">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maps
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datasets
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="corporation in corporations" :key="corporation.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ corporation.name }}</div>
                      <div v-if="corporation.description" class="text-sm text-gray-500">
                        {{ corporation.description }}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusBadgeClass(corporation.status)">
                      {{ corporation.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ corporation._count?.users || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ corporation._count?.maps || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ corporation._count?.datasets || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(corporation.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="editCorporation(corporation)"
                      class="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteCorporation(corporation)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Corporation Modal -->
      <div v-if="showCreateCorporationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create Corporation</h3>
            
            <form @submit.prevent="createCorporation">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  v-model="newCorporation.name"
                  type="text"
                  required
                  class="input"
                  placeholder="Enter corporation name"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  v-model="newCorporation.description"
                  rows="3"
                  class="input"
                  placeholder="Enter corporation description"
                />
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  @click="showCreateCorporationModal = false"
                  type="button"
                  class="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isCreating"
                  class="btn-primary"
                >
                  {{ isCreating ? 'Creating...' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCorporationsStore } from '@/stores/corporations'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { Corporation, CorporationStatus } from '@/types'

const corporationsStore = useCorporationsStore()
const toast = useToast()

const corporations = ref<Corporation[]>([])
const stats = ref({
  corporations: 0,
  users: 0,
  maps: 0,
  datasets: 0
})

const showCreateCorporationModal = ref(false)
const isCreating = ref(false)
const newCorporation = ref({
  name: '',
  description: ''
})

const getStatusBadgeClass = (status: CorporationStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'SUSPENDED':
      return 'bg-yellow-100 text-yellow-800'
    case 'DELETED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const createCorporation = async () => {
  if (!newCorporation.value.name) return

  isCreating.value = true
  try {
    await corporationsStore.create(newCorporation.value)
    toast.success('Corporation created successfully')
    showCreateCorporationModal.value = false
    newCorporation.value = { name: '', description: '' }
    await loadCorporations()
  } catch (error) {
    toast.error('Failed to create corporation')
  } finally {
    isCreating.value = false
  }
}

const editCorporation = (corporation: Corporation) => {
  // TODO: Implement corporation editing
  toast.info('Corporation editing coming soon!')
}

const deleteCorporation = async (corporation: Corporation) => {
  if (!confirm(`Are you sure you want to delete "${corporation.name}"? This action cannot be undone.`)) {
    return
  }

  try {
    await corporationsStore.remove(corporation.id)
    toast.success('Corporation deleted successfully')
    await loadCorporations()
  } catch (error) {
    toast.error('Failed to delete corporation')
  }
}

const loadCorporations = async () => {
  try {
    await corporationsStore.fetchAll()
    corporations.value = corporationsStore.corporations
    stats.value.corporations = corporations.value.length
    // TODO: Load other stats
  } catch (error) {
    toast.error('Failed to load corporations')
  }
}

onMounted(async () => {
  await loadCorporations()
})
</script>
