import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'

export interface LayerGroupDTO {
  id: string
  mapId: string
  name: string
  order: number
  isCollapsed: boolean
  isVisible: boolean
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
    // maintain ascending order by order property
    groups.value.sort((a, b) => a.order - b.order)
    return res.data as LayerGroupDTO
  }

  const updateGroup = async (mapId: string, id: string, patch: Partial<LayerGroupDTO>) => {
    const res = await api.patch(`/maps/${mapId}/layer-groups/${id}`, patch)
    const idx = groups.value.findIndex(g => g.id === id)
    if (idx !== -1) groups.value[idx] = res.data
    groups.value.sort((a, b) => a.order - b.order)
    return res.data as LayerGroupDTO
  }

  const deleteGroup = async (mapId: string, id: string) => {
    await api.delete(`/maps/${mapId}/layer-groups/${id}`)
    groups.value = groups.value.filter(g => g.id !== id)
  }

  const setGrouping = async (mapId: string, items: LayerGroupingItem[]) => {
    await api.patch(`/maps/${mapId}/layers/grouping`, { items })
  }

  const clear = () => {
    groups.value = []
  }

  return { groups, isLoading, fetchGroups, createGroup, updateGroup, deleteGroup, setGrouping, clear }
})
