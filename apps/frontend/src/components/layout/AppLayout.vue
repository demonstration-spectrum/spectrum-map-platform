<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <RouterLink to="/" class="text-xl font-bold text-primary-600">
                Spectrum Map
              </RouterLink>
            </div>
            
            <!-- Navigation Links -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <RouterLink
                to="/dashboard"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                active-class="border-primary-500 text-primary-600"
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/maps"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                active-class="border-primary-500 text-primary-600"
              >
                Maps
              </RouterLink>
              <RouterLink
                to="/datasets"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                active-class="border-primary-500 text-primary-600"
              >
                Datasets
              </RouterLink>
              <RouterLink
                v-if="authStore.isSuperAdmin"
                to="/admin"
                class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                active-class="border-primary-500 text-primary-600"
              >
                Admin
              </RouterLink>
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <!-- Corporation Switcher (for advisers) -->
            <div v-if="authStore.isAdviser && authStore.user?.adviserAccess?.length" class="relative">
              <select
                v-model="selectedCorporationId"
                @change="switchCorporation"
                class="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Corporation</option>
                <option
                  v-for="access in authStore.user.adviserAccess"
                  :key="access.corporationId"
                  :value="access.corporationId"
                >
                  {{ access.corporation.name }}
                </option>
              </select>
            </div>

            <!-- User Dropdown -->
            <div class="relative">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-sm font-medium text-white">
                    {{ userInitials }}
                  </span>
                </div>
                <span class="ml-2 text-gray-700">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-show="showUserMenu"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              >
                <RouterLink
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="showUserMenu = false"
                >
                  Your Profile
                </RouterLink>
                <button
                  @click="logout"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const selectedCorporationId = ref('')

const userInitials = computed(() => {
  if (!authStore.user) return ''
  return `${authStore.user.firstName[0]}${authStore.user.lastName[0]}`.toUpperCase()
})

const switchCorporation = () => {
  if (selectedCorporationId.value) {
    authStore.switchCorporation(selectedCorporationId.value)
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
  showUserMenu = false
}

onMounted(() => {
  // Set initial corporation selection for advisers
  if (authStore.isAdviser && authStore.user?.corporationId) {
    selectedCorporationId.value = authStore.user.corporationId
  }
})

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserMenu.value = false
  }
})
</script>
