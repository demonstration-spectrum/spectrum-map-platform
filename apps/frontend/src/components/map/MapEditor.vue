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
            <div class="flex items-center gap-2">
              <button @click="createGroup" class="btn-secondary text-sm">New Group</button>
              <button
                @click="showAddLayerModal = true"
                class="btn-primary text-sm"
              >
                Add Layer
              </button>
            </div>
          </div>

          <!-- Groups and Layers -->
          <div class="space-y-3">
            <!-- Ungrouped Header if groups exist -->
            <template v-if="layerGroups.length">
              <div class="flex items-center justify-between text-xs text-gray-500 px-2">
                <div class="font-semibold">Ungrouped</div>
                <div class="flex items-center gap-2">
                  <button @click="toggleGroupVisibility(null)" class="p-1 text-gray-400 hover:text-gray-600" :title="ungroupedAllVisible ? 'Hide all' : 'Show all'">
                    <svg v-if="ungroupedAllVisible" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                  </button>
                </div>
              </div>
            </template>

            <!-- Ungrouped Layers List -->
            <div class="space-y-2" @dragover.prevent @drop.prevent="onDropUngrouped">
              <div
                v-for="layer in ungroupedLayers"
                :key="layer.id"
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                :class="{ 'bg-blue-50 border-blue-200': currentLayer?.id === layer.id }"
                draggable="true"
                @dragstart="onDragStart(layer)"
                @dragend="onDragEnd"
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
                  <template v-if="renamingLayerId === layer.id">
                    <input v-model="renameText" @keyup.enter="commitRename(layer)" @blur="commitRename(layer)" class="input text-sm py-1" />
                  </template>
                  <template v-else>
                    <p class="text-sm font-medium text-gray-900 truncate">{{ layer.name }}</p>
                    <p class="text-xs text-gray-500">{{ layer.dataset.name }}</p>
                  </template>
                </div>

                <div class="flex items-center space-x-1">
                  <button @click="startRename(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Rename">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="selectLayer(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Style">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h1m6-13h1a2 2 0 012 2v1m0 6v1a2 2 0 01-2 2h-1M8 4H7a2 2 0 00-2 2v1"/></svg>
                  </button>
                  <button @click="openPopups(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Pop-ups">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-3l-4 4z"/></svg>
                  </button>
                  <button @click="zoomToLayer(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Zoom to layer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <button @click="openDataModal(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Data table">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 6h18M3 14h18M3 18h18"/></svg>
                  </button>
                  <button
                    @click="removeLayer(layer)"
                    class="p-1 text-gray-400 hover:text-red-600"
                    title="Remove"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Groups -->
            <div v-for="group in layerGroups" :key="group.id" class="border border-gray-200 rounded">
              <div class="flex items-center justify-between px-2 py-1 bg-gray-50 border-b">
                <div class="flex items-center gap-2 min-w-0">
                  <button @click="toggleGroupCollapse(group)" class="p-1 text-gray-500 hover:text-gray-700" :title="group.isCollapsed ? 'Expand' : 'Collapse'">
                    <svg v-if="group.isCollapsed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div class="flex-1 min-w-0">
                    <template v-if="renamingGroupId === group.id">
                      <input v-model="renameText" @keyup.enter="commitRenameGroup(group)" @blur="commitRenameGroup(group)" class="input text-xs py-1" />
                    </template>
                    <template v-else>
                      <div class="text-xs font-semibold text-gray-700 truncate">{{ group.name }}</div>
                    </template>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="toggleGroupVisibility(group)" class="p-1 text-gray-400 hover:text-gray-600" :title="group.isVisible ? 'Hide' : 'Show'">
                    <svg v-if="group.isVisible" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                  </button>
                  <button @click="startRenameGroup(group)" class="p-1 text-gray-400 hover:text-gray-600" title="Rename group">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="deleteGroup(group)" class="p-1 text-gray-400 hover:text-red-600" title="Delete group">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
              <div v-show="!group.isCollapsed" class="p-2 space-y-2" @dragover.prevent @drop.prevent="onDropOnGroup(group)">
                <div
                  v-for="layer in layersInGroup(group)"
                  :key="layer.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  :class="{ 'bg-blue-50 border-blue-200': currentLayer?.id === layer.id }"
                  draggable="true"
                  @dragstart="onDragStart(layer, group)"
                  @dragend="onDragEnd"
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
                    <template v-if="renamingLayerId === layer.id">
                      <input v-model="renameText" @keyup.enter="commitRename(layer)" @blur="commitRename(layer)" class="input text-sm py-1" />
                    </template>
                    <template v-else>
                      <p class="text-sm font-medium text-gray-900 truncate">{{ layer.name }}</p>
                      <p class="text-xs text-gray-500">{{ layer.dataset.name }}</p>
                    </template>
                  </div>

                  <div class="flex items-center space-x-1">
                    <button @click="startRename(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Rename">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button @click="selectLayer(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Style">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h1m6-13h1a2 2 0 012 2v1m0 6v1a2 2 0 01-2 2h-1M8 4H7a2 2 0 00-2 2v1"/></svg>
                    </button>
                    <button @click="openPopups(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Pop-ups">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-3l-4 4z"/></svg>
                    </button>
                    <button @click="zoomToLayer(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Zoom to layer">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </button>
                    <button @click="openDataModal(layer)" class="p-1 text-gray-400 hover:text-gray-600" title="Data table">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 6h18M3 14h18M3 18h18"/></svg>
                    </button>
                    <button @click="removeLayer(layer)" class="p-1 text-gray-400 hover:text-red-600" title="Remove">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
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
      <div class="flex flex-col h-[calc(100%-64px)]">
        <!-- Tabs -->
        <div class="px-4 pt-3 border-b">
          <div class="flex gap-2 text-sm">
            <button :class="['px-3 py-1 rounded-t', activeStyleTab==='style' ? 'bg-white border border-b-0' : 'text-gray-600 hover:text-gray-800']" @click="activeStyleTab='style'">Style</button>
            <button :class="['px-3 py-1 rounded-t', activeStyleTab==='popups' ? 'bg-white border border-b-0' : 'text-gray-600 hover:text-gray-800']" @click="activeStyleTab='popups'">Pop-ups</button>
            <button :class="['px-3 py-1 rounded-t', activeStyleTab==='advanced' ? 'bg-white border border-b-0' : 'text-gray-600 hover:text-gray-800']" @click="activeStyleTab='advanced'">Advanced</button>
          </div>
        </div>

        <div class="p-4 overflow-y-auto flex-1">
        <div class="space-y-6">
          <template v-if="activeStyleTab==='style'">
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
          </template>

          <template v-else-if="activeStyleTab==='popups'">
            <!-- Feature Info Box Formatter -->
            <section ref="featureInfoSection">
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
          </template>

          <template v-else>
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
          </template>

          <div class="flex justify-end space-x-2">
            <button @click="closeStyleEditor" class="btn-secondary">Close</button>
            <button @click="applyStyleChanges" class="btn-primary">Apply</button>
          </div>
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

    <!-- Data Table Modal -->
    <div v-if="showDataModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-[48rem] max-w-[95vw] shadow-lg rounded-md bg-white">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Data: {{ dataModalLayer?.name }}</h3>
            <p class="text-xs text-gray-500">{{ dataModalLayer?.dataset?.workspaceName }}:{{ dataModalLayer?.dataset?.layerName }}</p>
          </div>
          <button @click="showDataModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="border rounded">
          <div v-if="isLoadingData" class="p-6 text-sm text-gray-600">Loading…</div>
          <div v-else-if="dataError" class="p-4 text-sm text-red-600">{{ dataError }}</div>
          <div v-else class="overflow-auto max-h-[60vh]">
            <table class="min-w-full border-separate border-spacing-0 text-xs">
              <thead class="sticky top-0 bg-gray-50">
                <tr>
                  <th v-for="c in dataColumns" :key="c" class="text-left font-semibold text-gray-700 px-3 py-2 border-b">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in dataRows" :key="idx" class="even:bg-gray-50">
                  <td v-for="c in dataColumns" :key="c" class="px-3 py-2 border-b truncate max-w-[16rem]" :title="String(row[c] ?? '')">{{ String(row[c] ?? '') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2">Showing first 100 features via WFS.</div>
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
import { useLayerGroupsStore } from '@/stores/layerGroups'
import { createMap, addLayerToMap, removeLayerFromMap, toggleLayerVisibility as toggleMapLayerVisibility, updateLayerStyle, reorderLayers as reorderMapLayers, fitMapToBounds } from '@/utils/mapbox'
import { useMap } from './useMap'
import type { Map, Layer, Dataset } from '@/types'
import mapboxgl from 'mapbox-gl'

const route = useRoute()
const mapsStore = useMapsStore()
const layersStore = useLayersStore()
const datasetsStore = useDatasetsStore()
const groupsStore = useLayerGroupsStore()

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

// Style editor tabs: 'style' | 'popups' | 'advanced'
const activeStyleTab = ref<'style' | 'popups' | 'advanced'>('style')

const filterEditor = ref<any>({ simple: '' })
const useRawJson = ref(false)
const rawJson = ref('')
const geoserverBaseUrl = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/$/, '')

// ----- Grouping and ordering state -----
type LayerGroup = { id: string; name: string; isCollapsed: boolean; isVisible: boolean; layerIds: string[] }
// derive local presentation structure from backend groups + layers
const layerGroups = ref<LayerGroup[]>([])
const renamingGroupId = ref<string | null>(null)
const renamingLayerId = ref<string | null>(null)
const renameText = ref('')
const draggingLayerId = ref<string | null>(null)
const draggingFromGroupId = ref<string | null>(null) // null => ungrouped

const ungroupedLayers = computed(() => {
  const groupedIds = new Set<string>(layerGroups.value.flatMap(g => g.layerIds))
  // Order top-to-bottom by current layer order descending (higher order means on top)
  return [...layers.value]
    .filter(l => !groupedIds.has(l.id))
    .sort((a, b) => (b.order || 0) - (a.order || 0))
})

const ungroupedAllVisible = computed(() => ungroupedLayers.value.every(l => l.isVisible))

const layersInGroup = (group: LayerGroup) => {
  const byId: Record<string, Layer> = Object.fromEntries(layers.value.map(l => [l.id, l]))
  // layerIds top-to-bottom in UI
  return group.layerIds.map(id => byId[id]).filter(Boolean)
}

const syncGroupsFromStore = () => {
  // Build presentation: each backend group, and compute layerIds by membership (sorted top-first using layer.order desc)
  if (!map.value) return
  const byGroup: Record<string, string[]> = {}
  const ungrouped: string[] = []
  layers.value.forEach(l => {
    if (l as any && (l as any).groupId) {
      const gid = (l as any).groupId as string
      if (!byGroup[gid]) byGroup[gid] = []
      byGroup[gid].push(l.id)
    } else {
      ungrouped.push(l.id)
    }
  })
  const groups = groupsStore.groups
  layerGroups.value = groups.map(g => ({ id: g.id, name: g.name, isCollapsed: g.isCollapsed, isVisible: g.isVisible, layerIds: (byGroup[g.id] || []).sort((a, b) => ((layers.value.find(l => l.id === b)?.order || 0) - (layers.value.find(l => l.id === a)?.order || 0))) }))
  // ungrouped handled via computed ungroupedLayers (from orders)
}

const reconcileGroupsWithLayers = () => {
  // Remove ids for layers that no longer exist; preserve group order
  const presentIds = new Set(layers.value.map(l => l.id))
  layerGroups.value.forEach(g => {
    g.layerIds = g.layerIds.filter(id => presentIds.has(id))
  })
  // No duplicates across groups
  const seen = new Set<string>()
  layerGroups.value.forEach(g => {
    g.layerIds = g.layerIds.filter(id => {
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  })
  // Any layer not in any group stays ungrouped (handled by computed)
  // backend stored; no-op here
}

const createGroup = () => {
  const id = `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  if (!map.value) return
  groupsStore.createGroup(map.value.id, 'New Group').then(() => syncGroupsFromStore())
}

const startRename = (layer: Layer) => {
  renamingGroupId.value = null
  renamingLayerId.value = layer.id
  renameText.value = layer.name
}

const commitRename = async (layer: Layer) => {
  if (!map.value) return
  const text = renameText.value.trim()
  renamingLayerId.value = null
  if (!text || text === layer.name) return
  try {
    await layersStore.updateLayer(layer.mapId, layer.id, { name: text })
  } catch (e) {
    console.error('Failed to rename layer', e)
  }
}

const startRenameGroup = (group: LayerGroup) => {
  renamingLayerId.value = null
  renamingGroupId.value = group.id
  renameText.value = group.name
}

const commitRenameGroup = (group: LayerGroup) => {
  const text = renameText.value.trim()
  renamingGroupId.value = null
  if (!text || text === group.name) return
  if (!map.value) return
  groupsStore.updateGroup(map.value.id, group.id, { name: text }).then(() => syncGroupsFromStore())
}

const toggleGroupCollapse = (group: LayerGroup) => {
  group.isCollapsed = !group.isCollapsed
  if (map.value) groupsStore.updateGroup(map.value.id, group.id, { isCollapsed: group.isCollapsed }).catch(() => {})
}

const deleteGroup = (group: LayerGroup) => {
  if (!confirm(`Delete group "${group.name}"? Layers will remain ungrouped.`)) return
  if (!map.value) return
  groupsStore.deleteGroup(map.value.id, group.id).then(() => syncGroupsFromStore())
}

const toggleGroupVisibility = async (group: LayerGroup | null) => {
  // null means ungrouped
  const targetLayers = group ? layersInGroup(group) : ungroupedLayers.value
  const willShow = group ? !group.isVisible : !ungroupedAllVisible.value
  if (group && map.value) groupsStore.updateGroup(map.value.id, group.id, { isVisible: willShow }).catch(() => {})
  for (const l of targetLayers) {
    try {
      if (l.isVisible !== willShow) {
        await layersStore.toggleLayerVisibility(l.mapId, l.id)
        if (mapboxMap.value) toggleMapLayerVisibility(mapboxMap.value, `layer-${l.id}`, willShow)
      }
    } catch (e) {
      console.error('Failed to toggle visibility for', l.name, e)
    }
  }
  // no-op
}

// ----- Drag & drop ordering -----
const onDragStart = (layer: Layer, group?: LayerGroup) => {
  draggingLayerId.value = layer.id
  draggingFromGroupId.value = group ? group.id : null
}
const onDragEnd = () => {
  console.log('Drag end', draggingLayerId.value);
  draggingLayerId.value = null
  draggingFromGroupId.value = null
}

const onDropOnGroup = (group: LayerGroup) => {
  console.log('Drop on group', group.id);
  if (!draggingLayerId.value) return
  // Remove from previous place
  if (draggingFromGroupId.value) {
    const from = layerGroups.value.find(g => g.id === draggingFromGroupId.value)
    if (from) from.layerIds = from.layerIds.filter(id => id !== draggingLayerId.value)
  }
  // Ensure not present in any other group
  layerGroups.value.forEach(g => { if (g.id !== group.id) g.layerIds = g.layerIds.filter(id => id !== draggingLayerId.value) })
  // Add to target group at top (UI top)
  group.layerIds = [draggingLayerId.value, ...group.layerIds]
  applyReorderFlattened()
}

const onDropUngrouped = () => {
  if (!draggingLayerId.value) return
  // Remove from any group
  layerGroups.value.forEach(g => g.layerIds = g.layerIds.filter(id => id !== draggingLayerId.value))
  applyReorderFlattened()
}

const applyReorderFlattened = async () => {
  if (!map.value) return
  // Build a top-to-bottom flattened list: ungrouped on top in current UI order, then each group in current UI order
  const topToBottom: string[] = []
  // ungrouped first (UI already top-first by order desc)
  topToBottom.push(...ungroupedLayers.value.map(l => l.id))
  // then groups in their current order, each with their ids as-is (top-first)
  layerGroups.value.forEach(g => topToBottom.push(...g.layerIds))

  // Backend expects array in display order; store.reorderLayers will overwrite local orders
  // Persist grouping + ordering to backend
  try {
    const items: { layerId: string; groupId?: string | null; order: number }[] = []
    // Build orders (bottom-to-top ascending order index)
    // We want backend order starting at 1 for bottom-most; bottomToTop already prepared below
    // Use the bottomToTop reversed index to assign ascending order
    const assignOrders = () => {
      // from presentation: ungrouped first (topToBottom already in top-first), then groups in UI order
      // Convert to bottom-first
      const bottomFirst = [...topToBottom].reverse()
      bottomFirst.forEach((id, idx) => {
        const layer = layers.value.find(l => l.id === id)
        if (!layer) return
        // Determine groupId from current presentation groups
        let gid: string | null = null
        const g = layerGroups.value.find(gr => gr.layerIds.includes(id))
        gid = g ? g.id : null
        items.push({ layerId: id, groupId: gid, order: idx + 1 })
      })
    }
    assignOrders()
    await groupsStore.setGrouping(map.value.id, items)
  } catch (e) {
    console.error('Failed to persist layer grouping', e)
  }

  // Mapbox expects bottom-to-top ordering to move layers; reverse
  const bottomToTop = [...topToBottom].reverse()
  if (mapboxMap.value) {
    try {
      reorderMapLayers(mapboxMap.value, bottomToTop)
    } catch (e) {
      console.warn('Failed to reorder map layers', e)
    }
  }
}

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

// ----- Data table modal state -----
const showDataModal = ref(false)
const dataModalLayer = ref<Layer | null>(null)
const dataRows = ref<any[]>([])
const dataColumns = ref<string[]>([])
const isLoadingData = ref(false)
const dataError = ref<string | null>(null)

const openDataModal = async (layer: Layer) => {
  dataModalLayer.value = layer
  showDataModal.value = true
  await fetchLayerData(layer)
}

const fetchLayerData = async (layer: Layer) => {
  if (!geoserverBaseUrl || !layer?.dataset?.workspaceName || !layer?.dataset?.layerName) {
    dataError.value = 'Layer is missing GeoServer info.'
    return
  }
  isLoadingData.value = true
  dataError.value = null
  try {
    const params = new URLSearchParams({
      service: 'WFS', version: '1.1.0', request: 'GetFeature',
      typeName: `${layer.dataset.workspaceName}:${layer.dataset.layerName}`,
      outputFormat: 'application/json', srsName: 'EPSG:4326', maxFeatures: '100'
    })
    const res = await fetch(`${geoserverBaseUrl}/wfs?${params.toString()}`)
    if (!res.ok) throw new Error(`WFS error ${res.status}`)
    const gj = await res.json()
    const feats: any[] = Array.isArray(gj?.features) ? gj.features : []
    dataRows.value = feats.map(f => f.properties || {})
    const cols = new Set<string>()
    dataRows.value.forEach(r => Object.keys(r).forEach(k => cols.add(k)))
    dataColumns.value = Array.from(cols)
  } catch (e: any) {
    dataError.value = e?.message || 'Failed to fetch data.'
  } finally {
    isLoadingData.value = false
  }
}

// ----- Zoom to layer -----
const fetchLayerBounds = async (workspace: string, layerName: string): Promise<[number, number, number, number] | null> => {
  // Try WMS GetCapabilities for WGS84 bbox
  try {
    const res = await fetch(`${geoserverBaseUrl}/wms?service=WMS&version=1.3.0&request=GetCapabilities`)
    const text = await res.text()
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const names = xml.getElementsByTagName('Name')
    for (let i = 0; i < names.length; i++) {
      const n = names[i]
      if (n.textContent === `${workspace}:${layerName}`) {
        // Look for EX_GeographicBoundingBox
        let bboxNode = n.parentElement?.getElementsByTagName('EX_GeographicBoundingBox')[0]
        if (bboxNode) {
          const west = parseFloat(bboxNode.getElementsByTagName('westBoundLongitude')[0]?.textContent || '')
          const east = parseFloat(bboxNode.getElementsByTagName('eastBoundLongitude')[0]?.textContent || '')
          const south = parseFloat(bboxNode.getElementsByTagName('southBoundLatitude')[0]?.textContent || '')
          const north = parseFloat(bboxNode.getElementsByTagName('northBoundLatitude')[0]?.textContent || '')
          if ([west, south, east, north].every(v => Number.isFinite(v))) return [west, south, east, north]
        }
        // Fallback WGS84BoundingBox
        bboxNode = n.parentElement?.getElementsByTagName('WGS84BoundingBox')[0]
        if (bboxNode) {
          const lower = bboxNode.getElementsByTagName('LowerCorner')[0]?.textContent?.trim().split(/\s+/).map(Number) || []
          const upper = bboxNode.getElementsByTagName('UpperCorner')[0]?.textContent?.trim().split(/\s+/).map(Number) || []
          if (lower.length === 2 && upper.length === 2) return [lower[0], lower[1], upper[0], upper[1]]
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null
}

const zoomToLayer = async (layer: Layer) => {
  if (!mapboxMap.value) return
  // Try capabilities
  if (layer.dataset.workspaceName && layer.dataset.layerName) {
    const bbox = await fetchLayerBounds(layer.dataset.workspaceName, layer.dataset.layerName)
    if (bbox) {
      try {
        const b = new mapboxgl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]])
        fitMapToBounds(mapboxMap.value, b, 40)
        return
      } catch {}
    }
  }
  // Fallback: fit to currently rendered features (may be partial)
  try {
    const layerIds = [`layer-${layer.id}`, `layer-${layer.id}-fill`, `layer-${layer.id}-line`, `layer-${layer.id}-point`].filter(id => {
      try { return mapboxMap.value!.getLayer(id) } catch { return false }
    })
    const feats = layerIds.length ? mapboxMap.value.queryRenderedFeatures(undefined, { layers: layerIds as any }) : []
    if (feats && feats.length) {
      let bounds: mapboxgl.LngLatBounds | null = null
      feats.forEach((f: any) => {
        const g = f.geometry
        const asGeo = g as any
        // Use bbox helper by converting to GeoJSON geometry and iterating coordinates
        const addCoord = (lng: number, lat: number) => {
          if (!bounds) bounds = new mapboxgl.LngLatBounds([lng, lat], [lng, lat])
          else bounds!.extend([lng, lat])
        }
        const walk = (coords: any) => {
          if (typeof coords[0] === 'number') addCoord(coords[0], coords[1])
          else coords.forEach((c: any) => walk(c))
        }
        if (asGeo?.coordinates) walk(asGeo.coordinates)
      })
      if (bounds) fitMapToBounds(mapboxMap.value, bounds, 40)
    }
  } catch (e) {
    console.warn('Zoom to layer failed', e)
  }
}

// Pop-ups quick access: open style panel and scroll to Feature Info Box
const featureInfoSection = ref<HTMLElement | null>(null)
const openPopups = async (layer: Layer) => {
  selectLayer(layer)
  activeStyleTab.value = 'popups'
  await nextTick()
  if (featureInfoSection.value) featureInfoSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
    // Remove from any groups
    layerGroups.value.forEach(g => g.layerIds = g.layerIds.filter(id => id !== layer.id))
    applyReorderFlattened()
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
  if (map.value) {
    await groupsStore.fetchGroups(map.value.id)
    syncGroupsFromStore()
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
  syncGroupsFromStore()
}, { deep: true })
</script>
