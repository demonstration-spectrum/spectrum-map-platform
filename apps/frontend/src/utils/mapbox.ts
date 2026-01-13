import mapboxgl from 'mapbox-gl'
import type { Map, Layer, LayerStyle } from '@/types'

// Initialize Mapbox with access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

export const createMap = (container: string | HTMLElement, options: any = {}) => {
  // Validate container
  let containerEl: HTMLElement | null = null
  
  if (typeof container === 'string') {
    containerEl = document.getElementById(container)
    if (!containerEl) {
      console.error(`createMap: Container with id "${container}" not found in DOM`)
      throw new Error(`Container "${container}" not found`)
    }
  } else if (container instanceof HTMLElement) {
    containerEl = container
  } else {
    console.error('createMap: Container must be an HTMLElement or string ID')
    throw new Error('Invalid container type')
  }

  // Check container dimensions
  if (containerEl.offsetWidth === 0 || containerEl.offsetHeight === 0) {
    console.warn('createMap: Container has zero dimensions. Width:', containerEl.offsetWidth, 'Height:', containerEl.offsetHeight)
  }

  const defaultOptions = {
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 0],
    zoom: 2,
    ...options
  }

  try {
    const map = new mapboxgl.Map({
      container: containerEl,
      ...defaultOptions
    })
    
    console.log('createMap: Map instance created successfully')
    return map
  } catch (error) {
    console.error('createMap: Error creating map instance:', error)
    throw error
  }
}

