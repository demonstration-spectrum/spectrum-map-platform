<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto px-4 py-6 sm:px-0">
      <div class="card">
        <div class="card-header">
          <h1 class="text-xl font-semibold text-gray-900">Create New Map</h1>
          <p class="mt-1 text-sm text-gray-600">
            Set up your new interactive map with custom settings
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="card-body space-y-6">
          <div v-if="authStore.isStaff">
            <label for="corp" class="block text-sm font-medium text-gray-700">
              Target Corporation *
            </label>
            <select
              id="corp"
              v-model="selectedCorporationId"
              class="input mt-1"
            >
              <option value="">Select a corporation</option>
              <option v-for="c in corporations" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Map Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input mt-1"
              placeholder="Enter map name"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="input mt-1"
              placeholder="Describe your map (optional)"
            />
          </div>

          <div>
            <label for="visibility" class="block text-sm font-medium text-gray-700">
              Visibility *
            </label>
            <select
              id="visibility"
              v-model="form.visibility"
              required
              class="input mt-1"
            >
              <option value="PRIVATE">Private - Only your organization can see this map</option>
              <option value="PASSWORD_PROTECTED">Password Protected - Anyone with the password can view</option>
              <option value="PUBLIC">Public - Anyone can view this map</option>
            </select>
          </div>

          <div v-if="form.visibility === 'PASSWORD_PROTECTED'">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input mt-1"
              placeholder="Enter password for map access"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="centerLat" class="block text-sm font-medium text-gray-700">
                Center Latitude
              </label>
              <input
                id="centerLat"
                v-model.number="form.centerLat"
                type="number"
                step="any"
                class="input mt-1"
                placeholder="40.7128"
              />
            </div>
            <div>
              <label for="centerLng" class="block text-sm font-medium text-gray-700">
                Center Longitude
              </label>
              <input
                id="centerLng"
                v-model.number="form.centerLng"
                type="number"
                step="any"
                class="input mt-1"
                placeholder="-74.0060"
              />
            </div>
          </div>

          <div>
            <label for="zoom" class="block text-sm font-medium text-gray-700">
              Initial Zoom Level
            </label>
            <input
              id="zoom"
              v-model.number="form.zoom"
              type="number"
              min="0"
              max="22"
              step="0.1"
              class="input mt-1"
              placeholder="10"
            />
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <RouterLink to="/maps" class="btn-secondary">
              Cancel
            </RouterLink>
            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary"
            >
              {{ isLoading ? 'Creating...' : 'Create Map' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { CreateMapRequest } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useCorporationsStore } from '@/stores/corporations'
import { MapVisibility } from '@/types'

const router = useRouter()
const route = useRoute()
const mapsStore = useMapsStore()
const toast = useToast()
const authStore = useAuthStore()
const corporationsStore = useCorporationsStore()
const corporations = ref<{ id: string; name: string }[]>([])
const selectedCorporationId = ref<string>((route.query.corporationId as string) || '')

const form = ref<CreateMapRequest>({
  name: '',
  description: '',
  visibility: MapVisibility.PRIVATE,
  password: '',
  centerLat: undefined,
  centerLng: undefined,
  zoom: 2
})

const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!form.value.name) {
    error.value = 'Map name is required'
    return
  }

  if (form.value.visibility === 'PASSWORD_PROTECTED' && !form.value.password) {
    error.value = 'Password is required for password-protected maps'
    return
  }

  if (authStore.isStaff && !selectedCorporationId.value) {
    error.value = 'Please select a target corporation'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const payload: CreateMapRequest = { ...form.value }
    const corporationId = selectedCorporationId.value || (route.query.corporationId as string) || undefined
    if (corporationId) payload.corporationId = corporationId
    const newMap = await mapsStore.createMap(payload)
    toast.success('Map created successfully!')
    router.push(`/maps/${newMap.id}`)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create map. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (authStore.isStaff) {
    await corporationsStore.fetchAll()
    corporations.value = corporationsStore.corporations
  }
})
</script>
