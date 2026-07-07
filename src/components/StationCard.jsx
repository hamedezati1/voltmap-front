import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Navigation, Plug, PowerOff } from 'lucide-react'

const typeColors = {
  DC: { bg:'#E6F1FB', text:'#0C447C' },
  AC: { bg:'#FAEEDA', text:'#633806' },
  'AC/DC': { bg:'#EAF3DE', text:'#3B6D11' },
}

// رنگ و متن هر وضعیت
const STATUS_CONFIG = {
  available: { bg:'#e8faf0', color:'#27AE60', label:'خالی',      iconBg:'#e0f2e0', zapColor:'#2ECC71' },
  busy:      { bg:'#fef3e2', color:'#E67E22', label:'شلوغ',      iconBg:'#fef3e2', zapColor:'#F39C12' },
  waiting:   { bg:'#EBF5FB', color:'#2980B9', label:'در انتظار', iconBg:'#EBF5FB', zapColor:'#3498DB' },
  offline:   { bg:'#f0f0f0', color:'#95a5a6', label:'خاموش',     iconBg:'#f0f0f0', zapColor:'#95a5a6' },
}

export default function StationCard({ station }) {
  const navigate = useNavigate()
  const st = STATUS_CONFIG[station.status] || STATUS_CONFIG.available
  const tc = typeColors[station.type] || typeColors.AC
  const isOffline = station.status === 'offline'

  return (
    <div className={`station-card flex gap-3 py-3 px-1 border-b border-gray-50 cursor-pointer active:bg-gray-50 dark:border-gray-700 ${isOffline ? 'opacity-70' : ''}`}
         onClick={() => navigate(`/station/${station.id}`)}>
      <div style={{ width:72, height:72, borderRadius:14, flexShrink:0, overflow:'hidden', background: st.iconBg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        {station.image
          ? <img src={station.image} alt={station.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter: isOffline ? 'grayscale(80%)' : 'none' }} />
          : isOffline
            ? <PowerOff size={28} color="#95a5a6" />
            : <Zap size={28} color={st.zapColor} />
        }
      </div>
      <div style={{ flex:1 }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="dark:!text-gray-100" style={{ fontSize:14, fontWeight:600, color:'#1a1a1a' }}>{station.name}</span>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500, flexShrink:0, background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>
        <div className="dark:!text-gray-400" style={{ fontSize:12, color:'#888', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
          <MapPin size={12} color="#2ECC71" />
          {station.city} · {station.address.substring(0,35)}...
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize:11, background:tc.bg, color:tc.text, borderRadius:8, padding:'2px 8px', display:'flex', alignItems:'center', gap:3 }}>
            <Plug size={10} />{station.connector}
          </span>
          <span className="dark:!bg-gray-700 dark:!text-gray-300" style={{ fontSize:11, background:'#f5f5f5', color:'#555', borderRadius:8, padding:'2px 8px', display:'flex', alignItems:'center', gap:3 }}>
            <Zap size={10} color="#2ECC71" />{station.type}
          </span>
          <span className="dark:!bg-gray-700 dark:!text-gray-300" style={{ fontSize:11, background:'#f5f5f5', color:'#555', borderRadius:8, padding:'2px 8px' }}>
            {station.power}kW
          </span>
          <span style={{ fontSize:11, color:'#2ECC71', marginRight:'auto', display:'flex', alignItems:'center', gap:3 }}>
            <Navigation size={10} />{(Math.random()*5+0.5).toFixed(1)} کیلومتر
          </span>
        </div>
      </div>
    </div>
  )
}