export const addLayerToMap = (map: mapboxgl.Map, layer: Layer, geoserverUrl: string) => {
  const sourceId = `source-${layer.id}`
  const layerId = `layer-${layer.id}`

  // Create vector tile source
  const apiBaseUrl = (geoserverUrl || '').replace(/\/$/, '')
  const vectorTileUrl = `${apiBaseUrl}/proxy/layers/${layer.id}/tiles/{z}/{x}/{y}.pbf`
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

    // Apply layer style (createStyleFromLayer will return paint/layout defaults
    // but will not force a type to 'fill' so the inference logic below can run
    // when a type isn't explicitly provided).
    const style = createStyleFromLayer(layer)
    console.log(`Layer Style (layer ${layer.id}):`, style)
    const layerType = style?.type
    if (!style || !style.type) {
      console.warn('No explicit layer type for layer', layer.id, '- attempting to infer geometry type or add type-specific layers')
    }

    // Sanitize paint/layout/filter to avoid Mapbox validation errors when
    // style contains properties that don't apply to the chosen layer type.
    const allowedLayoutProps: Record<string, string[]> = {
      fill: ['visibility'],
      line: ['visibility'],
      circle: ['visibility'],
      symbol: ['visibility', 'text-field', 'text-size', 'text-font', 'text-offset', 'icon-image', 'icon-size', 'symbol-placement', 'symbol-spacing', 'symbol-sort-key', 'symbol-z-order', 'icon-allow-overlap', 'text-allow-overlap'],
      'fill-extrusion': ['visibility'],
      raster: ['visibility'],
      background: ['visibility']
    }

    // Sanitize and normalize style for the requested layer type. This helper
    // will accept either fully-prefixed Mapbox paint keys (e.g. 'fill-color')
    // or a small set of generic keys (color, opacity, width, radius, outline-color,
    // dasharray) and will map them to sensible paint properties for fill/line/circle.
    const sanitizeStyle = (s: any, type: string) => {
      const out: any = {}

      const paint: any = {}

      if (s?.paint && typeof s.paint === 'object') {
        Object.keys(s.paint).forEach((k) => {
          const v = s.paint[k]
          // If the key is already namespaced for this type, keep it
          if (k.startsWith(`${type}-`)) {
            paint[k] = v
            return
          }

          // If the key is a fully namespaced property for another type, try to
          // map some cross-type keys (e.g., 'line-color' -> 'fill-outline-color')
          if (k.indexOf('-') > -1) {
            // keep other explicit keys but they won't be applied to this type
            return
          }

          // Generic keys mapping
          switch (k) {
            case 'color':
              if (type === 'fill') paint['fill-color'] = v
              if (type === 'line') paint['line-color'] = v
              if (type === 'circle') paint['circle-color'] = v
              break
            case 'opacity':
              if (type === 'fill') paint['fill-opacity'] = v
              if (type === 'line') paint['line-opacity'] = v
              if (type === 'circle') paint['circle-opacity'] = v
              break
            case 'outline-color':
              if (type === 'fill') paint['fill-outline-color'] = v
              if (type === 'line') paint['line-color'] = v
              if (type === 'circle') paint['circle-stroke-color'] = v
              break
            case 'outline-width':
            case 'width':
              if (type === 'line') paint['line-width'] = v
              if (type === 'circle') paint['circle-radius'] = v
              break
            case 'radius':
              if (type === 'circle') paint['circle-radius'] = v
              break
            case 'dasharray':
              if (type === 'line') paint['line-dasharray'] = v
              break
            default:
              // if the developer passed a fully-qualified key for another type,
              // ignore it for this type (keeps Mapbox validation safe)
              break
          }
        })
      }

      // If s.paint already contained fully-qualified keys (e.g., 'fill-color')
      // for other types, include any keys that are appropriate for this type
      if (s?.paint && typeof s.paint === 'object') {
        Object.keys(s.paint).forEach((k) => {
          if (k.startsWith(`${type}-`)) paint[k] = s.paint[k]
        })
      }

      if (Object.keys(paint).length) out.paint = paint

      if (s?.layout && typeof s.layout === 'object') {
        const allowed = allowedLayoutProps[type] || ['visibility']
        out.layout = {}
        Object.keys(s.layout).forEach((k) => {
          if (allowed.includes(k)) {
            out.layout[k] = s.layout[k]
          }
        })
      }

      if (Array.isArray(s?.filter)) {
        out.filter = s.filter
      }

      return out
    }

  // Note: sanitation will be applied per-type inside createAndAdd. Keep a
  // small fallback sanitized object for the exceptional fallback path below.

    // If we couldn't determine a specific type, attempt to infer it from
    // available paint keys, or by sampling features from the vector source.
    let finalLayerType = layerType

    const createAndAdd = (t: string, idSuffix = '') => {
      console.log(`Adding layer ${layer.id} as type ${t}${idSuffix ? ` (suffix: ${idSuffix})` : ''}`)
      const id = idSuffix ? `${layerId}-${idSuffix}` : layerId
      const styled = sanitizeStyle(style, t)
      const def: any = {
        id,
        type: t,
        source: sourceId,
        'source-layer': layer.dataset.layerName || 'default'
      }
      if (styled.paint) def.paint = styled.paint
      if (styled.layout) def.layout = styled.layout
      if (styled.filter) def.filter = styled.filter

      // add a small geometry-type filter when we created multiple type-specific
      // layers so each layer only renders matching geometry. Only add the filter
      // if this layer was generated for 'auto' detection (we'll add suffixes).
      if (idSuffix) {
        if (t === 'fill') def.filter = def.filter || ['==', '$type', 'Polygon']
        if (t === 'line') def.filter = def.filter || ['==', '$type', 'LineString']
        if (t === 'circle') def.filter = def.filter || ['==', '$type', 'Point']
      }

      if (!map.getLayer(id)) {
        map.addLayer(def)
      }
    }

    // If we couldn't confidently detect a single type, add three type-specific
    // layers (fill, line, circle) with suffixes so the same source displays
    // appropriately for whichever geometry is present in the tiles.
    try {
      if (!finalLayerType) {
        // No explicit type provided — render as all three geometry types so
        // points, lines and polygons will all display from the same vector source.
        createAndAdd('fill', 'fill')
        createAndAdd('line', 'line')
        createAndAdd('circle', 'point')
      } else {
        // We have a finalLayerType: add a single layer with the canonical id
        createAndAdd(finalLayerType)
      }
    } catch (err) {
      console.warn('Failed to add type-specific layers, falling back to single layer', err)
      const fallbackType = layerType || 'fill'
      const fallbackSanitized = sanitizeStyle(style, fallbackType)
      const layerDef: any = {
        id: layerId,
        type: fallbackType,
        source: sourceId,
        'source-layer': layer.dataset.layerName || 'default',
      }
      if (fallbackSanitized.paint) layerDef.paint = fallbackSanitized.paint
      if (fallbackSanitized.layout) layerDef.layout = fallbackSanitized.layout
      if (fallbackSanitized.filter) layerDef.filter = fallbackSanitized.filter

      if (!map.getLayer(layerId)) {
        map.addLayer(layerDef)
      }
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
  try {
    // Remove any layers that match the id or are type-specific variants
    const style = (map.getStyle && map.getStyle()) || (map as any).style
    if (style && Array.isArray((style as any).layers)) {
      ;(style as any).layers.forEach((l: any) => {
        if (l && l.id && (l.id === layerId || l.id.startsWith(`${layerId}-`))) {
          if (map.getLayer(l.id)) map.removeLayer(l.id)
        }
      })
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      // try common suffixes defensively
      ;['-fill', '-line', '-point', '-circle'].forEach(suf => {
        const id = `${layerId}${suf}`
        if (map.getLayer(id)) map.removeLayer(id)
      })
    }
  } catch (e) {
    // fallback -- try the direct removals
    if (map.getLayer(layerId)) map.removeLayer(layerId)
    ;['-fill', '-line', '-point', '-circle'].forEach(suf => {
      const id = `${layerId}${suf}`
      if (map.getLayer(id)) map.removeLayer(id)
    })
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId)
  }
}

