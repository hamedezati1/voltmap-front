import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, FileText, Navigation, MapPinned, Home } from 'lucide-react'


const navItems = [
  { path: '/profile',  Icon: User,       label: 'پروفایل' },
  { path: '/reports',  Icon: FileText,   label: 'گزارش‌ها' },
  { path: '/',         Icon: Home,       label: 'خانه', center: true },
  { path: '/routes',   Icon: MapPinned,  label: 'نقشه' },
  { path: '/trip',     Icon: Navigation, label: 'سفر' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 flex justify-around items-center px-2 z-50 dark:bg-gray-800 dark:border-gray-700"
         style={{ maxWidth:430, margin:'0 auto', paddingBottom:'max(12px,env(safe-area-inset-bottom))', paddingTop:10 }}>
      {navItems.map((item, i) => {
        const { Icon } = item
        const active = item.home ? location.pathname==='/' : location.pathname===item.path
        if (item.center) return (
          <button key={i} onClick={() => navigate('/')} className="flex flex-col items-center -mt-6" style={{ minWidth:52 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'#2ECC71', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(46,204,113,0.4)' }}>
              <Icon size={24} color="#fff" />
            </div>
            <span style={{ fontSize:10, color:'#2ECC71', marginTop:4, fontFamily:'Vazirmatn' }}>خانه</span>
          </button>
        )
        return (
          <button key={i} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1" style={{ minWidth:52 }}>
            <Icon size={20} color={active ? '#2ECC71' : '#ccc'} className={active ? '' : 'dark:opacity-60'} />
            <span style={{ fontSize:10, color: active ? '#2ECC71' : '#aaa', fontFamily:'Vazirmatn' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
