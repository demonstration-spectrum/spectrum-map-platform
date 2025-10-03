<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto px-4 py-6 sm:px-0">
      <div class="card">
        <div class="card-header">
          <h1 class="text-xl font-semibold text-gray-900">Profile</h1>
          <p class="mt-1 text-sm text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div class="card-body space-y-6">
          <!-- User Information -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">First Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ authStore.user?.firstName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Last Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ authStore.user?.lastName }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Email Address</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user?.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <p class="mt-1 text-sm text-gray-900">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getRoleBadgeClass(authStore.user?.role)">
                {{ authStore.user?.role }}
              </span>
            </p>
          </div>

          <div v-if="authStore.user?.corporation">
            <label class="block text-sm font-medium text-gray-700">Organization</label>
            <p class="mt-1 text-sm text-gray-900">{{ authStore.user.corporation.name }}</p>
          </div>

          <div v-if="authStore.user?.adviserAccess?.length">
            <label class="block text-sm font-medium text-gray-700">Access to Organizations</label>
            <div class="mt-1 space-y-1">
              <div
                v-for="access in authStore.user.adviserAccess"
                :key="access.id"
                class="text-sm text-gray-900"
              >
                {{ access.corporation.name }}
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Last Login</label>
            <p class="mt-1 text-sm text-gray-900">
              {{ authStore.user?.lastLoginAt ? formatDate(authStore.user.lastLoginAt) : 'Never' }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Member Since</label>
            <p class="mt-1 text-sm text-gray-900">
              {{ authStore.user?.createdAt ? formatDate(authStore.user.createdAt) : 'Unknown' }}
            </p>
          </div>

          <!-- Actions -->
          <div class="pt-6 border-t border-gray-200">
            <div class="flex justify-end space-x-3">
              <button
                @click="logout"
                class="btn-danger"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { UserRole } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const getRoleBadgeClass = (role?: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-red-100 text-red-800'
    case 'CORP_ADMIN':
      return 'bg-blue-100 text-blue-800'
    case 'EDITOR':
      return 'bg-green-100 text-green-800'
    case 'ADVISER':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const logout = () => {
  authStore.logout()
  toast.success('Signed out successfully')
  router.push('/login')
}
</script>
