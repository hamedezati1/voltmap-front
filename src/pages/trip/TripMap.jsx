import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRouteCoords, scoreColor } from './tripEngine'

export default function TripMap({
  origin,
  destination,
  result,
  mapSelectMode,
  onPickPoint,
}) {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const layersRef = useRef([])

  useEffect(() => {
    const el = mapRef.current
    if (!el || mapInst.current) return
    const map = L.map(el, {
      center: [35.7219, 51.3347],
      zoom: 6,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)
    mapInst.current = map
    const resize = () => map.invalidateSize()
    requestAnimationFrame(resize)
    const t = setTimeout(resize, 150)
    const obs = new ResizeObserver(resize)
    obs.observe(el)
    return () => {
      clearTimeout(t)
      obs.disconnect()
      map.remove()
      mapInst.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    if (!mapSelectMode) {
      map.off('click')
      map.getContainer().style.cursor = ''
      return undefined
    }
    map.getContainer().style.cursor = 'crosshair'
    const handler = (e) => {
      const { lat, lng } = e.latlng
      onPickPoint({ lat, lng, name: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [mapSelectMode, onPickPoint])

  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    layersRef.current.forEach((l) => l.remove())
    layersRef.current = []

    const addDot = (lat, lng, color, popup) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      const m = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup)
      layersRef.current.push(m)
    }

    if (origin) {
      addDot(origin.lat, origin.lng, '#3498DB', `<div dir="rtl" style="font-family:Vazirmatn;font-size:12px">مبدا: ${origin.name}</div>`)
    }
    if (destination) {
      addDot(destination.lat, destination.lng, '#E74C3C', `<div dir="rtl" style="font-family:Vazirmatn;font-size:12px">مقصد: ${destination.name}</div>`)
    }

    if (origin && destination && !result) {
      const line = L.polyline(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { color: '#2ECC71', weight: 3, opacity: 0.5, dashArray: '6 8' },
      ).addTo(map)
      layersRef.current.push(line)
      map.fitBounds(
        [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [40, 40] },
      )
    }

    if (!result || !origin || !destination) return undefined

    let cancelled = false
    ;(async () => {
      const allPoints = [
        origin,
        ...result.stops.map((s) => ({ lat: s.station.lat, lng: s.station.lng })),
        destination,
      ]
      const coords = await fetchRouteCoords(allPoints)
      if (cancelled || !mapInst.current) return
      const line = L.polyline(coords, {
        color: '#2ECC71',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
      }).addTo(map)
      layersRef.current.push(line)
      result.stops.forEach((stop, i) => {
        const sIcon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;background:${scoreColor(stop.score)};border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        const m = L.marker([stop.station.lat, stop.station.lng], { icon: sIcon })
          .addTo(map)
          .bindPopup(`<div dir="rtl" style="font-family:Vazirmatn;font-size:12px">${stop.station.name}</div>`)
        layersRef.current.push(m)
      })
      map.fitBounds(coords, { padding: [40, 40] })
    })()

    return () => {
      cancelled = true
    }
  }, [origin, destination, result])

  return (
    <div ref={mapRef} className="relative min-h-0 flex-1">
      {mapSelectMode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontFamily: 'Vazirmatn',
            whiteSpace: 'nowrap',
          }}
        >
          {mapSelectMode === 'origin'
            ? '📍 روی نقشه کلیک کنید تا مبدا تعیین شود'
            : '🏁 روی نقشه کلیک کنید تا مقصد تعیین شود'}
        </div>
      )}
    </div>
  )
}
