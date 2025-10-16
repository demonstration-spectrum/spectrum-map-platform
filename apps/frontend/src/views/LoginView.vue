<template>
  <PublicLayout>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <RouterLink to="/register" class="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </RouterLink>
          </p>
        </div>
        
        <form class="mt-8 space-y-6" @submit.prevent>
          <div class="rounded-md shadow-sm -space-y-px">
            <div v-if="step === 1">
              <label for="email" class="sr-only">Email address</label>
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div v-if="step === 2">
              <label for="otp" class="sr-only">One-time password</label>
              <input
                id="otp"
                v-model="form.otp"
                name="otp"
                type="text"
                autocomplete="one-time-code"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter the OTP sent to your email"
              />
            </div>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <div>
            <button
              v-if="step === 1"
              type="button"
              @click="handleRequestOtp"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isLoading ? 'Requesting...' : 'Request OTP' }}
            </button>

            <button
              v-else
              type="button"
              @click="handleVerifyOtp"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isLoading ? 'Verifying...' : 'Verify OTP' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import PublicLayout from '@/components/layout/PublicLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  otp: '',
  session: ''
})

const isLoading = ref(false)
const error = ref('')

const step = ref(1)

const handleRequestOtp = async () => {
  if (!form.value.email) {
    error.value = 'Please provide an email address'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const resp = await authStore.requestOtp(form.value.email)
    form.value.session = resp.session || ''
    step.value = 2
    toast.success('OTP sent to your email')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to request OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleVerifyOtp = async () => {
  if (!form.value.email || !form.value.otp) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await authStore.login({ email: form.value.email, otp: form.value.otp, session: form.value.session })
    toast.success('Welcome back!')
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Verification failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
