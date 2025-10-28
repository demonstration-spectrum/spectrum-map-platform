<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0 space-y-8">
      <div>
        <button class="text-sm text-gray-600 hover:text-gray-900" @click="$router.back()">← Back</button>
        <div class="mt-2 flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ corporation?.name }}</h1>
            <p class="text-sm text-gray-600" v-if="corporation?.description">{{ corporation?.description }}</p>
            <div v-if="corporation?.status==='DELETED'" class="mt-2 text-sm text-red-600">This corporation is deleted. Recover to manage resources.</div>
          </div>
          <div class="flex items-center space-x-3">
            <button class="btn-secondary" @click="openEditCorp" :disabled="!corporation">Edit</button>
            <button v-if="corporation?.status!=='DELETED'" class="text-red-600 hover:text-red-800" @click="onDeleteCorp" :disabled="!corporation">Delete</button>
            <button v-else class="btn-primary" @click="onRecoverCorp" :disabled="!corporation">Recover</button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <RouterLink :to="{ name: 'create-map', query: { corporationId: corpId } }" class="card hover:shadow-md">
          <div class="card-body">
            <div class="font-medium">Create Map for this Corp</div>
            <div class="text-sm text-gray-500">On submit, we'll create under this corporation.</div>
          </div>
        </RouterLink>
  <RouterLink :to="{ name: 'upload-dataset', query: { corporationId: corpId } }" class="card hover:shadow-md">
          <div class="card-body">
            <div class="font-medium">Upload Dataset for this Corp</div>
            <div class="text-sm text-gray-500">On submit, we'll upload under this corporation.</div>
          </div>
        </RouterLink>
      </div>

      <!-- Users Management -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Users</h2>
          <button class="btn-primary" @click="openCreateUser()">Add User</button>
        </div>
        <div class="card">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="u in corporation?.users || []" :key="u.id">
                  <td class="px-6 py-4 whitespace-nowrap">{{ u.firstName }} {{ u.lastName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ u.email }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ u.role }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <button class="text-primary-600 hover:text-primary-900 mr-3" @click="openEditUser(u)">Edit</button>
                    <button class="text-red-600 hover:text-red-900" @click="deactivateUser(u)">Deactivate</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Maps List -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Maps</h2>
          <RouterLink :to="{ name: 'create-map', query: { corporationId: corpId } }" class="btn-secondary">Create Map</RouterLink>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="m in maps" :key="m.id" class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div class="font-medium">{{ m.name }}</div>
                <span class="text-xs bg-gray-100 px-2 rounded">{{ m.visibility }}</span>
              </div>
              <div class="mt-3 flex items-center justify-end space-x-3">
                <RouterLink :to="{ name: 'map-editor', params: { id: m.id } }" class="text-primary-600 hover:text-primary-800">Edit</RouterLink>
                <button class="text-red-600 hover:text-red-800" @click="onDeleteMap(m)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Datasets List -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Datasets</h2>
          <RouterLink :to="{ name: 'upload-dataset', query: { corporationId: corpId } }" class="btn-secondary">Upload Dataset</RouterLink>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="d in datasets" :key="d.id" class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{{ d.name }}</div>
                  <div class="text-xs text-gray-500">{{ d.visibility }}</div>
                </div>
                <div class="flex items-center space-x-3">
                  <button class="text-primary-600 hover:text-primary-800" @click="openEditDataset(d)">Edit</button>
                  <button class="text-red-600 hover:text-red-800" @click="onDeleteDataset(d)">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit User Modal -->
      <div v-if="showUserModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ editingUser ? 'Edit User' : 'Add User' }}</h3>
            <form @submit.prevent="saveUser">
              <div class="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input v-model="userForm.firstName" type="text" required class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input v-model="userForm.lastName" type="text" required class="input" />
                </div>
              </div>
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input v-model="userForm.email" type="email" required class="input" :disabled="!!editingUser" />
              </div>
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select v-model="userForm.role" class="input">
                  <option value="CORP_ADMIN">CORP_ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="ADVISER">ADVISER</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" class="btn-secondary" @click="closeUserModal">Cancel</button>
                <button type="submit" class="btn-primary">{{ saving ? 'Saving…' : 'Save' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Dataset Modal -->
      <div v-if="showDatasetModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Dataset</h3>
            <form @submit.prevent="saveDataset">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input v-model="datasetForm.name" type="text" required class="input" />
              </div>
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea v-model="datasetForm.description" rows="3" class="input"></textarea>
              </div>
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <select v-model="datasetForm.visibility" class="input">
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="SHARED">SHARED</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" class="btn-secondary" @click="closeDatasetModal">Cancel</button>
                <button type="submit" class="btn-primary">{{ savingDataset ? 'Saving…' : 'Save' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Corporation Modal -->
      <div v-if="showCorpModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Corporation</h3>
            <form @submit.prevent="saveCorp">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input v-model="corpForm.name" type="text" required class="input" />
              </div>
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea v-model="corpForm.description" rows="3" class="input"></textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" class="btn-secondary" @click="closeCorpModal">Cancel</button>
                <button type="submit" class="btn-primary">{{ savingCorp ? 'Saving…' : 'Save' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useCorporationsStore } from '@/stores/corporations'
import { useMapsStore } from '@/stores/maps'
import { useDatasetsStore } from '@/stores/datasets'
import { api } from '@/utils/api'
import type { Corporation, Map, Dataset, User } from '@/types'

const route = useRoute()
const corpId = ref<string>(String(route.params.id))
const corporationsStore = useCorporationsStore()
const mapsStore = useMapsStore()
const datasetsStore = useDatasetsStore()

const corporation = ref<Corporation | null>(null)
const maps = ref<Map[]>([])
const datasets = ref<Dataset[]>([])

const showUserModal = ref(false)
const editingUser = ref<User | null>(null)
const saving = ref(false)
const userForm = ref<{ id?: string; email: string; firstName: string; lastName: string; role: string }>({ email: '', firstName: '', lastName: '', role: 'EDITOR' })

// Corporation editing state
const showCorpModal = ref(false)
const savingCorp = ref(false)
const corpForm = ref<{ name: string; description?: string }>({ name: '', description: '' })

// Dataset editing state
const showDatasetModal = ref(false)
const savingDataset = ref(false)
const editingDataset = ref<Dataset | null>(null)
const datasetForm = ref<{ name: string; description?: string; visibility: string }>({ name: '', description: '', visibility: 'PRIVATE' })

const loadAll = async () => {
  corporation.value = await corporationsStore.fetchOne(corpId.value)
  await mapsStore.fetchMaps({ corporationId: corpId.value })
  maps.value = mapsStore.maps
  await datasetsStore.fetchDatasets({ corporationId: corpId.value })
  datasets.value = datasetsStore.datasets
}

onMounted(loadAll)
watch(() => route.params.id, async (val) => { corpId.value = String(val); await loadAll() })

const openCreateUser = () => {
  editingUser.value = null
  userForm.value = { email: '', firstName: '', lastName: '', role: 'EDITOR' }
  showUserModal.value = true
}
const openEditUser = (u: User) => {
  editingUser.value = u
  userForm.value = { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role }
  showUserModal.value = true
}
const closeUserModal = () => { showUserModal.value = false }

const saveUser = async () => {
  saving.value = true
  try {
    if (editingUser.value) {
      await api.patch(`/users/${editingUser.value.id}`, { firstName: userForm.value.firstName, lastName: userForm.value.lastName, role: userForm.value.role, corporationId: corpId.value })
    } else {
      await api.post('/users', { email: userForm.value.email, firstName: userForm.value.firstName, lastName: userForm.value.lastName, role: userForm.value.role, corporationId: corpId.value })
    }
    showUserModal.value = false
    await loadAll()
  } finally {
    saving.value = false
  }
}

const deactivateUser = async (u: User) => {
  if (!confirm(`Deactivate ${u.email}?`)) return
  await api.delete(`/users/${u.id}`)
  await loadAll()
}

const openEditDataset = (d: Dataset) => {
  editingDataset.value = d
  datasetForm.value = { name: d.name, description: d.description || '', visibility: d.visibility as unknown as string }
  showDatasetModal.value = true
}

const closeDatasetModal = () => {
  showDatasetModal.value = false
}

const saveDataset = async () => {
  if (!editingDataset.value) return
  savingDataset.value = true
  try {
    await datasetsStore.updateDataset(editingDataset.value.id, {
      name: datasetForm.value.name,
      description: datasetForm.value.description,
      visibility: datasetForm.value.visibility as any
    })
    showDatasetModal.value = false
    await loadAll()
  } finally {
    savingDataset.value = false
  }
}

const onDeleteDataset = async (d: Dataset) => {
  if (!confirm(`Delete dataset "${d.name}"? This cannot be undone.`)) return
  await datasetsStore.deleteDataset(d.id)
  await loadAll()
}

const onDeleteMap = async (m: Map) => {
  if (!confirm(`Delete map "${m.name}"? This cannot be undone.`)) return
  await mapsStore.deleteMap(m.id)
  await loadAll()
}

const openEditCorp = () => {
  if (!corporation.value) return
  corpForm.value = { name: corporation.value.name, description: corporation.value.description || '' }
  showCorpModal.value = true
}

const closeCorpModal = () => { showCorpModal.value = false }

const saveCorp = async () => {
  if (!corporation.value) return
  savingCorp.value = true
  try {
    await corporationsStore.update(corporation.value.id, {
      name: corpForm.value.name,
      description: corpForm.value.description,
    })
    showCorpModal.value = false
    await loadAll()
  } finally {
    savingCorp.value = false
  }
}

const onDeleteCorp = async () => {
  if (!corporation.value) return
  if (!confirm(`Delete corporation \"${corporation.value.name}\"? This will disable access until recovered.`)) return
  await corporationsStore.remove(corporation.value.id)
  await loadAll()
}

const onRecoverCorp = async () => {
  if (!corporation.value) return
  await corporationsStore.recover(corporation.value.id)
  await loadAll()
}
</script>
