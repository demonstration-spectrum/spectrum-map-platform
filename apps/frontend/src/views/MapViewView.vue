<template>
  <div class="h-screen">
    <!-- Public Map Viewer -->
    <div v-if="map" class="h-full flex flex-col">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-semibold text-gray-900">{{ map.name }}</h1>
            <p v-if="map.description" class="text-sm text-gray-600">{{ map.description }}</p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getVisibilityBadgeClass(map.visibility)">
              {{ map.visibility }}
            </span>
            <button
              @click="toggleLayerPanel"
              class="btn-secondary text-sm"
            >
              {{ showLayerPanel ? 'Hide' : 'Show' }} Layers
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex">
        <!-- Layer Panel -->
        <div v-if="showLayerPanel" class="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-4">Layers</h3>
            
            <div v-if="layers.length === 0" class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No layers</h3>
              <p class="mt-1 text-sm text-gray-500">This map doesn't have any layers yet.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="layer in layers"
                :key="layer.id"
                class="flex items-center p-3 border border-gray-200 rounded-lg"
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
              </div>
            </div>
          </div>
        </div>

        <!-- Map Container -->
        <div class="flex-1 relative">
          <div ref="mapContainer" class="w-full h-full"></div>
          
          <!-- Map Info -->
          <div class="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs text-gray-600">
            <p>Created by {{ map.createdBy.firstName }} {{ map.createdBy.lastName }}</p>
            <p>{{ map.corporation.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="h-screen flex items-center justify-center">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Map not found</h3>
        <p class="mt-1 text-sm text-gray-500">The map you're looking for doesn't exist or you don't have access to it.</p>
        <div class="mt-6">
          <RouterLink to="/" class="btn-primary">
            Go back home
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { useLayersStore } from '@/stores/layers'
import { createMap, addLayerToMap, removeLayerFromMap, toggleLayerVisibility as toggleMapLayerVisibility } from '@/utils/mapbox'
import type { Map, Layer, MapVisibility } from '@/types'
import mapboxgl from 'mapbox-gl'

const route = useRoute()
const mapsStore = useMapsStore()
const layersStore = useLayersStore()

const mapContainer = ref<HTMLElement>()
const map = ref<Map | null>(null)
const layers = ref<Layer[]>([])
const showLayerPanel = ref(true)
const isLoading = ref(false)
const mapboxMap = ref<mapboxgl.Map | null>(null)

const getVisibilityBadgeClass = (visibility: MapVisibility) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'bg-green-100 text-green-800'
    case 'PASSWORD_PROTECTED':
      return 'bg-yellow-100 text-yellow-800'
    case 'PRIVATE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const loadMap = async () => {
  isLoading.value = true
  try {
    const mapId = route.params.id as string
    const password = route.query.password as string
    
    if (password) {
      // Handle password-protected map
      const mapData = await mapsStore.getPasswordProtectedMap(mapId, password)
      map.value = mapData
    } else {
      // Handle public map or authenticated access
      const mapData = await mapsStore.fetchMap(mapId)
      map.value = mapData
    }
    
    if (map.value) {
      layers.value = map.value.layers || []
      await initializeMap()
    }
  } catch (error) {
    console.error('Failed to load map:', error)
  } finally {
    isLoading.value = false
  }
}

const initializeMap = async () => {
  if (!mapContainer.value || !map.value) return

  const center = map.value.centerLng && map.value.centerLat 
    ? [map.value.centerLng, map.value.centerLat] 
    : [0, 0]

  mapboxMap.value = createMap(mapContainer.value, {
    center,
    zoom: map.value.zoom || 2,
    bearing: map.value.bearing || 0,
    pitch: map.value.pitch || 0
  })

  // Add layers to map
  layers.value.forEach(layer => {
    if (layer.dataset.workspaceName && layer.dataset.layerName) {
      addLayerToMap(mapboxMap.value!, layer, import.meta.env.VITE_GEOSERVER_URL)
    }
  })
}

const toggleLayerPanel = () => {
  showLayerPanel.value = !showLayerPanel.value
}

const toggleLayerVisibility = (layer: Layer) => {
  if (mapboxMap.value) {
    toggleMapLayerVisibility(mapboxMap.value, `layer-${layer.id}`, !layer.isVisible)
  }
}

onMounted(async () => {
  await loadMap()
})

onUnmounted(() => {
  if (mapboxMap.value) {
    mapboxMap.value.remove()
  }
})
</script>
