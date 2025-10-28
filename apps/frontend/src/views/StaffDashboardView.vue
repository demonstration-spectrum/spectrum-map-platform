<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <div class="mt-3 flex items-center justify-between">
          <p class="text-sm text-gray-600">Browse corporations and manage their maps, datasets, and users.</p>
          <button class="btn-primary" @click="openCreateCorp">Create Corporation</button>
        </div>
      </div>

      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maps</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datasets</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="corp in corporations" :key="corp.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ corp.name }}</div>
                  <div v-if="corp.description" class="text-sm text-gray-500">{{ corp.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ corp._count?.users || 0 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ corp._count?.maps || 0 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ corp._count?.datasets || 0 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <RouterLink :to="{ name: 'staff-corp', params: { id: corp.id } }" class="text-primary-600 hover:text-primary-900">Manage</RouterLink>
                  <button v-if="corp.status!=='DELETED'" class="text-red-600 hover:text-red-800" @click="deleteCorp(corp.id)">Delete</button>
                  <button v-else class="text-green-600 hover:text-green-800" @click="recoverCorp(corp.id)">Recover</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center space-x-2">
        <label class="text-sm text-gray-700 flex items-center space-x-2">
          <input type="checkbox" v-model="showDeleted" @change="reloadCorps" />
          <span>Show deleted corporations</span>
        </label>
      </div>

      <!-- Create Corporation Modal -->
      <div v-if="showCreate" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-1">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create Corporation</h3>
            <form @submit.prevent="createCorp">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input v-model="form.name" type="text" required class="input" />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea v-model="form.description" rows="3" class="input"></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" class="btn-secondary" @click="closeCreate">Cancel</button>
                <button type="submit" class="btn-primary">{{ saving ? 'Creating…' : 'Create' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useCorporationsStore } from '@/stores/corporations'
import type { Corporation } from '@/types'

const corporationsStore = useCorporationsStore()
const corporations = ref<Corporation[]>([])

const showCreate = ref(false)
const saving = ref(false)
const form = ref<{ name: string; description?: string }>({ name: '', description: '' })
const showDeleted = ref(false)

onMounted(async () => {
  await reloadCorps()
})

const reloadCorps = async () => {
  if (showDeleted.value) {
    await corporationsStore.fetchAllAdmin(true)
  } else {
    await corporationsStore.fetchAll()
  }
  corporations.value = corporationsStore.corporations
}

const openCreateCorp = () => {
  form.value = { name: '', description: '' }
  showCreate.value = true
}

const closeCreate = () => {
  showCreate.value = false
}

const createCorp = async () => {
  if (!form.value.name.trim()) return
  saving.value = true
  try {
    await corporationsStore.create({ name: form.value.name.trim(), description: form.value.description?.trim() || undefined })
    showCreate.value = false
    await reloadCorps()
  } finally {
    saving.value = false
  }
}

const deleteCorp = async (id: string) => {
  if (!confirm('Delete this corporation?')) return
  await corporationsStore.remove(id)
  await reloadCorps()
}

const recoverCorp = async (id: string) => {
  await corporationsStore.recover(id)
  await reloadCorps()
}
</script>
