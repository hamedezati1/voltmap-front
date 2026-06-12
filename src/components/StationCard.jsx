import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Zap, Navigation, Plug } from 'lucide-react'

const typeColors = {
  DC: { bg:'#E6F1FB', text:'#0C447C' },
  AC: { bg:'#FAEEDA', text:'#633806' },
  'AC/DC': { bg:'#EAF3DE', text:'#3B6D11' },
}

export default function StationCard({ station }) {
  const navigate = useNavigate()
  const isAvailable = station.status === 'available'
  const tc = typeColors[station.type] || typeColors.AC

  return (
    <div className="station-card flex gap-3 py-3 px-1 border-b border-gray-50 cursor-pointer active:bg-gray-50"
         onClick={() => navigate(`/station/${station.id}`)}>
      <div style={{ width:72, height:72, borderRadius:14, flexShrink:0, overflow:'hidden', background: isAvailable?'#e0f2e0':'#fef3e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {station.image
          ? <img src={station.image} alt={station.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <Zap size={28} color={isAvailable?'#2ECC71':'#F39C12'} />
        }
      </div>
      <div style={{ flex:1 }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span style={{ fontSize:14, fontWeight:600, color:'#1a1a1a' }}>{station.name}</span>
          <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500, flexShrink:0, background:isAvailable?'#e8faf0':'#fef3e2', color:isAvailable?'#27AE60':'#E67E22' }}>
            {isAvailable ? 'خالی' : 'شلوغ'}
          </span>
        </div>
        <div style={{ fontSize:12, color:'#888', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
          <MapPin size={12} color="#2ECC71" />
          {station.city} · {station.address.substring(0,35)}...
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize:11, background:tc.bg, color:tc.text, borderRadius:8, padding:'2px 8px', display:'flex', alignItems:'center', gap:3 }}>
            <Plug size={10} />{station.connector}
          </span>
          <span style={{ fontSize:11, background:'#f5f5f5', color:'#555', borderRadius:8, padding:'2px 8px', display:'flex', alignItems:'center', gap:3 }}>
            <Zap size={10} color="#2ECC71" />{station.type}
          </span>
          <span style={{ fontSize:11, background:'#f5f5f5', color:'#555', borderRadius:8, padding:'2px 8px' }}>
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
