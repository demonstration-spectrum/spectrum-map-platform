import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Corporation, CorporationStatus } from '@/types'
import { api } from '@/utils/api'

export const useCorporationsStore = defineStore('corporations', () => {
  const corporations = ref<Corporation[]>([])
  const currentCorporation = ref<Corporation | null>(null)
  const isLoading = ref(false)

  const fetchAll = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/corporations')
      corporations.value = response.data
    } catch (error) {
      console.error('Failed to fetch corporations:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllAdmin = async (includeDeleted = false) => {
    isLoading.value = true
    try {
      const url = includeDeleted ? '/corporations?includeDeleted=true' : '/corporations'
      const response = await api.get(url)
      corporations.value = response.data
    } catch (error) {
      console.error('Failed to fetch corporations (admin):', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchOne = async (id: string) => {
    isLoading.value = true
    try {
      const response = await api.get(`/corporations/${id}`)
      currentCorporation.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch corporation:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const create = async (corporationData: { name: string; description?: string }) => {
    isLoading.value = true
    try {
      const response = await api.post('/corporations', corporationData)
      const newCorporation = response.data
      corporations.value.unshift(newCorporation)
      return newCorporation
    } catch (error) {
      console.error('Failed to create corporation:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const update = async (id: string, corporationData: { name?: string; description?: string; status?: CorporationStatus }) => {
    isLoading.value = true
    try {
      const response = await api.patch(`/corporations/${id}`, corporationData)
      const updatedCorporation = response.data
      
      const index = corporations.value.findIndex(c => c.id === id)
      if (index !== -1) {
        corporations.value[index] = updatedCorporation
      }
      
      if (currentCorporation.value?.id === id) {
        currentCorporation.value = updatedCorporation
      }
      
      return updatedCorporation
    } catch (error) {
      console.error('Failed to update corporation:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const remove = async (id: string) => {
    isLoading.value = true
    try {
      await api.delete(`/corporations/${id}`)
      corporations.value = corporations.value.filter(c => c.id !== id)
      
      if (currentCorporation.value?.id === id) {
        currentCorporation.value = null
      }
    } catch (error) {
      console.error('Failed to delete corporation:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const grantAdviserAccess = async (corporationId: string, adviserId: string) => {
    isLoading.value = true
    try {
      const response = await api.post(`/corporations/${corporationId}/advisers/${adviserId}`)
      return response.data
    } catch (error) {
      console.error('Failed to grant adviser access:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const revokeAdviserAccess = async (corporationId: string, adviserId: string) => {
    isLoading.value = true
    try {
      const response = await api.delete(`/corporations/${corporationId}/advisers/${adviserId}`)
      return response.data
    } catch (error) {
      console.error('Failed to revoke adviser access:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentCorporation = (corporation: Corporation | null) => {
    currentCorporation.value = corporation
  }

  return {
    corporations,
    currentCorporation,
    isLoading,
  fetchAll,
  fetchAllAdmin,
    fetchOne,
    create,
    update,
    remove,
    grantAdviserAccess,
    revokeAdviserAccess,
    setCurrentCorporation
  }
})
