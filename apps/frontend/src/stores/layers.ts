import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Layer, CreateLayerRequest } from '@/types'
import { api } from '@/utils/api'

export const useLayersStore = defineStore('layers', () => {
  const layers = ref<Layer[]>([])
  const currentLayer = ref<Layer | null>(null)
  const isLoading = ref(false)

  const fetchLayers = async (mapId: string) => {
    isLoading.value = true
    try {
      const response = await api.get(`/maps/${mapId}/layers`)
      layers.value = response.data
    } catch (error) {
      console.error('Failed to fetch layers:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchLayer = async (id: string) => {
    isLoading.value = true
    try {
      const response = await api.get(`/layers/${id}`)
      currentLayer.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch layer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addLayer = async (mapId: string, layerData: CreateLayerRequest) => {
    isLoading.value = true
    try {
      const response = await api.post(`/maps/${mapId}/layers`, layerData)
      const newLayer = response.data
      layers.value.push(newLayer)
      return newLayer
    } catch (error) {
      console.error('Failed to add layer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateLayer = async (mapId: string, id: string, layerData: Partial<CreateLayerRequest>) => {
    isLoading.value = true
    try {
  const response = await api.patch(`/maps/${mapId}/layers/update/${id}`, layerData)
      const updatedLayer = response.data
      
      const index = layers.value.findIndex(l => l.id === id)
      if (index !== -1) {
        layers.value[index] = updatedLayer
      }
      
      if (currentLayer.value?.id === id) {
        currentLayer.value = updatedLayer
      }
      
      return updatedLayer
    } catch (error) {
      console.error('Failed to update layer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const removeLayer = async (mapId: string, id: string) => {
    isLoading.value = true
    try {
      await api.delete(`/maps/${mapId}/layers/${id}`)
      layers.value = layers.value.filter(l => l.id !== id)
      
      if (currentLayer.value?.id === id) {
        currentLayer.value = null
      }
    } catch (error) {
      console.error('Failed to remove layer:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const toggleLayerVisibility = async (mapId: string, id: string) => {
    isLoading.value = true
    try {
      const response = await api.patch(`/maps/${mapId}/layers/${id}/toggle-visibility`)
      const updatedLayer = response.data
      
      const index = layers.value.findIndex(l => l.id === id)
      if (index !== -1) {
        layers.value[index] = updatedLayer
      }
      
      if (currentLayer.value?.id === id) {
        currentLayer.value = updatedLayer
      }
      
      return updatedLayer
    } catch (error) {
      console.error('Failed to toggle layer visibility:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // reorderLayers removed - ordering is handled by Map.rootOrder and LayerGroup.layerOrder

  const setCurrentLayer = (layer: Layer | null) => {
    currentLayer.value = layer
  }

  const clearLayers = () => {
    layers.value = []
    currentLayer.value = null
  }

  return {
    layers,
    currentLayer,
    isLoading,
    fetchLayers,
    fetchLayer,
    addLayer,
    updateLayer,
    removeLayer,
    toggleLayerVisibility,
    
    setCurrentLayer,
    clearLayers
  }
})
