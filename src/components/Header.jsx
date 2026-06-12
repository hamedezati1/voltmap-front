import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, Zap } from 'lucide-react'

export default function Header({ onAdminClick }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div style={{ background: 'linear-gradient(135deg,#5edc1f,#1a8a40)', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={22} color="#fff" fill="#fff" />
        </div>
        <div>
          <div style={{ fontSize:19, fontWeight:700, color:'#1a1a1a', lineHeight:1.2 }}>ولت<span style={{ color:'#2ECC71' }}>مپ</span></div>
          <div style={{ fontSize:10, color:'#aaa', letterSpacing:1 }}>VoltMap</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onAdminClick} className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500" style={{ fontFamily:'Vazirmatn' }}>ادمین</button>
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center relative">
          <Bell size={18} color="#555" />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full border-2 border-white" style={{ background:'#2ECC71' }}></span>
        </button>
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => navigate('/profile')}>
          <User size={18} color="#555" />
        </button>
      </div>
    </div>
  )
}
