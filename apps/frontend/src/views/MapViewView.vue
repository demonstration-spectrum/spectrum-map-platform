<template>
  <div class="h-screen flex flex-col">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 font-medium">Loading map...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="!map" class="flex-1 flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="mt-4 text-lg font-semibold text-gray-900">Map not found</h3>
        <p class="mt-2 text-sm text-gray-500">The map you're looking for doesn't exist or you don't have access to it.</p>
        <div class="mt-6">
          <RouterLink to="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Go back home
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Map Viewer -->
    <div v-else class="flex-1 relative">
      <!-- Map Container -->
      <div ref="mapContainer" class="w-full h-full"></div>

      <!-- Floating Sidebar -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 -translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-full"
      >
        <div v-if="showSidebar" class="absolute top-4 left-4 bottom-4 w-80 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl overflow-hidden flex flex-col z-10">
          <!-- Sidebar Header -->
          <div class="px-5 py-4 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 pr-2">
                <h2 class="text-lg font-bold text-gray-900 truncate">{{ map.name }}</h2>
                <p v-if="map.description" class="text-xs text-gray-600 mt-1 line-clamp-2">{{ map.description }}</p>
              </div>
              <button
                @click="showSidebar = false"
                class="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Hide sidebar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Layers Section -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Layers</h3>
            
            <!-- No Layers State -->
            <div v-if="organizedItems.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p class="mt-3 text-sm text-gray-500">No layers in this map</p>
            </div>

            <!-- Layer Tree -->
            <div v-else class="space-y-2">
              <div v-for="item in organizedItems" :key="item.type + '-' + item.id" class="group">
                <!-- Layer Group -->
                <div v-if="item.type === 'group'" class="rounded-lg border border-gray-200 overflow-hidden">
                  <div class="flex items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" @click="toggleGroupCollapse(item.id)">
                    <button class="mr-2 text-gray-500 hover:text-gray-700">
                      <svg v-if="!item.isCollapsed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button @click.stop="toggleGroupVisibility(item)" class="mr-2 text-gray-400 hover:text-gray-600">
                      <svg v-if="item.isVisible" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    </button>
                    <span class="flex-1 text-sm font-semibold text-gray-800 truncate">{{ item.name }}</span>
                    <span class="ml-2 text-xs text-gray-500">{{ item.children.length }}</span>
                  </div>
                  
                  <!-- Group Children -->
                  <div v-if="!item.isCollapsed" class="bg-white divide-y divide-gray-100">
                    <div v-for="layer in item.children" :key="layer.id" class="px-3 py-2.5 hover:bg-gray-50 transition-colors">
                      <div class="flex items-start">
                        <button @click="toggleLayerVisibility(layer)" class="mr-2 mt-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                          <svg v-if="layer.isVisible" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                          </svg>
                          <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        </button>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-800 truncate">{{ layer.name }}</p>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ layer.dataset.name }}</p>
                          <!-- Legend -->
                          <div v-if="getLegendInfo(layer)" class="mt-2 flex items-center space-x-2">
                            <component :is="getLegendInfo(layer)!.component" :color="getLegendInfo(layer)!.color" />
                            <span v-if="getLegendInfo(layer)!.label" class="text-xs text-gray-500">{{ getLegendInfo(layer)!.label }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Ungrouped Layer -->
                <div v-else class="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="flex items-start">
                    <button @click="toggleLayerVisibility(item)" class="mr-2 mt-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <svg v-if="item.isVisible" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    </button>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 truncate">{{ item.name }}</p>
                      <p class="text-xs text-gray-500 truncate mt-0.5">{{ item.dataset.name }}</p>
                      <!-- Legend -->
                      <div v-if="getLegendInfo(item)" class="mt-2 flex items-center space-x-2">
                        <component :is="getLegendInfo(item)!.component" :color="getLegendInfo(item)!.color" />
                        <span v-if="getLegendInfo(item)!.label" class="text-xs text-gray-500">{{ getLegendInfo(item)!.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Footer -->
          <div class="px-5 py-3 border-t border-gray-200 bg-gray-50/50">
            <div class="flex items-center justify-between text-xs text-gray-600">
              <span class="truncate">{{ map.corporation.name }}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getVisibilityBadgeClass(map.visibility)">
                {{ map.visibility }}
              </span>
            </div>
          </div>
        </div>
      </transition>

      <!-- Toggle Sidebar Button -->
      <button
        v-if="!showSidebar"
        @click="showSidebar = true"
        class="absolute top-4 left-4 z-10 p-3 bg-white shadow-lg rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        title="Show layers"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, h } from 'vue'
import { useRoute } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { toggleLayerVisibility as toggleMapLayerVisibility } from '@/utils/mapbox'
import { useMap } from '@/components/map/useMap'
import type { Map, Layer, LayerGroup, MapVisibility } from '@/types'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

// Route and stores
const route = useRoute()
const mapsStore = useMapsStore()

// Refs
const mapContainer = ref<HTMLElement>()
const map = ref<Map | null>(null)
const layers = ref<Layer[]>([])
const layerGroups = ref<LayerGroup[]>([])
const showSidebar = ref(true)
const isLoading = ref(false)

// Map composable
const { mapboxMap, initializeMap } = useMap(mapContainer, map, layers)

// Helper to parse color from style
const parseColor = (colorValue: any): string | null => {
  if (typeof colorValue === 'string') {
    // Simple hex or named color
    if (colorValue.startsWith('#') || ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'].includes(colorValue.toLowerCase())) {
      return colorValue
    }
  }
  return null
}

// Legend components
const LegendSquare = (props: { color: string }) => h('div', {
  class: 'w-4 h-4 rounded border border-gray-300',
  style: { backgroundColor: props.color }
})

const LegendLine = (props: { color: string }) => h('div', {
  class: 'w-6 h-0.5',
  style: { backgroundColor: props.color }
})

const LegendCircle = (props: { color: string }) => h('div', {
  class: 'w-4 h-4 rounded-full border border-gray-300',
  style: { backgroundColor: props.color }
})

// Get legend info for a layer
const getLegendInfo = (layer: Layer): { component: any; color: string; label?: string } | null => {
  if (!layer.style || typeof layer.style !== 'object') return null
  
  const style = layer.style as any
  const paint = style.paint || {}
  
  // Check for fill color
  if (paint['fill-color']) {
    const color = parseColor(paint['fill-color'])
    if (color) return { component: LegendSquare, color }
  }
  
  // Check for line color
  if (paint['line-color']) {
    const color = parseColor(paint['line-color'])
    if (color) return { component: LegendLine, color }
  }
  
  // Check for circle color
  if (paint['circle-color']) {
    const color = parseColor(paint['circle-color'])
    if (color) return { component: LegendCircle, color }
  }
  
  // Check for generic color property
  if (paint.color) {
    const color = parseColor(paint.color)
    if (color) return { component: LegendSquare, color }
  }
  
  // Check if it's a data-driven style (array or expression)
  if (Array.isArray(paint['fill-color']) || Array.isArray(paint['line-color']) || Array.isArray(paint['circle-color'])) {
    return { component: () => h('span', { class: 'text-xs italic text-gray-400' }, 'Data Driven'), color: '', label: '' }
  }
  
  return null
}

// Organize layers into groups and ungrouped items
interface TreeItem {
  type: 'layer' | 'group'
  id: string
  name: string
  isVisible: boolean
  isCollapsed?: boolean
  children?: Layer[]
  dataset?: any
  style?: any
  groupId?: string | null
}

const organizedItems = computed<TreeItem[]>(() => {
  const items: TreeItem[] = []
  const rootOrder = (map.value as any)?.rootOrder || []
  
  // Create a map of groups
  const groupsMap = new Map<string, LayerGroup>()
  layerGroups.value.forEach(g => groupsMap.set(g.id, g))
  
  // Create a map of layers
  const layersMap = new Map<string, Layer>()
  layers.value.forEach(l => layersMap.set(l.id, l))
  
  // Process rootOrder
  if (rootOrder.length > 0) {
    rootOrder.forEach((itemId: string) => {
      const group = groupsMap.get(itemId)
      if (group) {
        // It's a group
        const groupLayers: Layer[] = []
        const groupLayerOrder = group.layerOrder || []
        
        // Add layers in order
        groupLayerOrder.forEach(layerId => {
          const layer = layersMap.get(layerId)
          if (layer) groupLayers.push(layer)
        })
        
        items.push({
          type: 'group',
          id: group.id,
          name: group.name,
          isVisible: group.isVisible,
          isCollapsed: group.isCollapsed,
          children: groupLayers
        })
      } else {
        // It's a layer
        const layer = layersMap.get(itemId)
        if (layer) {
          items.push({
            type: 'layer',
            id: layer.id,
            name: layer.name,
            isVisible: layer.isVisible,
            dataset: layer.dataset,
            style: layer.style,
            groupId: layer.groupId
          })
        }
      }
    })
  } else {
    // Fallback: No rootOrder, organize by groups and ungrouped
    // Add groups first
    layerGroups.value.forEach(group => {
      const groupLayers = layers.value.filter(l => l.groupId === group.id)
      items.push({
        type: 'group',
        id: group.id,
        name: group.name,
        isVisible: group.isVisible,
        isCollapsed: group.isCollapsed,
        children: groupLayers
      })
    })
    
    // Add ungrouped layers
    layers.value.filter(l => !l.groupId).forEach(layer => {
      items.push({
        type: 'layer',
        id: layer.id,
        name: layer.name,
        isVisible: layer.isVisible,
        dataset: layer.dataset,
        style: layer.style,
        groupId: layer.groupId
      })
    })
  }
  
  // Reverse for top-to-bottom display (Mapbox renders bottom-to-top)
  return items.reverse()
})

// Toggle group collapse
const toggleGroupCollapse = (groupId: string) => {
  const group = layerGroups.value.find(g => g.id === groupId)
  if (group) {
    group.isCollapsed = !group.isCollapsed
  }
}

// Toggle group visibility
const toggleGroupVisibility = (groupItem: TreeItem) => {
  const group = layerGroups.value.find(g => g.id === groupItem.id)
  if (group && mapboxMap.value) {
    group.isVisible = !group.isVisible
    
    // Toggle all child layers
    groupItem.children?.forEach(layer => {
      toggleMapLayerVisibility(mapboxMap.value!, `layer-${layer.id}`, group.isVisible)
      layer.isVisible = group.isVisible
    })
  }
}

// Toggle layer visibility
const toggleLayerVisibility = (layer: Layer) => {
  if (mapboxMap.value) {
    layer.isVisible = !layer.isVisible
    toggleMapLayerVisibility(mapboxMap.value, `layer-${layer.id}`, layer.isVisible)
  }
}

// Visibility badge classes
const getVisibilityBadgeClass = (visibility: MapVisibility) => {
  switch (visibility) {
    case 'PUBLIC':
      return 'bg-green-100 text-green-700'
    case 'PASSWORD_PROTECTED':
      return 'bg-yellow-100 text-yellow-700'
    case 'PRIVATE':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// Load map data
const loadMap = async () => {
  console.log(mapContainer, mapContainer.value);
  isLoading.value = true
  try {
    const mapId = route.params.id as string
    const password = route.query.password as string
    
    const mapData = await mapsStore.fetchMap(mapId, password)
    map.value = mapData
    

  } catch (error) {
    console.error('Failed to load map:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadMap();
  if (map.value) {
    layers.value = map.value.layers || []
    layerGroups.value = map.value.layerGroups || []
    
    await nextTick()
    
    if (mapContainer.value) {
      const mapInstance = initializeMap(mapContainer.value, {
        center: map.value.centerLng && map.value.centerLat ? [map.value.centerLng, map.value.centerLat] : [0, 0],
        zoom: map.value.zoom || 2,
        bearing: map.value.bearing || 0,
        pitch: map.value.pitch || 0
      })
      
      // Add geocoder after map is initialized
      if (mapInstance) {
        mapInstance.on('load', () => {
          // Set access token before creating geocoder
          mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''
          
          const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl as any,
            marker: true,
            placeholder: 'Search for places...',
            proximity: {
              longitude: map.value?.centerLng || 0,
              latitude: map.value?.centerLat || 0
            } as any
          })
          
          mapInstance.addControl(geocoder, 'top-right')
        })
      }
    } else {
      console.error('Map container not found');
    }
  }  
})

onUnmounted(() => {
  if (mapboxMap.value) {
    mapboxMap.value.remove()
  }
})
</script>

<style scoped>
/* Custom scrollbar for sidebar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
