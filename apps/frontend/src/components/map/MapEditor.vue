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

    <!-- Feature Info Panel -->
    <div v-if="selectedFeature" class="fixed left-4 bottom-4 z-50 w-80 bg-white border rounded-lg shadow-lg">
      <div class="p-3 border-b flex items-start justify-between">
        <div>
          <div class="text-sm font-medium">Feature</div>
          <div class="text-xs text-gray-500">{{ selectedFeature.geometry?.type || 'Unknown' }}</div>
        </div>
  <button @click="clearSelection" class="text-gray-400 hover:text-gray-600 ml-2">×</button>
      </div>
      <div class="p-3 max-h-64 overflow-y-auto text-xs">
        <div v-if="selectedFeature.properties && Object.keys(selectedFeature.properties).length">
          <div v-for="(val, key) in selectedFeature.properties" :key="key" class="mb-2">
            <div class="text-[11px] text-gray-600">{{ key }}</div>
            <div class="text-sm text-gray-900 truncate">{{ stringifyProperty(val) }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">No properties available</div>
      </div>
    </div>

    <!-- Style Editor Drawer -->
    <div v-if="currentLayer" class="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 z-40">
      <div class="p-4 border-b">
        <h3 class="text-lg font-medium">Style: {{ currentLayer.name }}</h3>
        <p class="text-sm text-gray-500">Dataset: {{ currentLayer.dataset?.name }}</p>
      </div>
      <div class="p-4 overflow-y-auto h-[calc(100%-64px)]">
        <div class="space-y-6">
          <!-- Paint Properties: show controls depending on layer type -->
          <section>
            <h4 class="text-sm font-semibold mb-2">Paint Properties</h4>

            <!-- Polygon / Fill layers -->
            <div v-if="layerType === 'fill'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
                <input type="color" v-model="currentLayer.style._simple.fillColor" class="w-16 h-8 p-0" />
                <input v-model="currentLayer.style._simple.fillColor" class="input mt-2" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fill Opacity</label>
                <input type="range" min="0" max="1" step="0.01" v-model.number="currentLayer.style._simple.fillOpacity" />
                <div class="text-xs text-gray-500 mt-1">{{ currentLayer.style._simple.fillOpacity }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Outline Color</label>
                <input type="color" v-model="currentLayer.style._simple.outlineColor" class="w-16 h-8 p-0" />
                <input v-model="currentLayer.style._simple.outlineColor" class="input mt-2" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Outline Width</label>
                <input type="range" min="0" max="50" step="0.5" v-model.number="currentLayer.style._simple.lineWidth" />
                <div class="text-xs text-gray-500 mt-1">{{ currentLayer.style._simple.lineWidth }}</div>
              </div>
            </div>

            <!-- Line layers -->
            <div v-else-if="layerType === 'line'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Line Color</label>
                <input type="color" v-model="currentLayer.style._simple.fillColor" class="w-16 h-8 p-0" />
                <input v-model="currentLayer.style._simple.fillColor" class="input mt-2" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Line Width</label>
                <input type="range" min="0" max="50" step="0.5" v-model.number="currentLayer.style._simple.lineWidth" />
                <div class="text-xs text-gray-500 mt-1">{{ currentLayer.style._simple.lineWidth }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dash / Pattern</label>
                <input v-model="currentLayer.style._simple.dashArray" class="input" placeholder="e.g. 2,4" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Translation / Offset (X, Y)</label>
                <div class="flex space-x-2">
                  <input type="number" step="1" v-model.number="currentLayer.style._simple.translateX" class="input" placeholder="X" />
                  <input type="number" step="1" v-model.number="currentLayer.style._simple.translateY" class="input" placeholder="Y" />
                </div>
              </div>
            </div>

            <!-- Point layers (circle/symbol) -->
            <div v-else-if="layerType === 'circle' || layerType === 'symbol'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Point Color</label>
                <input type="color" v-model="currentLayer.style._simple.circleColor" class="w-16 h-8 p-0" />
                <input v-model="currentLayer.style._simple.circleColor" class="input mt-2" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Radius</label>
                <input type="range" min="0" max="50" step="0.5" v-model.number="currentLayer.style._simple.circleRadius" />
                <div class="text-xs text-gray-500 mt-1">{{ currentLayer.style._simple.circleRadius }}</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Icon image (symbol)</label>
                <input v-model="currentLayer.style._simple.iconImage" class="input" placeholder="icon name" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Label text</label>
                <input v-model="currentLayer.style._simple.textField" class="input" placeholder="attribute name" />
              </div>
            </div>

            <!-- Fallback: show generic controls if no type matched -->
            <div v-else class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="color" v-model="currentLayer.style._simple.fillColor" class="w-16 h-8 p-0" />
                <input v-model="currentLayer.style._simple.fillColor" class="input mt-2" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
                <input type="range" min="0" max="1" step="0.01" v-model.number="currentLayer.style._simple.fillOpacity" />
                <div class="text-xs text-gray-500 mt-1">{{ currentLayer.style._simple.fillOpacity }}</div>
              </div>
            </div>
          </section>

          <!-- Layout Properties -->
          <section>
            <h4 class="text-sm font-semibold mb-2">Layout Properties</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Visibility</label>
                  <div class="text-xs text-gray-500">Toggle master visibility for this layer</div>
                </div>
                <input type="checkbox" v-model="currentLayer.isVisible" @change="onVisibilityToggle" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Text field (label)</label>
                <select v-model="currentLayer.style._simple.textField" class="input">
                  <option value="">-- none --</option>
                  <option v-for="attr in availableAttributes" :key="attr" :value="attr">{{ attr }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Text size</label>
                  <input type="number" v-model.number="currentLayer.style._simple.textSize" class="input" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Icon image</label>
                  <input v-model="currentLayer.style._simple.iconImage" class="input" placeholder="icon name" />
                </div>
              </div>
            </div>
          </section>

          <!-- Data-driven Styling -->
          <section>
            <h4 class="text-sm font-semibold mb-2">Data-driven Styling</h4>
            <div class="space-y-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bind property</label>
                <select v-model="dataDriven.property" class="input">
                  <option value="">-- select property --</option>
                  <option v-for="attr in availableAttributes" :key="attr" :value="attr">{{ attr }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Styling type</label>
                <select v-model="dataDriven.type" class="input">
                  <option value="categorical">Categorical</option>
                  <option value="interval">Interval (Steps)</option>
                  <option value="continuous">Continuous (Interpolate)</option>
                </select>
              </div>

              <div v-if="dataDriven.type === 'categorical'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Categories (value → color)</label>
                <div v-for="(cat, idx) in dataDriven.categorical" :key="idx" class="flex items-center space-x-2 mb-2">
                  <input v-model="cat.value" class="input" placeholder="value" />
                  <input type="color" v-model="cat.color" />
                  <button class="btn-secondary" @click.prevent="dataDriven.categorical.splice(idx,1)">Remove</button>
                </div>
                <div class="flex space-x-2">
                  <button class="btn-secondary" @click.prevent="dataDriven.categorical.push({ value: '', color: '#ff0000' })">Add</button>
                </div>
              </div>

              <div v-if="dataDriven.type === 'interval' || dataDriven.type === 'continuous'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Stops (input → output)</label>
                <div v-for="(stop, idx) in dataDriven.stops" :key="idx" class="flex items-center space-x-2 mb-2">
                  <input type="number" v-model.number="stop.input" class="input" placeholder="input" />
                  <input v-model="stop.output" class="input" placeholder="output (e.g., #color or size)" />
                  <button class="btn-secondary" @click.prevent="dataDriven.stops.splice(idx,1)">Remove</button>
                </div>
                <div class="flex space-x-2">
                  <button class="btn-secondary" @click.prevent="dataDriven.stops.push({ input: 0, output: '#ff0000' })">Add Stop</button>
                </div>
                <div class="mt-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Interpolation</label>
                  <select v-model="dataDriven.interpolation" class="input">
                    <option value="linear">Linear</option>
                    <option value="exponential">Exponential</option>
                    <option value="cubic-bezier">Cubic-bezier</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Feature Info Box Formatter -->
          <section>
            <h4 class="text-sm font-semibold mb-2">Feature Info Box</h4>
            <div class="space-y-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Attributes to include</label>
                <div class="space-y-2">
                  <div class="max-h-32 overflow-y-auto border p-2 rounded">
                    <div v-for="attr in availableAttributes" :key="attr" class="flex items-center justify-between mb-1">
                      <div class="flex items-center space-x-2">
                        <input type="checkbox" :value="attr" v-model="infoBox.selected" />
                        <div class="text-sm">{{ attr }}</div>
                      </div>
                      <input v-if="infoBox.selected.includes(attr)" v-model="infoBox.aliases[attr]" class="input w-32" placeholder="Alias" />
                    </div>
                  </div>

                  <div v-if="infoBox.selected.length" class="mt-2">
                    <div class="text-xs text-gray-500 mb-1">Selected fields (order matters):</div>
                    <div class="space-y-1 max-h-40 overflow-y-auto border p-2 rounded">
                      <div v-for="(f, idx) in infoBox.selected" :key="f" class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                          <div class="text-sm">{{ f }}</div>
                          <input v-model="infoBox.aliases[f]" class="input w-36" placeholder="Alias" />
                        </div>
                        <div class="flex items-center space-x-1">
                          <button class="p-1 text-xs" @click.prevent="moveInfoFieldUp(idx)" :disabled="idx===0">↑</button>
                          <button class="p-1 text-xs" @click.prevent="moveInfoFieldDown(idx)" :disabled="idx===infoBox.selected.length-1">↓</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title field</label>
                <select v-model="infoBox.titleField" class="input">
                  <option value="">-- none --</option>
                  <option v-for="attr in availableAttributes" :key="attr" :value="attr">{{ attr }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Template Editor (advanced)</label>
                <textarea v-model="infoBox.template" class="input h-28" placeholder="Use {{attribute}} placeholders"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Background</label>
                  <input type="color" v-model="infoBox.background" class="w-16 h-8 p-0" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Typography size</label>
                  <input type="number" v-model.number="infoBox.fontSize" class="input" />
                </div>
              </div>
            </div>
          </section>

          <!-- Advanced: Filter & JSON -->
          <section>
            <h4 class="text-sm font-semibold mb-2">Advanced</h4>
            <div class="space-y-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Filter (simple)</label>
                <input v-model="filterEditor.simple" class="input" placeholder='e.g. ["==","class","motorway"]' />
                <div class="text-xs text-gray-500 mt-1">This will be parsed as JSON when applying.</div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Raw JSON</label>
                <div class="flex items-center space-x-2 mb-2">
                  <label class="flex items-center"><input type="checkbox" v-model="useRawJson" class="mr-2" /> Edit raw JSON</label>
                </div>
                <textarea v-if="useRawJson" v-model="rawJson" class="input h-48 font-mono"></textarea>
                <div v-else class="text-xs text-gray-500">Toggle raw JSON to edit full style object directly.</div>
              </div>
            </div>
          </section>

          <div class="flex justify-end space-x-2">
            <button @click="closeStyleEditor" class="btn-secondary">Close</button>
            <button @click="applyStyleChanges" class="btn-primary">Apply</button>
          </div>
        </div>
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
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMapsStore } from '@/stores/maps'
import { useLayersStore } from '@/stores/layers'
import { useDatasetsStore } from '@/stores/datasets'
import { createMap, addLayerToMap, removeLayerFromMap, toggleLayerVisibility as toggleMapLayerVisibility, updateLayerStyle } from '@/utils/mapbox'
import { useMap } from './useMap'
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

// Use the shared composable for map behavior
const { mapboxMap, selectedFeature, popupRef, initializeMap } = useMap(mapContainer, map, layers)

// Extended editor state
const availableAttributes = ref<string[]>([])

const layerType = computed(() => {
  if (!currentLayer.value) return null
  // prefer explicit style.type, then dataset defaultStyle.type, fallback to 'fill'
  return currentLayer.value.style?.type || currentLayer.value.dataset?.defaultStyle?.type || 'fill'
})

const dataDriven = ref<any>({
  property: '',
  type: 'categorical',
  categorical: [] as Array<{ value: string; color: string }>,
  stops: [] as Array<{ input: number; output: any }> ,
  interpolation: 'linear'
})

const infoBox = ref<any>({
  selected: [] as string[],
  aliases: {} as Record<string,string>,
  titleField: '',
  template: '',
  background: '#ffffff',
  fontSize: 14
})

const filterEditor = ref<any>({ simple: '' })
const useRawJson = ref(false)
const rawJson = ref('')
const geoserverBaseUrl = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/$/, '')

const buildPublicIdFilter = (value: unknown) => {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const sanitized = raw.replace(/'/g, "''")
  return `public_id='${sanitized}'`
}

const fetchFeatureFromWfs = async (workspace: string, layerName: string, publicIdValue: unknown) => {
  if (!geoserverBaseUrl || publicIdValue === null || typeof publicIdValue === 'undefined') return null
  const filter = buildPublicIdFilter(publicIdValue)
  if (!filter) return null
  console.log('Fetching feature from WFS:', workspace, layerName, publicIdValue)
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    typeName: `${workspace}:${layerName}`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    CQL_FILTER: filter
  })

  const url = `${geoserverBaseUrl}/wfs?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('Failed WFS request:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const feature = Array.isArray(data?.features) && data.features.length ? data.features[0] : null
    if (feature && feature.geometry) {
      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: feature.properties || {}
      }
    }
  } catch (err) {
    console.warn('Error fetching WFS feature:', err)
  }

  return null
}

const stringifyProperty = (v: any) => {
  if (v === null || typeof v === 'undefined') return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const clearSelection = () => {
  selectedFeature.value = null
  if (mapboxMap.value) {
    const src = mapboxMap.value.getSource('selected-feature') as mapboxgl.GeoJSONSource | undefined
    if (src) src.setData({ type: 'FeatureCollection', features: [] })
  }
}

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
    const corpId = map.value?.corporationId
    await datasetsStore.fetchDataLibrary(corpId ? { corporationId: corpId } : undefined)
    availableDatasets.value = datasetsStore.dataLibrary
  } catch (error) {
    console.error('Failed to load datasets:', error)
  }
}

// The composable handles initializeMap and click/highlight behavior. We still need
// to ensure the container exists before initializing (the view uses v-if on map),
// so call initializeMap after nextTick where appropriate.

const selectLayer = (layer: Layer) => {
  // Clone to avoid mutating store object directly
  const cloned = JSON.parse(JSON.stringify(layer))
  // Ensure a _simple style container for UI-friendly fields
  cloned.style = cloned.style || {}
  cloned.style._simple = cloned.style._simple || {
    fillColor: cloned.style?.paint?.['fill-color'] || (cloned.dataset.defaultStyle?.paint?.['fill-color'] || '#3b82f6'),
    fillOpacity: cloned.style?.paint?.['fill-opacity'] ?? (cloned.dataset.defaultStyle?.paint?.['fill-opacity'] ?? 0.6),
    outlineColor: cloned.style?.paint?.['fill-outline-color'] || (cloned.dataset.defaultStyle?.paint?.['fill-outline-color'] || '#1e40af'),
    lineWidth: cloned.style?.paint?.['line-width'] ?? (cloned.dataset.defaultStyle?.paint?.['line-width'] ?? 1),
    translateX: cloned.style?.paint?.['fill-translate'] ? cloned.style.paint['fill-translate'][0] : 0,
    translateY: cloned.style?.paint?.['fill-translate'] ? cloned.style.paint['fill-translate'][1] : 0,
    dashArray: (cloned.style?.paint?.['line-dasharray'] || []).join(',') || '',
    circleRadius: cloned.style?.paint?.['circle-radius'] ?? cloned.dataset.defaultStyle?.paint?.['circle-radius'] ?? 6,
    circleColor: cloned.style?.paint?.['circle-color'] ?? cloned.dataset.defaultStyle?.paint?.['circle-color'] ?? '#3b82f6',
    textField: cloned.style?.layout?.['text-field'] || '',
    textSize: cloned.style?.layout?.['text-size'] ?? 12,
    iconImage: cloned.style?.layout?.['icon-image'] || ''
  }

  // Determine available attributes: try dataset.fields or leave empty
  availableAttributes.value = []
  try {
    if (cloned.dataset && (cloned.dataset as any).fields) {
      availableAttributes.value = (cloned.dataset as any).fields.map((f: any) => f.name)
    }
  } catch (e) {
    // ignore
  }

  // Fill raw JSON editor and set defaults for info box/filter editors
  rawJson.value = JSON.stringify(cloned.style || {}, null, 2)

  // Initialize infoBox editor from saved style if present
  if (cloned.style && cloned.style.infoBox) {
    infoBox.value = {
      selected: Array.isArray(cloned.style.infoBox.selected) ? cloned.style.infoBox.selected : [],
      aliases: cloned.style.infoBox.aliases || {},
      titleField: cloned.style.infoBox.titleField || '',
      template: cloned.style.infoBox.template || '',
      background: cloned.style.infoBox.background || '#ffffff',
      fontSize: cloned.style.infoBox.fontSize || 14
    }
  } else {
    infoBox.value = { selected: [], aliases: {}, titleField: '', template: '', background: '#ffffff', fontSize: 14 }
  }

  filterEditor.value = { simple: '' }
  if (cloned.style && cloned.style.filter) {
    try {
      filterEditor.value.simple = JSON.stringify(cloned.style.filter)
    } catch (e) {
      filterEditor.value.simple = String(cloned.style.filter)
    }
  }

  // Pre-fill dataDriven from style expressions if possible (basic: only handles 'match' and 'interpolate' for fill-color)
  dataDriven.value = { property: '', type: 'categorical', categorical: [], stops: [], interpolation: 'linear' }
  try {
    const p = cloned.style?.paint?.['fill-color']
    if (Array.isArray(p) && p[0] === 'match' && Array.isArray(p[1]) && p[1][0] === 'get') {
      dataDriven.value.property = p[1][1]
      dataDriven.value.type = 'categorical'
      // match: ['match', ['get', prop], v1, o1, v2, o2, default]
      const pairs = p.slice(2, p.length-1)
      for (let i = 0; i < pairs.length; i += 2) {
        dataDriven.value.categorical.push({ value: pairs[i], color: pairs[i+1] })
      }
    } else if (Array.isArray(p) && p[0] === 'interpolate') {
      dataDriven.value.type = 'continuous'
      // p = ['interpolate', ['linear'], ['to-number', ['get', prop]], in1, out1, in2, out2 ...]
      const toNumberIdx = p.findIndex((x: any) => Array.isArray(x) && x[0] === 'to-number')
      if (toNumberIdx > -1 && Array.isArray(p[toNumberIdx][1]) && p[toNumberIdx][1][0] === 'get') {
        dataDriven.value.property = p[toNumberIdx][1][1]
        // stops start after that
        const stopStart = toNumberIdx + 1
        for (let i = stopStart; i < p.length; i += 2) {
          dataDriven.value.stops.push({ input: Number(p[i]), output: p[i+1] })
        }
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  // If dataset.fields wasn't available, try to infer attribute names from the map source
  if (availableAttributes.value.length === 0 && mapboxMap.value) {
    try {
      const srcId = `source-${cloned.id}`
      let features: any[] = []

      // Try querying source tiles for features first
      try {
        if (mapboxMap.value.getSource(srcId)) {
          // querySourceFeatures may throw if tiles not loaded; wrap in try/catch
          // use sourceLayer if available
          const params: any = {}
          if (cloned.dataset && cloned.dataset.layerName) params.sourceLayer = cloned.dataset.layerName
          // limit is not a standard param for querySourceFeatures but some builds accept it; we'll handle defensively
          features = (mapboxMap.value.querySourceFeatures(srcId, params) as any) || []
        }
      } catch (e) {
        // ignore
      }

      // If no features from source, fall back to querying rendered features for our layer id
      if (!features || features.length === 0) {
        try {
          const layerId = `layer-${cloned.id}`
          // queryRenderedFeatures expects (geometry?, options?). Pass undefined for geometry and options with layers.
          features = mapboxMap.value.queryRenderedFeatures(undefined, { layers: [layerId] }) || []
        } catch (e) {
          // ignore
        }
      }

      const attrs = new Set<string>()
      features.forEach(f => {
        if (f && f.properties) {
          Object.keys(f.properties).forEach((k: string) => attrs.add(k))
        }
      })

      if (attrs.size) {
        availableAttributes.value = Array.from(attrs)
      }
    } catch (e) {
      // ignore
    }
  }

  currentLayer.value = cloned
}

// Apply style changes from the editor to the map and persist via store
const applyStyleChanges = async () => {
  if (!currentLayer.value) return

  // Ensure style object exists
  const style = currentLayer.value.style || {}
  // Normalize into Mapbox paint/layout keys expected by utils/mapbox
  const paint: any = { ...(style.paint || {}) }
  const layout: any = { ...(style.layout || {}) }

  // If using raw JSON, try to parse and use it directly
  if (useRawJson.value && rawJson.value) {
    try {
      const parsed = JSON.parse(rawJson.value)
      // prefer raw parsed object as new style
      style.paint = parsed.paint || parsed.paint === null ? parsed.paint : paint
      style.layout = parsed.layout || parsed.layout === null ? parsed.layout : layout
      style.filter = parsed.filter || style.filter
    } catch (e) {
      console.error('Invalid JSON in raw editor:', e)
    }
  } else {
    // If editing polygon/circle/line styles, map our simpler fields to paint properties
    if (style._simple) {
      const s = style._simple
      if (s.fillColor) paint['fill-color'] = s.fillColor
      if (typeof s.fillOpacity !== 'undefined') paint['fill-opacity'] = Number(s.fillOpacity)
      if (s.outlineColor) paint['fill-outline-color'] = s.outlineColor
      if (typeof s.lineWidth !== 'undefined') paint['line-width'] = Number(s.lineWidth)
      if (s.circleColor) paint['circle-color'] = s.circleColor
      if (typeof s.circleRadius !== 'undefined') paint['circle-radius'] = Number(s.circleRadius)

      // translate
      if (typeof s.translateX !== 'undefined' || typeof s.translateY !== 'undefined') {
        paint['fill-translate'] = [Number(s.translateX) || 0, Number(s.translateY) || 0]
        paint['line-translate'] = [Number(s.translateX) || 0, Number(s.translateY) || 0]
      }

      // dash array
      if (s.dashArray) {
        const parts = String(s.dashArray).split(',').map((p: string) => Number(p.trim())).filter((n: any) => !Number.isNaN(n))
        if (parts.length) paint['line-dasharray'] = parts
      }

      // layout fields
      if (s.textField) layout['text-field'] = ['get', s.textField]
      if (typeof s.textSize !== 'undefined') layout['text-size'] = Number(s.textSize)
      if (s.iconImage) layout['icon-image'] = s.iconImage
    }

    // Data-driven: simple handling for color or size
    if (dataDriven.value.property) {
      const prop = dataDriven.value.property
      if (dataDriven.value.type === 'categorical') {
        // build match expression mapbox-style: ['match', ['get', prop], v1, o1, v2, o2, default]
        const expr: any[] = ['match', ['get', prop]]
        dataDriven.value.categorical.forEach((c: any) => {
          expr.push(c.value)
          expr.push(c.color)
        })
        expr.push(paint['fill-color'] || '#888')
        paint['fill-color'] = expr
      } else if (dataDriven.value.type === 'interval') {
        // steps - use step expression
        const expr: any[] = ['step', ['to-number', ['get', prop]], dataDriven.value.stops.length ? dataDriven.value.stops[0].output : paint['fill-color'] || '#888']
        dataDriven.value.stops.forEach((s: any) => {
          expr.push(Number(s.input))
          expr.push(s.output)
        })
        paint['fill-color'] = expr
      } else if (dataDriven.value.type === 'continuous') {
        // interpolate
        const interp: any[] = ['interpolate', ['linear'], ['to-number', ['get', prop]]]
        dataDriven.value.stops.forEach((s: any) => {
          interp.push(Number(s.input))
          interp.push(s.output)
        })
        paint['fill-color'] = interp
      }
    }

    // Filter editor: try to parse simple JSON
    if (filterEditor.value.simple) {
      try {
        style.filter = JSON.parse(filterEditor.value.simple)
      } catch (e) {
        console.warn('Invalid filter JSON, ignoring')
      }
    }
  }

  const newStyle = {
    ...style,
    paint,
    layout
  }

  try {
    // Persist to backend/store
    // attach infoBox configuration
    newStyle.infoBox = {
      selected: infoBox.value.selected || [],
      aliases: infoBox.value.aliases || {},
      titleField: infoBox.value.titleField || '',
      template: infoBox.value.template || '',
      background: infoBox.value.background || '#ffffff',
      fontSize: infoBox.value.fontSize || 14
    }

    const updatedLayer = await layersStore.updateLayer(currentLayer.value.mapId, currentLayer.value.id, { style: newStyle, isVisible: currentLayer.value.isVisible })

    // Update local currentLayer to reflect persisted data
    currentLayer.value = JSON.parse(JSON.stringify(updatedLayer))

    // Apply to map visually
    if (mapboxMap.value && currentLayer.value) {
      const layerId = `layer-${currentLayer.value.id}`
      // use helper to update paint/layout
      updateLayerStyle(mapboxMap.value, layerId, { id: layerId, type: newStyle.type || 'fill', paint: newStyle.paint, layout: newStyle.layout })
      // update visibility
      toggleMapLayerVisibility(mapboxMap.value, layerId, currentLayer.value.isVisible)
    }
  } catch (err) {
    console.error('Failed to apply style changes:', err)
  }
}

const onVisibilityToggle = async () => {
  if (!currentLayer.value) return
  try {
    await layersStore.updateLayer(currentLayer.value.mapId, currentLayer.value.id, { isVisible: currentLayer.value.isVisible })
    if (mapboxMap.value) {
      toggleMapLayerVisibility(mapboxMap.value, `layer-${currentLayer.value.id}`, currentLayer.value.isVisible)
    }
  } catch (e) {
    console.error('Failed to toggle visibility:', e)
  }
}

const closeStyleEditor = () => {
  currentLayer.value = null
}

const moveInfoFieldUp = (idx: number) => {
  if (!infoBox.value || idx <= 0) return
  const arr = infoBox.value.selected
  const tmp = arr[idx - 1]
  arr[idx - 1] = arr[idx]
  arr[idx] = tmp
}

const moveInfoFieldDown = (idx: number) => {
  if (!infoBox.value || idx < 0 || idx >= infoBox.value.selected.length - 1) return
  const arr = infoBox.value.selected
  const tmp = arr[idx + 1]
  arr[idx + 1] = arr[idx]
  arr[idx] = tmp
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
  // Ensure the DOM is rendered so our ref exists (MapEditor uses a static container, but be defensive)
  await nextTick()
  if (mapContainer.value) {
    initializeMap(mapContainer.value, {
      center: map.value?.centerLng && map.value?.centerLat ? [map.value.centerLng, map.value.centerLat] : [0,0],
      zoom: map.value?.zoom || 2,
      bearing: map.value?.bearing || 0,
      pitch: map.value?.pitch || 0
    })
  }
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
