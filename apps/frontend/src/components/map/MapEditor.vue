<template>
  <div class="h-full flex">
    <!-- Sidebar -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-medium text-gray-900">{{ map?.name || 'Map Editor' }}</h2>
        <p v-if="map?.description" class="text-sm text-gray-500 mt-1">{{ map.description }}</p>
      </div>

      <!-- Layer Panel -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-medium text-gray-900">Layers</h3>
            <button
              @click="showAddLayerModal = true"
              class="btn-primary text-sm"
            >
              Add Layer
            </button>
          </div>

          <!-- Layer List -->
          <div class="space-y-2">
            <div
              v-for="layer in layers"
              :key="layer.id"
              class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-200': currentLayer?.id === layer.id }"
            >
              <button
                @click="toggleLayerVisibility(layer)"
                class="mr-3 text-gray-400 hover:text-gray-600"
              >
                <svg v-if="layer.isVisible" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
              
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ layer.name }}</p>
                <p class="text-xs text-gray-500">{{ layer.dataset.name }}</p>
              </div>

              <div class="flex items-center space-x-1">
                <button
                  @click="selectLayer(layer)"
                  class="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="removeLayer(layer)"
                  class="p-1 text-gray-400 hover:text-red-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="layers.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No layers</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding a layer to your map.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="flex-1 relative">
      <div ref="mapContainer" class="w-full h-full"></div>
      
      <!-- Map Controls -->
      <div class="absolute top-4 right-4 space-y-2">
        <button
          @click="saveMap"
          :disabled="isSaving"
          class="btn-primary"
        >
          {{ isSaving ? 'Saving...' : 'Save Map' }}
        </button>
      </div>
    </div>

    <!-- Add Layer Modal -->
    <div v-if="showAddLayerModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Add Layer</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Dataset</label>
            <select v-model="selectedDatasetId" class="input">
              <option value="">Select a dataset</option>
              <option
                v-for="dataset in availableDatasets"
                :key="dataset.id"
                :value="dataset.id"
              >
                {{ dataset.name }}
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Layer Name</label>
            <input
              v-model="newLayerName"
              type="text"
              class="input"
              placeholder="Enter layer name"
            />
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="showAddLayerModal = false"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              @click="addLayer"
              :disabled="!selectedDatasetId || !newLayerName"
              class="btn-primary"
            >
              Add Layer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { useLayersStore } from '@/stores/layers'
import { useDatasetsStore } from '@/stores/datasets'
import { createMap, addLayerToMap, removeLayerFromMap, toggleLayerVisibility as toggleMapLayerVisibility } from '@/utils/mapbox'
import type { Map, Layer, Dataset } from '@/types'
import mapboxgl from 'mapbox-gl'

const route = useRoute()
const mapsStore = useMapsStore()
const layersStore = useLayersStore()
const datasetsStore = useDatasetsStore()

const mapContainer = ref<HTMLElement>()
const map = ref<Map | null>(null)
const layers = ref<Layer[]>([])
const currentLayer = ref<Layer | null>(null)
const availableDatasets = ref<Dataset[]>([])
const mapboxMap = ref<mapboxgl.Map | null>(null)

const showAddLayerModal = ref(false)
const selectedDatasetId = ref('')
const newLayerName = ref('')
const isSaving = ref(false)

const loadMap = async () => {
  try {
    const mapData = await mapsStore.fetchMap(route.params.id as string)
    map.value = mapData
    await loadLayers()
  } catch (error) {
    console.error('Failed to load map:', error)
  }
}

const loadLayers = async () => {
  try {
    await layersStore.fetchLayers(route.params.id as string)
    layers.value = layersStore.layers
  } catch (error) {
    console.error('Failed to load layers:', error)
  }
}

const loadAvailableDatasets = async () => {
  try {
    await datasetsStore.fetchDataLibrary()
    availableDatasets.value = datasetsStore.dataLibrary
  } catch (error) {
    console.error('Failed to load datasets:', error)
  }
}

const initializeMap = () => {
  if (!mapContainer.value) return

  const center = map.value?.centerLng && map.value?.centerLat 
    ? [map.value.centerLng, map.value.centerLat] 
    : [0, 0]

  mapboxMap.value = createMap(mapContainer.value, {
    center,
    zoom: map.value?.zoom || 2,
    bearing: map.value?.bearing || 0,
    pitch: map.value?.pitch || 0
  })

  // Add layers to map
  
  layers.value.forEach(layer => {
    if (layer.dataset.workspaceName && layer.dataset.layerName) {
      //console.log('Adding layer to map:', layer)
      addLayerToMap(mapboxMap.value!, layer, import.meta.env.VITE_GEOSERVER_URL)
    }
  })
}

const selectLayer = (layer: Layer) => {
  currentLayer.value = layer
  // TODO: Show layer styling panel
}

const toggleLayerVisibility = async (layer: Layer) => {
  try {
    await layersStore.toggleLayerVisibility(layer.mapId, layer.id)
    const updatedLayer = layers.value.find(l => l.id === layer.id)
    if (updatedLayer && mapboxMap.value) {
      toggleMapLayerVisibility(mapboxMap.value, `layer-${layer.id}`, updatedLayer.isVisible)
    }
  } catch (error) {
    console.error('Failed to toggle layer visibility:', error)
  }
}

const removeLayer = async (layer: Layer) => {
  if (!confirm('Are you sure you want to remove this layer?')) return

  try {
    await layersStore.removeLayer(layer.mapId, layer.id)
    if (mapboxMap.value) {
      removeLayerFromMap(mapboxMap.value, `layer-${layer.id}`, `source-${layer.id}`)
    }
  } catch (error) {
    console.error('Failed to remove layer:', error)
  }
}

const addLayer = async () => {
  if (!selectedDatasetId.value || !newLayerName.value) return

  try {
    await layersStore.addLayer(route.params.id as string, {
      datasetId: selectedDatasetId.value,
      name: newLayerName.value
    })

    // Add to map
    const newLayer = layersStore.layers[layersStore.layers.length - 1]
    if (mapboxMap.value && newLayer.dataset.workspaceName && newLayer.dataset.layerName) {
      addLayerToMap(mapboxMap.value, newLayer, import.meta.env.VITE_GEOSERVER_URL)
    }

    showAddLayerModal.value = false
    selectedDatasetId.value = ''
    newLayerName.value = ''
  } catch (error) {
    console.error('Failed to add layer:', error)
  }
}

const saveMap = async () => {
  if (!mapboxMap.value || !map.value) return

  isSaving.value = true
  try {
    const center = mapboxMap.value.getCenter()
    const zoom = mapboxMap.value.getZoom()
    const bearing = mapboxMap.value.getBearing()
    const pitch = mapboxMap.value.getPitch()

    await mapsStore.updateMap(map.value.id, {
      centerLat: center.lat,
      centerLng: center.lng,
      zoom,
      bearing,
      pitch
    })
  } catch (error) {
    console.error('Failed to save map:', error)
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  await loadMap()
  await loadAvailableDatasets()
  initializeMap()
})

onUnmounted(() => {
  if (mapboxMap.value) {
    mapboxMap.value.remove()
  }
})

// Watch for layer changes
watch(() => layersStore.layers, (newLayers) => {
  layers.value = newLayers
}, { deep: true })
</script>
