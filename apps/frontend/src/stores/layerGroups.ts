import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'
import { useLayersStore } from './layers'

export interface LayerGroupDTO {
  id: string
  mapId: string
  name: string
  isCollapsed: boolean
  isVisible: boolean
  // Optional explicit layer ordering on the group (top-first in UI). Newer schema stores this on the group.
  layerOrder?: string[]
}

export interface LayerGroupingItem {
  layerId: string
  groupId?: string | null
  order: number
}

export const useLayerGroupsStore = defineStore('layerGroups', () => {
  const groups = ref<LayerGroupDTO[]>([])
  const isLoading = ref(false)

  const fetchGroups = async (mapId: string) => {
    isLoading.value = true
    try {
      const res = await api.get(`/maps/${mapId}/layer-groups`)
      groups.value = res.data
    } finally {
      isLoading.value = false
    }
  }

  const createGroup = async (mapId: string, name: string) => {
    const res = await api.post(`/maps/${mapId}/layer-groups`, { name })
    groups.value.push(res.data)
    return res.data as LayerGroupDTO
  }

  const updateGroup = async (mapId: string, id: string, patch: Partial<LayerGroupDTO>) => {
    const res = await api.patch(`/maps/${mapId}/layer-groups/${id}`, patch)
    const idx = groups.value.findIndex(g => g.id === id)
    if (idx !== -1) groups.value[idx] = res.data
    return res.data as LayerGroupDTO
  }

  const deleteGroup = async (mapId: string, id: string) => {
    await api.delete(`/maps/${mapId}/layer-groups/${id}`)
    groups.value = groups.value.filter(g => g.id !== id)
  }

  // Persist grouping + ordering. The frontend builds a flattened items[] (layerId, groupId?, order)
  // Grouping persistence moved to maps API; UI-level reconciliation continues via stores

  const clear = () => {
    groups.value = []
  }

  return { groups, isLoading, fetchGroups, createGroup, updateGroup, deleteGroup, clear }
})
