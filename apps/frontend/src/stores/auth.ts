import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest, AuthResponse, RequestOtpResponse } from '@/types'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN')
  const isStaff = computed(() => user.value?.role === 'STAFF')
  const isCorpAdmin = computed(() => user.value?.role === 'CORP_ADMIN')
  const isEditor = computed(() => user.value?.role === 'EDITOR')
  const isAdviser = computed(() => user.value?.role === 'ADVISER')
  const isViewer = computed(() => user.value?.role === 'VIEWER')

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
  }

  const login = async (credentials: LoginRequest): Promise<void> => {
    isLoading.value = true
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      const { access_token, user: userData } = response.data
      
      token.value = access_token
      user.value = userData
      
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const requestOtp = async (email: string): Promise<RequestOtpResponse> => {
    isLoading.value = true
    try {
      const response = await api.post<RequestOtpResponse>('/auth/request-otp', { email })
      return response.data
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<void> => {
    isLoading.value = true
    try {
      await api.post('/auth/register', userData)
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    delete api.defaults.headers.common['Authorization']
  }

  const refreshProfile = async (): Promise<void> => {
    if (!isAuthenticated.value) return
    
    try {
      const response = await api.get('/auth/profile')
      user.value = response.data
      localStorage.setItem('auth_user', JSON.stringify(response.data))
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  const switchCorporation = (corporationId: string) => {
    if (user.value && user.value.adviserAccess) {
      const access = user.value.adviserAccess.find(a => a.corporationId === corporationId)
      if (access) {
        // Update the current corporation context
        user.value.corporationId = corporationId
        user.value.corporation = access.corporation
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isStaff,
    isCorpAdmin,
    isEditor,
    isAdviser,
  isViewer,
    initializeAuth,
    login,
    requestOtp,
    register,
    logout,
    refreshProfile,
    switchCorporation
  }
})
