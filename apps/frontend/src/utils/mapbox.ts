import mapboxgl from 'mapbox-gl'
import type { Map, Layer, LayerStyle } from '@/types'

// Initialize Mapbox with access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

export const createMap = (container: string | HTMLElement, options: any = {}) => {
  const defaultOptions = {
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 0],
    zoom: 2,
    ...options
  }

  return new mapboxgl.Map({
    container,
    ...defaultOptions
  })
}

export const addLayerToMap = (map: mapboxgl.Map, layer: Layer, geoserverUrl: string) => {
  const sourceId = `source-${layer.id}`
  const layerId = `layer-${layer.id}`

  // Create vector tile source
  const vectorTileUrl = `${geoserverUrl}/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${layer.dataset.workspaceName}:${layer.dataset.layerName}&STYLE=&TILEMATRIXSET=WebMercatorQuad&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=application/vnd.mapbox-vector-tile`
  console.log('Vector Tile URL:', vectorTileUrl);
  const addSourceAndLayer = () => {
    // Only add the vector source if it doesn't already exist.
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        tiles: [vectorTileUrl],
        minzoom: 0,
        maxzoom: 22
      });
    }

    // Apply layer style (normalize via createStyleFromLayer so `type` is always present)
    const style = createStyleFromLayer(layer)
    console.log(`Layer Style (layer ${layer.id}):`, style)
    const layerType = style?.type || 'fill'
    if (!style || !style.type) {
      console.warn('Unable to determine layer type for layer', layer.id, 'falling back to fill')
    }

    // Sanitize paint/layout/filter to avoid Mapbox validation errors when
    // style contains properties that don't apply to the chosen layer type.
    const sanitizeStyle = (s: any, type: string) => {
      const out: any = {}

      if (s?.paint && typeof s.paint === 'object') {
        out.paint = {}
        Object.keys(s.paint).forEach((k) => {
          // include paint keys that are prefixed for this type (e.g., 'fill-' for fill)
          if (k.startsWith(`${type}-`)) {
            out.paint[k] = s.paint[k]
          }
        })
      }

      if (s?.layout && typeof s.layout === 'object') {
        out.layout = { ...s.layout }
      }

      if (Array.isArray(s?.filter)) {
        out.filter = s.filter
      }

      return out
    }

    const sanitized = sanitizeStyle(style, layerType)

    const layerDef: any = {
      id: layerId,
      type: layerType,
      source: sourceId,
      'source-layer': layer.dataset.layerName || 'default',
    }

    if (sanitized.paint) layerDef.paint = sanitized.paint
    if (sanitized.layout) layerDef.layout = sanitized.layout
    if (sanitized.filter) layerDef.filter = sanitized.filter

    // Only add the map layer if it's not already present.
    if (!map.getLayer(layerId)) {
      map.addLayer(layerDef)
    }
  }

  // If the style is already loaded, add source and layer immediately.
  // Otherwise register a one-time handler so we don't add duplicates if
  // the style fires multiple 'styledata' events.
  try {
    if ((map as any).isStyleLoaded && (map as any).isStyleLoaded()) {
      addSourceAndLayer()
    } else {
      map.once('styledata', addSourceAndLayer)
    }
  } catch (err) {
    // Defensive fallback: if map.isStyleLoaded isn't available for some
    // mapbox build, fall back to registering a one-time handler.
    map.once('styledata', addSourceAndLayer)
  }
 

  return { sourceId, layerId }
}

export const removeLayerFromMap = (map: mapboxgl.Map, layerId: string, sourceId: string) => {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId)
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId)
  }
}

export const updateLayerStyle = (map: mapboxgl.Map, layerId: string, style: LayerStyle) => {
  if (map.getLayer(layerId)) {
    if (style.paint) {
      Object.keys(style.paint).forEach(property => {
        map.setPaintProperty(layerId, property, style.paint![property])
      })
    }
    if (style.layout) {
      Object.keys(style.layout).forEach(property => {
        map.setLayoutProperty(layerId, property, style.layout![property])
      })
    }
  }
}

export const toggleLayerVisibility = (map: mapboxgl.Map, layerId: string, visible: boolean) => {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

export const reorderLayers = (map: mapboxgl.Map, layerIds: string[]) => {
  // The incoming layerIds array is ordered bottom-to-top (index 0 is bottom).
  // Mapbox's moveLayer accepts (id, beforeId?) where beforeId is another layer id.
  // To achieve the requested stacking, move each layer before the next existing layer.
  for (let i = 0; i < layerIds.length; i++) {
    const layerId = `layer-${layerIds[i]}`
    if (!map.getLayer(layerId)) continue

    // Find the next layer in the list that exists on the map
    let beforeId: string | undefined
    for (let j = i + 1; j < layerIds.length; j++) {
      const candidate = `layer-${layerIds[j]}`
      if (map.getLayer(candidate)) {
        beforeId = candidate
        break
      }
    }

    if (beforeId) {
      map.moveLayer(layerId, beforeId)
    } else {
      // No later layer found; move this layer to the top
      map.moveLayer(layerId)
    }
  }
}

export const getDefaultLayerStyle = (mimeType: string): LayerStyle => {
  switch (mimeType) {
    case 'application/geo+json':
    case 'application/json':
      // Default style for GeoJSON (polygon)
      return {
        id: 'default',
        type: 'fill',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.6,
          'fill-outline-color': '#1e40af'
        },
        layout: {
          visibility: 'visible'
        },
        filter: ['all'] // Show all features by default
      }
    default:
      // Default style for other formats
      return {
        id: 'default',
        type: 'fill',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.6,
          'fill-outline-color': '#1e40af'
        },
        layout: {
          visibility: 'visible'
        },
        filter: ['all'] // Show all features by default
      }
  }
}

export const createStyleFromLayer = (layer: Layer): LayerStyle => {
  const baseStyle = layer.style || layer.dataset.defaultStyle || getDefaultLayerStyle(layer.dataset.mimeType)
  
  return {
    id: `layer-${layer.id}`,
    type: baseStyle.type || 'fill',
    paint: baseStyle.paint || {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.6,
      'fill-outline-color': '#1e40af'
    },
    layout: baseStyle.layout || {},
    filter: baseStyle.filter
  }
}

export const exportMapAsImage = (map: mapboxgl.Map): Promise<string> => {
  return new Promise((resolve, reject) => {
    map.getCanvas().toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        resolve(url)
      } else {
        reject(new Error('Failed to export map as image'))
      }
    }, 'image/png')
  })
}

export const fitMapToBounds = (map: mapboxgl.Map, bounds: mapboxgl.LngLatBoundsLike, padding: number = 50) => {
  map.fitBounds(bounds, { padding })
}
