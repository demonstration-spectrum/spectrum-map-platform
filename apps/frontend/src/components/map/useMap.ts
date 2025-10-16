import { ref, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import { createMap, addLayerToMap } from '@/utils/mapbox'
import type { Ref } from 'vue'
import type { Layer } from '@/types'

export const useMap = (mapContainer: Ref<HTMLElement | undefined>, mapData: Ref<any | null>, layers: Ref<Layer[]>) => {
  const mapboxMap = ref<mapboxgl.Map | null>(null)
  const selectedFeature = ref<any | null>(null)
  const popupRef = ref<mapboxgl.Popup | null>(null)

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
      if (!response.ok) return null
      const data = await response.json()
      const feature = Array.isArray(data?.features) && data.features.length ? data.features[0] : null
      if (feature && feature.geometry) {
        return { type: 'Feature', geometry: feature.geometry, properties: feature.properties || {} }
      }
    } catch (err) {
      console.warn('WFS fetch failed', err)
    }
    return null
  }

  const initializeMap = (containerEl: HTMLElement, opts: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number } = {}) => {
    if (!containerEl) return

    mapboxMap.value = createMap(containerEl, {
      center: opts.center || [0, 0],
      zoom: opts.zoom ?? 2,
      bearing: opts.bearing ?? 0,
      pitch: opts.pitch ?? 0
    })

    // Add layers that are present in the layers array
    layers.value.forEach(layer => {
      if (layer.dataset.workspaceName && layer.dataset.layerName && mapboxMap.value) {
        addLayerToMap(mapboxMap.value, layer, import.meta.env.VITE_GEOSERVER_URL)
      }
    })

    // Ensure selected feature source and highlight layers exist after style loads
    mapboxMap.value.on('styledata', () => {
      const m = mapboxMap.value!
      if (!m.getSource('selected-feature')) {
        m.addSource('selected-feature', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

        if (!m.getLayer('selected-fill')) {
          m.addLayer({
            id: 'selected-fill',
            type: 'fill',
            source: 'selected-feature',
            paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.25 },
            filter: ['==', '$type', 'Polygon']
          })
        }

        if (!m.getLayer('selected-outline')) {
          m.addLayer({
            id: 'selected-outline',
            type: 'line',
            source: 'selected-feature',
            paint: { 'line-color': '#b45309', 'line-width': 3 }
          })
        }

        if (!m.getLayer('selected-point')) {
          m.addLayer({
            id: 'selected-point',
            type: 'circle',
            source: 'selected-feature',
            paint: {
              'circle-color': '#f59e0b',
              'circle-radius': 8,
              'circle-stroke-color': '#7c2d12',
              'circle-stroke-width': 2
            },
            filter: ['==', '$type', 'Point']
          })
        }
      }
    })

    // Click handler to query features and set selectedFeature
    mapboxMap.value.on('click', async (e) => {
      const m = mapboxMap.value!
      const candidateLayerIds = layers.value.map(l => `layer-${l.id}`)
      let features: mapboxgl.MapboxGeoJSONFeature[] = []
      try {
        features = candidateLayerIds.length ? m.queryRenderedFeatures(e.point, { layers: candidateLayerIds }) : m.queryRenderedFeatures(e.point)
      } catch (err) {
        features = []
      }

      if (!features || features.length === 0) {
        selectedFeature.value = null
        const src = m.getSource('selected-feature') as mapboxgl.GeoJSONSource | undefined
        if (src) (src as any).setData({ type: 'FeatureCollection', features: [] })
        if (popupRef.value) { popupRef.value.remove(); popupRef.value = null }
        return
      }

      const f = features[0]
      const defaultFeature = { type: 'Feature', geometry: f.geometry as any, properties: f.properties || {} }
      let geojsonFeature = defaultFeature

      const layerIdFull = (f.layer && (f.layer as any).id) || null
      let layerObj: Layer | undefined
      if (layerIdFull) {
        const match = String(layerIdFull).match(/^layer-(.+)$/)
        if (match) {
          layerObj = layers.value.find(l => String(l.id) === String(match[1]))
        }
      }

      if (layerObj?.dataset?.workspaceName && layerObj.dataset.layerName) {
        const publicIdValue = (f.properties as any)?.public_id || (f.properties as any)?.publicId || (f.properties as any)?.gid
        const wfsFeature = await fetchFeatureFromWfs(layerObj.dataset.workspaceName, layerObj.dataset.layerName, publicIdValue)
        if (wfsFeature) geojsonFeature = wfsFeature
      }

      selectedFeature.value = geojsonFeature
      const src = m.getSource('selected-feature') as mapboxgl.GeoJSONSource | undefined
      if (src) (src as any).setData({ type: 'FeatureCollection', features: [geojsonFeature] })

      // Build simple popup HTML
      const props = geojsonFeature.properties || {}
      const rows = Object.keys(props || {}).map(k => `<div style="margin-bottom:4px"><div style='font-size:11px;color:#555'>${k}</div><div style='font-size:13px;color:#111'>${String(props[k])}</div></div>`).join('')
      const popupHtml = rows

      const popupPos: mapboxgl.LngLat = e.lngLat
      if (popupRef.value) {
        popupRef.value.setLngLat(popupPos).setHTML(popupHtml)
      } else {
        popupRef.value = new mapboxgl.Popup({ closeOnClick: true, closeButton: false }).setLngLat(popupPos).setHTML(popupHtml).addTo(m)
      }
    })

    return mapboxMap.value
  }

  onUnmounted(() => {
    if (mapboxMap.value) mapboxMap.value.remove()
  })

  return {
    mapboxMap,
    selectedFeature,
    popupRef,
    initializeMap,
    fetchFeatureFromWfs
  }
}
