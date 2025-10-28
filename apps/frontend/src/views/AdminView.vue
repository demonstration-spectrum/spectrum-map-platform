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
      <!-- Create User Modal -->
      <div v-if="showCreateUserModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create User</h3>
            
            <form @submit.prevent="createUser">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input v-model="newUser.email" type="email" required class="input" placeholder="user@example.com" />
              </div>

              <div class="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First name</label>
                  <input v-model="newUser.firstName" type="text" required class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                  <input v-model="newUser.lastName" type="text" required class="input" />
                </div>
              </div>

              <div class="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select v-model="newUser.role" class="input">
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="CORP_ADMIN">CORP_ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADVISER">ADVISER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Corporation</label>
                  <select v-model="newUser.corporationId" class="input">
                    <option value="">(none)</option>
                    <option v-for="c in corporations" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end space-x-3">
                <button @click="showCreateUserModal = false" type="button" class="btn-secondary">Cancel</button>
                <button type="submit" :disabled="isCreatingUser" class="btn-primary">{{ isCreatingUser ? 'Creating...' : 'Create' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <!-- Edit Corporation Modal -->
      <div v-if="showEditCorporationModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Corporation</h3>

            <form @submit.prevent="saveCorporation">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input v-model="editCorporationForm.name" type="text" required class="input" placeholder="Enter corporation name" />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea v-model="editCorporationForm.description" rows="3" class="input" placeholder="Enter corporation description" />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select v-model="editCorporationForm.status" class="input">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DELETED">DELETED</option>
                </select>
              </div>

              <div class="flex justify-end space-x-3">
                <button @click="showEditCorporationModal = false" type="button" class="btn-secondary">Cancel</button>
                <button type="submit" :disabled="isSavingCorporation" class="btn-primary">{{ isSavingCorporation ? 'Saving...' : 'Save' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <!-- Edit User Modal -->
      <div v-if="showEditUserModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form @submit.prevent="saveEditUser">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input v-model="editUserForm.email" type="email" required class="input" />
              </div>
              <div class="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First name</label>
                  <input v-model="editUserForm.firstName" type="text" required class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                  <input v-model="editUserForm.lastName" type="text" required class="input" />
                </div>
              </div>

              <div class="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select v-model="editUserForm.role" class="input">
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="CORP_ADMIN">CORP_ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADVISER">ADVISER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Corporation</label>
                  <select v-model="editUserForm.corporationId" class="input">
                    <option value="">(none)</option>
                    <option v-for="c in corporations" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>

              <div class="mb-4">
                <label class="inline-flex items-center">
                  <input type="checkbox" v-model="editUserForm.isActive" class="form-checkbox h-4 w-4 text-primary-600" />
                  <span class="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div class="flex justify-end space-x-3">
                <button @click="showEditUserModal = false" type="button" class="btn-secondary">Cancel</button>
                <button type="submit" :disabled="isSavingEdit" class="btn-primary">{{ isSavingEdit ? 'Saving...' : 'Save' }}</button>
              </div>
            </form>
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

    <!-- Users Management (Super Admin) -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900">Users</h2>
        <button
          @click="showCreateUserModal = true"
          class="btn-primary"
        >
          Create User
        </button>
      </div>

      <div class="card">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corporation</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.role }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.corporation?.name || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span :class="getActiveBadgeClass(user.isActive)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.createdAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="editUser(user)" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                  <button @click="deleteUser(user)" class="text-red-600 hover:text-red-900">Deactivate</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCorporationsStore } from '@/stores/corporations'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import { api } from '@/utils/api'
import type { Corporation, CorporationStatus, User } from '@/types'

const corporationsStore = useCorporationsStore()
const toast = useToast()

const corporations = ref<Corporation[]>([])
const stats = ref({
  corporations: 0,
  users: 0,
  maps: 0,
  datasets: 0
})

// Corporations modals
const showCreateCorporationModal = ref(false)
const isCreating = ref(false)
const newCorporation = ref({ name: '', description: '' })
// Edit corporation modal
const showEditCorporationModal = ref(false)
const isSavingCorporation = ref(false)
const editCorporationForm = ref({ id: '', name: '', description: '', status: 'ACTIVE' })

// Users modals
const showCreateUserModal = ref(false)
const isCreatingUser = ref(false)
const newUser = ref({
  email: '',
  firstName: '',
  lastName: '',
  role: 'EDITOR',
  corporationId: ''
})
// Edit user modal
const showEditUserModal = ref(false)
const isSavingEdit = ref(false)
const editUserForm = ref({
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  role: 'EDITOR',
  corporationId: '',
  isActive: true,
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

const getActiveBadgeClass = (isActive?: boolean) => {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Users list (fetched from new /users endpoint)
const users = ref<User[]>([])

const loadUsers = async () => {
  try {
    const resp = await api.get('/users')
    users.value = resp.data || []
    stats.value.users = users.value.length
  } catch (error) {
    console.error('Failed to load users:', error)
  }
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
  editCorporationForm.value = {
    id: corporation.id,
    name: corporation.name,
    description: corporation.description || '',
    status: corporation.status || 'ACTIVE',
  }
  showEditCorporationModal.value = true
}

const saveCorporation = async () => {
  if (!editCorporationForm.value.name) return
  isSavingCorporation.value = true
  try {
    await corporationsStore.update(editCorporationForm.value.id, {
      name: editCorporationForm.value.name,
      description: editCorporationForm.value.description,
      status: editCorporationForm.value.status,
    })
    toast.success('Corporation updated')
    showEditCorporationModal.value = false
    await loadCorporations()
  } catch (error) {
    console.error('Failed to update corporation', error)
    toast.error('Failed to update corporation')
  } finally {
    isSavingCorporation.value = false
  }
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

// --- Users CRUD (create implemented client-side using /auth/register) ---
const createUser = async () => {
  if (!newUser.value.email || !newUser.value.firstName || !newUser.value.lastName) return

  isCreatingUser.value = true
  try {
    await api.post('/users', {
      email: newUser.value.email,
      firstName: newUser.value.firstName,
      lastName: newUser.value.lastName,
      role: newUser.value.role,
      corporationId: newUser.value.corporationId,
    })

    toast.success('User created successfully')
    showCreateUserModal.value = false
    newUser.value = { email: '', firstName: '', lastName: '', role: 'EDITOR', corporationId: '' }
    await loadUsers()
    await loadCorporations()
  } catch (error) {
    toast.error('Failed to create user')
  } finally {
    isCreatingUser.value = false
  }
}

const editUser = (user: User) => {
  // Open edit modal and populate form
  editUserForm.value = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    corporationId: user.corporationId || '',
    isActive: user.isActive !== false,
  }
  showEditUserModal.value = true
}

const deleteUser = async (user: User) => {
  if (!confirm(`Are you sure you want to deactivate ${user.email}?`)) return

  try {
    await api.delete(`/users/${user.id}`)
    toast.success('User deactivated')
    await loadUsers()
    await loadCorporations()
  } catch (error) {
    toast.error('Failed to deactivate user')
  }
}

const saveEditUser = async () => {
  const id = editUserForm.value.id
  if (!id) return

  isSavingEdit.value = true
  try {
    await api.patch(`/users/${id}`, {
      email: editUserForm.value.email,
      firstName: editUserForm.value.firstName,
      lastName: editUserForm.value.lastName,
      role: editUserForm.value.role,
      corporationId: editUserForm.value.corporationId || undefined,
      isActive: editUserForm.value.isActive,
    })

    toast.success('User updated')
    showEditUserModal.value = false
    await Promise.all([loadUsers(), loadCorporations()])
  } catch (error) {
    console.error('Failed to update user', error)
    toast.error('Failed to update user')
  } finally {
    isSavingEdit.value = false
  }
}

const loadCorporations = async () => {
  try {
    await corporationsStore.fetchAll()
    corporations.value = corporationsStore.corporations
    stats.value.corporations = corporations.value.length
    // TODO: compute other stats (users, maps, datasets) when endpoints available
  } catch (error) {
    toast.error('Failed to load corporations')
  }
}

onMounted(async () => {
  await Promise.all([loadCorporations(), loadUsers()])
})
</script>
