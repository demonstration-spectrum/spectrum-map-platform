import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
          break
        case 403:
          toast.error(data.message || 'Access denied')
          break
        case 404:
          toast.error(data.message || 'Resource not found')
          break
        case 422:
          // Validation errors
          if (data.message) {
            toast.error(data.message)
          } else if (data.errors) {
            Object.values(data.errors).forEach((error: any) => {
              toast.error(error[0])
            })
          }
          break
        case 500:
          toast.error('Internal server error')
          break
        default:
          toast.error(data.message || 'An error occurred')
      }
    } else if (error.request) {
      toast.error('Network error - please check your connection')
    } else {
      toast.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)