export const updateLayerStyle = (map: mapboxgl.Map, layerId: string, style: LayerStyle) => {
  // Update style for the canonical layer id and any type-specific variants
  const candidateLayerIds: string[] = []
  try {
    const st = (map.getStyle && map.getStyle()) || (map as any).style
    if (st && Array.isArray((st as any).layers)) {
      ;(st as any).layers.forEach((l: any) => {
        if (l && l.id && (l.id === layerId || l.id.startsWith(`${layerId}-`))) candidateLayerIds.push(l.id)
      })
    }
  } catch (e) {
    // ignore
  }

  // fallback to the direct id if no variants were discovered
  if (candidateLayerIds.length === 0) candidateLayerIds.push(layerId)

  candidateLayerIds.forEach((lid) => {
    if (!map.getLayer(lid)) return

    if (style.paint) {
      Object.keys(style.paint).forEach(property => {
        try {
          map.setPaintProperty(lid, property, style.paint![property])
        } catch (e) {
          console.warn(`Failed to set paint property ${property} on ${lid}:`, e)
        }
      })
    }
    if (style.layout) {
      Object.keys(style.layout).forEach(property => {
        try {
          map.setLayoutProperty(lid, property, style.layout![property])
        } catch (e) {
          console.warn(`Failed to set layout property ${property} on ${lid}:`, e)
        }
      })
    }
  })
}

export const toggleLayerVisibility = (map: mapboxgl.Map, layerId: string, visible: boolean) => {
  // Toggle visibility for canonical and variant layers
  try {
    const st = (map.getStyle && map.getStyle()) || (map as any).style
    if (st && Array.isArray((st as any).layers)) {
      ;(st as any).layers.forEach((l: any) => {
        if (l && l.id && (l.id === layerId || l.id.startsWith(`${layerId}-`))) {
          if (map.getLayer(l.id)) map.setLayoutProperty(l.id, 'visibility', visible ? 'visible' : 'none')
        }
      })
      return
    }
  } catch (e) {
    // ignore and fallback
  }

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
  // Preserve an explicit style.type when present but do not force a default
  // 'fill' type here — that would prevent runtime inference. Still provide
  // sensible paint/layout defaults so the layer renders even without a type.
  const baseStyle: any = layer.style ?? layer.dataset.defaultStyle ?? null

  return {
    id: `layer-${layer.id}`,
    // keep type undefined when not provided so addLayerToMap can infer it
    type: baseStyle?.type,
    paint: baseStyle?.paint ?? {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.6,
      'fill-outline-color': '#1e40af'
    },
    layout: baseStyle?.layout ?? {},
    filter: baseStyle?.filter
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
