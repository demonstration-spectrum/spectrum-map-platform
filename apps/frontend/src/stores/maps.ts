import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Map, CreateMapRequest } from '@/types'
import { api } from '@/utils/api'

export const useMapsStore = defineStore('maps', () => {
  const maps = ref<Map[]>([])
  const currentMap = ref<Map | null>(null)
  const isLoading = ref(false)

  const fetchMaps = async (filters?: { visibility?: string; search?: string; corporationId?: string }) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (filters?.visibility) params.append('visibility', filters.visibility)
      if (filters?.search) params.append('search', filters.search)
      
  if (filters?.corporationId) params.append('corporationId', filters.corporationId)
  const qs = params.toString()
  const url = qs ? `/maps?${qs}` : '/maps'
  const response = await api.get(url)
      maps.value = response.data
    } catch (error) {
      console.error('Failed to fetch maps:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchPublicMaps = async (search?: string) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await api.get(`/maps/public?${params.toString()}`)
      maps.value = response.data
    } catch (error) {
      console.error('Failed to fetch public maps:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchMap = async (id: string, password?: string) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (password) params.append('password', password)
      
      const response = await api.get(`/maps/${id}?${params.toString()}`)
      currentMap.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch map:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createMap = async (mapData: CreateMapRequest) => {
    isLoading.value = true
    try {
      const response = await api.post('/maps', mapData)
      const newMap = response.data
      maps.value.unshift(newMap)
      return newMap
    } catch (error) {
      console.error('Failed to create map:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateMap = async (id: string, mapData: Partial<CreateMapRequest>) => {
    isLoading.value = true
    try {
      const response = await api.patch(`/maps/${id}`, mapData)
      const updatedMap = response.data
      
      const index = maps.value.findIndex(m => m.id === id)
      if (index !== -1) {
        maps.value[index] = updatedMap
      }
      
      if (currentMap.value?.id === id) {
        currentMap.value = updatedMap
      }
      
      return updatedMap
    } catch (error) {
      console.error('Failed to update map:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateMapStructure = async (mapId: string, structure: { rootOrder: string[]; groupOrders: { groupId: string; layerIds: string[] }[]; layerGroupIdMap: Record<string, string | null> }) => {
    isLoading.value = true
    try {
      await api.patch(`/maps/${mapId}/structure`, structure)
    } catch (error) {
      console.error('Failed to update map structure:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteMap = async (id: string) => {
    isLoading.value = true
    try {
      await api.delete(`/maps/${id}`)
      maps.value = maps.value.filter(m => m.id !== id)
      
      if (currentMap.value?.id === id) {
        currentMap.value = null
      }
    } catch (error) {
      console.error('Failed to delete map:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentMap = (map: Map | null) => {
    currentMap.value = map
  }

  return {
    maps,
    currentMap,
    isLoading,
    fetchMaps,
    fetchPublicMaps,
    fetchMap,
    createMap,
    updateMap,
    deleteMap,
    setCurrentMap,
    updateMapStructure
  }
})
