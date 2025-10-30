import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Dataset, CreateDatasetRequest, ShareDatasetRequest } from '@/types'
import { api } from '@/utils/api'

export const useDatasetsStore = defineStore('datasets', () => {
  const datasets = ref<Dataset[]>([])
  const dataLibrary = ref<Dataset[]>([])
  const currentDataset = ref<Dataset | null>(null)
  const isLoading = ref(false)

  const fetchDatasets = async (filters?: { visibility?: string; search?: string; corporationId?: string }) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (filters?.visibility) params.append('visibility', filters.visibility)
      if (filters?.search) params.append('search', filters.search)
      
  if (filters?.corporationId) params.append('corporationId', filters.corporationId)
  const qs = params.toString()
  const url = qs ? `/datasets?${qs}` : '/datasets'
  const response = await api.get(url)
      datasets.value = response.data
    } catch (error) {
      console.error('Failed to fetch datasets:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchDataLibrary = async (filters?: { search?: string; ownership?: 'own' | 'shared' | 'public'; corporationId?: string }) => {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.ownership) params.append('ownership', filters.ownership)
      if (filters?.corporationId) params.append('corporationId', filters.corporationId)
      
      const response = await api.get(`/datasets/data-library?${params.toString()}`)
      dataLibrary.value = response.data
    } catch (error) {
      console.error('Failed to fetch data library:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchDataset = async (id: string) => {
    isLoading.value = true
    try {
      const response = await api.get(`/datasets/${id}`)
      currentDataset.value = response.data
      return response.data
    } catch (error) {
      console.error('Failed to fetch dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const uploadDataset = async (file: File | File[], datasetData: CreateDatasetRequest) => {
    isLoading.value = true
    try {
      const formData = new FormData()
      if (Array.isArray(file)) {
        for (const f of file) formData.append('files', f)
      } else {
        formData.append('files', file)
      }
      formData.append('name', datasetData.name)
      if (datasetData.description) formData.append('description', datasetData.description)
      formData.append('visibility', datasetData.visibility)
      if (datasetData.defaultStyle) {
        formData.append('defaultStyle', JSON.stringify(datasetData.defaultStyle))
      }
      if (datasetData.corporationId) {
        formData.append('corporationId', datasetData.corporationId)
      }
      
      const response = await api.post('/datasets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const newDataset = response.data
      datasets.value.unshift(newDataset)
      return newDataset
    } catch (error) {
      console.error('Failed to upload dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateDataset = async (id: string, datasetData: Partial<CreateDatasetRequest>) => {
    isLoading.value = true
    try {
      const response = await api.patch(`/datasets/${id}`, datasetData)
      const updatedDataset = response.data
      
      const index = datasets.value.findIndex(d => d.id === id)
      if (index !== -1) {
        datasets.value[index] = updatedDataset
      }
      
      if (currentDataset.value?.id === id) {
        currentDataset.value = updatedDataset
      }
      
      return updatedDataset
    } catch (error) {
      console.error('Failed to update dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteDataset = async (id: string) => {
    isLoading.value = true
    try {
      await api.delete(`/datasets/${id}`)
      datasets.value = datasets.value.filter(d => d.id !== id)
      dataLibrary.value = dataLibrary.value.filter(d => d.id !== id)
      
      if (currentDataset.value?.id === id) {
        currentDataset.value = null
      }
    } catch (error) {
      console.error('Failed to delete dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const shareDataset = async (id: string, shareData: ShareDatasetRequest) => {
    isLoading.value = true
    try {
      const response = await api.post(`/datasets/${id}/share`, shareData)
      return response.data
    } catch (error) {
      console.error('Failed to share dataset:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const pollDatasetStatus = async (id: string) => {
    try {
      const response = await api.get(`/datasets/${id}/status`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get status for dataset ${id}:`, error);
      throw error;
    }
  }

  const setCurrentDataset = (dataset: Dataset | null) => {
    currentDataset.value = dataset
  }

  return {
    datasets,
    dataLibrary,
    currentDataset,
    isLoading,
    fetchDatasets,
    fetchDataLibrary,
    fetchDataset,
    uploadDataset,
    updateDataset,
    deleteDataset,
    shareDataset,
    pollDatasetStatus,
    setCurrentDataset
  }
})
