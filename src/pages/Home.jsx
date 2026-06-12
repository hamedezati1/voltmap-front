import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, Zap, Plug, Battery, Moon, Gift,
  MapPin, Navigation2, Map, Route, ChevronUp, ChevronDown,
} from 'lucide-react'
import Header from '../components/Header'
import MapView from '../components/MapView'
import StationCard from '../components/StationCard'

const CHIPS = [
  { label: 'همه', value: '', Icon: null },
  { label: 'سریع DC', value: 'DC', Icon: Zap },
  { label: 'معمولی AC', value: 'AC', Icon: Plug },
  { label: 'CCS2', value: 'CCS2', Icon: Battery },
  { label: 'شبانه‌روزی', value: '24h', Icon: Moon },
  { label: 'رایگان', value: 'free', Icon: Gift },
]

/** balanced = پیش‌فرض | map = نقشه بزرگ | list = لیست بزرگ */
const SNAP = {
  balanced: { mapFlex: '0 0 220px', sheetFlex: '1 1 auto' },
  map:      { mapFlex: '1 1 68%', sheetFlex: '0 1 32%' },
  list:     { mapFlex: '0 0 120px', sheetFlex: '1 1 auto' },
}

export default function Home({ stations }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeChip, setActiveChip] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [snap, setSnap] = useState('balanced')
  const sheetRef = useRef(null)
  const dragRef = useRef({ startY: 0, startSnap: 'balanced' })

  const filtered = useMemo(() => {
    return stations.filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !q || s.name.includes(q) || s.city.includes(q) || s.address.includes(q)
      const matchChip = !activeChip ||
        (activeChip === 'CCS2' ? s.connector === 'CCS2' :
        activeChip === '24h' ? s.hours?.includes('۲۴') :
        activeChip === 'free' ? s.price?.includes('رایگان') :
        s.type.includes(activeChip))
      const matchStatus = !statusFilter || s.status === statusFilter
      return matchSearch && matchChip && matchStatus
    })
  }, [stations, search, activeChip, statusFilter])

  const handleMapInteract = useCallback(() => {
    setSnap(prev => (prev === 'list' ? prev : 'map'))
  }, [])

  const cycleSnap = () => {
    setSnap(prev => {
      if (prev === 'balanced') return 'list'
      if (prev === 'list') return 'map'
      return 'balanced'
    })
  }

  const expandList = () => setSnap('list')
  const expandMap = () => setSnap('map')

  const handleTouchStart = e => {
    dragRef.current = { startY: e.touches[0].clientY, startSnap: snap }
  }

  const handleTouchEnd = e => {
    const dy = e.changedTouches[0].clientY - dragRef.current.startY
    if (Math.abs(dy) < 40) return
    // swipe up (finger moves up, dy negative) → expand list
    if (dy < -40) expandList()
    else if (dy > 40) expandMap()
  }

  const { mapFlex, sheetFlex } = SNAP[snap]
  const isMapExpanded = snap === 'map'
  const isListExpanded = snap === 'list'

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" style={{ paddingBottom: 70 }}>
      <Header onAdminClick={() => navigate('/admin')} />

      {/* Search */}
      <div className="bg-white px-4 pt-2 pb-3 flex gap-2 items-center shrink-0">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو برای جایگاه، شهر یا آدرس..."
            className="w-full bg-gray-100 rounded-2xl py-2.5 pr-9 pl-3 text-sm outline-none"
            style={{ fontFamily: 'Vazirmatn', fontSize: 13 }}
          />
        </div>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            background: statusFilter === 'available' ? '#e8faf0' : '#f3f4f6',
            color: statusFilter === 'available' ? '#27AE60' : '#555',
          }}
          onClick={() => setStatusFilter(s => s === 'available' ? '' : 'available')}>
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Chips */}
      <div className="bg-white pb-3 px-4 no-scrollbar flex gap-2 overflow-x-auto shrink-0">
        {CHIPS.map(({ label, value, Icon }) => {
          const active = activeChip === value
          return (
            <button
              key={value}
              onClick={() => setActiveChip(v => v === value ? '' : value)}
              className="chip flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
              style={{
                fontFamily: 'Vazirmatn',
                background: active ? '#2ECC71' : '#fff',
                borderColor: active ? '#2ECC71' : '#e8e8e8',
                color: active ? '#fff' : '#444',
                fontSize: 12,
              }}>
              {Icon && <Icon size={12} />}
              {label}
            </button>
          )
        })}
      </div>

      {/* Map + Bottom sheet */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Map panel */}
        <div
          className="map-panel relative min-h-0 transition-[flex] duration-300 ease-out"
          style={{ flex: mapFlex, minHeight: isListExpanded ? 120 : 160 }}
        >
          <MapView
            stations={filtered}
            onPinClick={s => navigate(`/station/${s.id}`)}
            onMapInteract={handleMapInteract}
          />
          <div className="absolute left-3 bottom-14 z-[1000] flex flex-col gap-2">
            <button className="map-control-btn">
              <MapPin size={18} color="#2ECC71" />
            </button>
            <button className="map-control-btn">
              <Navigation2 size={18} color="#555" />
            </button>
          </div>
          {isMapExpanded && (
            <button
              onClick={() => setSnap('balanced')}
              className="absolute top-3 left-3 z-[1000] flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md backdrop-blur-sm"
              style={{ fontFamily: 'Vazirmatn' }}
            >
              <ChevronDown size={14} />
              بازگشت
            </button>
          )}
        </div>

        {/* Station sheet */}
        <div
          ref={sheetRef}
          className="station-sheet flex flex-col min-h-0 bg-white transition-[flex] duration-300 ease-out"
          style={{
            flex: sheetFlex,
            minHeight: isMapExpanded ? 130 : 180,
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Drag handle */}
          <div
            className="sheet-handle shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
            onClick={cycleSnap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mx-auto mt-2.5 mb-1 h-1 w-10 rounded-full bg-gray-300" />
            <div className="flex items-center justify-center gap-1 pb-1">
              {isListExpanded
                ? <ChevronDown size={14} className="text-gray-400" />
                : <ChevronUp size={14} className="text-gray-400" />
              }
              <span className="text-[10px] text-gray-400" style={{ fontFamily: 'Vazirmatn' }}>
                {isMapExpanded ? 'بالا بکشید برای لیست' : isListExpanded ? 'پایین بکشید برای نقشه' : 'کشیدن برای تغییر اندازه'}
              </span>
            </div>
          </div>

          {/* Sheet header */}
          <div
            className="flex shrink-0 items-center justify-between px-4 pb-2 cursor-pointer"
            onClick={expandList}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
              نزدیک‌ترین جایگاه‌ها
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: '#e8faf0', color: '#27AE60' }}
            >
              {filtered.length} جایگاه
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            <div className="px-4">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400" style={{ fontSize: 14 }}>
                  <Search size={36} className="mx-auto text-gray-300" strokeWidth={1.5} />
                  <p className="mt-2">ایستگاهی یافت نشد</p>
                </div>
              ) : (
                filtered.map(s => <StationCard key={s.id} station={s} />)
              )}
            </div>

            {!isMapExpanded && (
              <div className="mx-4 mb-4 mt-2 rounded-2xl p-4 flex items-center justify-between"
                   style={{ background: '#f0faf5', border: '1px solid #d0f0e0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>مسیر هوشمند</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>بهترین مسیر و توقف‌های شارژ در سفر</div>
                </div>
                <div className="flex items-center gap-2">
                  <Map size={24} className="text-emerald-300" strokeWidth={1.5} />
                  <button
                    onClick={() => navigate('/routes')}
                    className="text-white text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
                    style={{ background: '#2ECC71', fontFamily: 'Vazirmatn', fontSize: 12 }}>
                    <Route size={14} />
                    برنامه‌ریزی
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
