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
  map.on('styledata', () => {
    map.addSource(sourceId, {
      type: 'vector',
      tiles: [vectorTileUrl],
      minzoom: 0,
      maxzoom: 22
    });
    
    // Apply layer style
    const style = layer.style || layer.dataset.defaultStyle || getDefaultLayerStyle(layer.dataset.mimeType)
    console.log('Layer Style:', style);
    map.addLayer({
      id: layerId,
      type: style.type,
      source: sourceId,
      'source-layer': layer.dataset.layerName || 'default',
      paint: style.paint,
      layout: style.layout,
      filter: style.filter
    })

  });
 

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
  layerIds.forEach((layerId, index) => {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId, index)
    }
  })
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
