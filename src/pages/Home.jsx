import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MapView from '../components/MapView'
import StationCard from '../components/StationCard'

const CHIPS = [
  { label: 'همه', value: '' },
  { label: '⚡ سریع DC', value: 'DC' },
  { label: '🔌 معمولی AC', value: 'AC' },
  { label: '🔋 CCS2', value: 'CCS2' },
  { label: '🌙 شبانه‌روزی', value: '24h' },
  { label: '🎁 رایگان', value: 'free' },
]

export default function Home({ stations, setStations }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeChip, setActiveChip] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ paddingBottom: 70 }}>
      <Header onAdminClick={() => navigate('/admin')} />

      {/* Search */}
      <div className="bg-white px-4 pt-2 pb-3 flex gap-2 items-center">
        <div className="flex-1 relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو برای جایگاه، شهر یا آدرس..."
            className="w-full bg-gray-100 rounded-2xl py-2.5 pr-9 pl-3 text-sm outline-none"
            style={{ fontFamily: 'Vazirmatn', fontSize: 13 }}
          />
        </div>
        <button
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"
          onClick={() => setStatusFilter(s => s === 'available' ? '' : 'available')}>
          <span style={{ fontSize: 18 }}>⚙️</span>
        </button>
      </div>

      {/* Chips */}
      <div className="bg-white pb-3 px-4 no-scrollbar flex gap-2 overflow-x-auto">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setActiveChip(v => v === chip.value ? '' : chip.value)}
            className="chip flex-shrink-0 px-3 py-1.5 rounded-full border text-xs"
            style={{
              fontFamily: 'Vazirmatn',
              background: activeChip === chip.value ? '#2ECC71' : '#fff',
              borderColor: activeChip === chip.value ? '#2ECC71' : '#e8e8e8',
              color: activeChip === chip.value ? '#fff' : '#444',
              fontSize: 12,
            }}>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ height: 220, position: 'relative', flexShrink: 0 }}>
        <MapView stations={filtered} onPinClick={s => navigate(`/station/${s.id}`)} />
        {/* Map controls */}
        <div style={{ position: 'absolute', left: 12, bottom: 54, zIndex: 1000 }}>
          <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <span style={{ fontSize: 18 }}>📍</span>
          </button>
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 10, zIndex: 1000 }}>
          <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <span style={{ fontSize: 18 }}>🧭</span>
          </button>
        </div>
      </div>

      {/* Station list */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Header */}
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
            نزدیک‌ترین جایگاه‌ها
          </span>
          <span style={{ fontSize: 12, color: '#2ECC71', cursor: 'pointer' }}>
            {filtered.length} جایگاه
          </span>
        </div>

        <div className="px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400" style={{ fontSize: 14 }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <p className="mt-2">ایستگاهی یافت نشد</p>
            </div>
          ) : (
            filtered.map(s => <StationCard key={s.id} station={s} />)
          )}
        </div>

        {/* Smart route banner */}
        <div className="mx-4 mb-4 mt-3 rounded-2xl p-4 flex items-center justify-between"
             style={{ background: '#f0faf5', border: '1px solid #d0f0e0' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>مسیر هوشمند</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>بهترین مسیر و توقف‌های شارژ در سفر</div>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 28, opacity: 0.3 }}>🗺️</span>
            <button
              onClick={() => navigate('/routes')}
              className="text-white text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: '#2ECC71', fontFamily: 'Vazirmatn', fontSize: 13 }}>
              برنامه‌ریزی مسیر
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
