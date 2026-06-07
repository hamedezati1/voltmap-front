import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, Zap, Clock, DollarSign, Star, Navigation, RefreshCw } from 'lucide-react'
import { addReview, updateStation } from '../data/stations'

const STATUSES = [
  { value:'available', label:'خلوت', color:'#27AE60', bg:'#e8faf0' },
  { value:'busy', label:'شلوغ', color:'#E67E22', bg:'#fef3e2' },
  { value:'waiting', label:'در انتظار', color:'#3498DB', bg:'#EBF5FB' },
  { value:'offline', label:'خاموش', color:'#95a5a6', bg:'#f0f0f0' },
]

export default function StationDetail({ stations, setStations }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const station = stations.find(s => s.id === Number(id))
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewName, setReviewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  if (!station) return (
    <div className="flex items-center justify-center h-screen">
      <p style={{ color:'#888' }}>ایستگاه یافت نشد</p>
    </div>
  )

  const currentStatus = STATUSES.find(s => s.value === station.status) || STATUSES[0]

  const handleStatus = (val) => {
    setStations(updateStation(station.id, { status: val }))
  }

  const handleAddReview = () => {
    if (!reviewText.trim()) return
    const updated = addReview(station.id, { user: reviewName || 'کاربر ناشناس', text: reviewText, rating: reviewRating })
    setStations(updated)
    setReviewText(''); setReviewName(''); setReviewRating(5); setShowForm(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" style={{ paddingBottom:80 }}>
      {/* Hero image */}
      <div style={{ height:200, background:'#e0f2e0', position:'relative', overflow:'hidden' }}>
        {station.image
          ? <img src={station.image} alt={station.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={64} color="#2ECC71" opacity={0.3} />
            </div>
        }
        <button onClick={() => navigate(-1)}
          style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.9)', borderRadius:12, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>
          <ArrowRight size={20} color="#333" />
        </button>
        <div style={{ position:'absolute', bottom:12, right:12, background:currentStatus.bg, color:currentStatus.color, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600 }}>
          {currentStatus.label}
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* Main info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h1 style={{ fontSize:18, fontWeight:700, color:'#1a1a1a', marginBottom:6 }}>{station.name}</h1>
          <p style={{ fontSize:13, color:'#888', marginBottom:12, display:'flex', alignItems:'center', gap:4 }}>
            <MapPin size={13} color="#2ECC71" /> {station.address}
          </p>

          {/* Status selector */}
          <div className="mb-4">
            <p style={{ fontSize:12, color:'#aaa', marginBottom:8 }}>وضعیت ایستگاه:</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => handleStatus(s.value)}
                  style={{ fontSize:12, padding:'5px 14px', borderRadius:20, border:`1.5px solid ${station.status===s.value ? s.color : '#e0e0e0'}`, background: station.status===s.value ? s.bg : '#fff', color: station.status===s.value ? s.color : '#888', fontFamily:'Vazirmatn', cursor:'pointer', fontWeight: station.status===s.value ? 600 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label:'نوع', value:station.type, Icon:Zap },
              { label:'توان', value:`${station.power} kW`, Icon:Zap },
              { label:'پورت‌ها', value:`${station.ports} عدد`, Icon:RefreshCw },
              { label:'کانکتور', value:station.connector, Icon:RefreshCw },
              { label:'ساعات', value:station.hours||'۲۴ ساعته', Icon:Clock },
              { label:'قیمت', value:station.price||'—', Icon:DollarSign },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p style={{ fontSize:11, color:'#aaa', marginBottom:2 }}>{item.label}</p>
                <p style={{ fontSize:12, fontWeight:600, color:'#1a1a1a' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Star size={20} color="#F39C12" fill="#F39C12" />
            <span style={{ fontSize:20, fontWeight:700, color:'#1a1a1a' }}>{station.rating || '—'}</span>
            <span style={{ fontSize:13, color:'#aaa' }}>({station.reviews.length} نظر)</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => window.open(`https://maps.google.com/?q=${station.lat},${station.lng}`)}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background:'#2ECC71', fontFamily:'Vazirmatn' }}>
              <Navigation size={16} /> مسیریابی
            </button>
            <button onClick={() => setShowForm(f=>!f)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2"
              style={{ borderColor:'#e0e0e0', color:'#555', fontFamily:'Vazirmatn', background:'#fff' }}>
              <Star size={16} /> ثبت نظر
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>نظرات کاربران</span>
          </div>
          {showForm && (
            <div className="mb-4 p-3 rounded-xl" style={{ background:'#f9fdf9', border:'1px solid #d0f0e0' }}>
              <input value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder="نام شما (اختیاری)"
                className="w-full rounded-xl p-2 mb-2 text-sm bg-white border border-gray-200 outline-none" style={{ fontFamily:'Vazirmatn' }} />
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="نظر خود را بنویسید..." rows={3}
                className="w-full rounded-xl p-2 mb-2 text-sm bg-white border border-gray-200 outline-none resize-none" style={{ fontFamily:'Vazirmatn' }} />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setReviewRating(n)}>
                      <Star size={20} color="#F39C12" fill={n<=reviewRating?'#F39C12':'none'} />
                    </button>
                  ))}
                </div>
                <button onClick={handleAddReview} className="px-4 py-1.5 rounded-xl text-white text-sm" style={{ background:'#2ECC71', fontFamily:'Vazirmatn' }}>ثبت</button>
              </div>
            </div>
          )}
          {station.reviews.length === 0
            ? <p style={{ fontSize:13, color:'#aaa', textAlign:'center', padding:'12px 0' }}>هنوز نظری ثبت نشده</p>
            : station.reviews.map((r,i) => (
              <div key={i} className="mb-3 p-3 rounded-xl bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{r.user}</span>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n=><Star key={n} size={12} color="#F39C12" fill={n<=r.rating?'#F39C12':'none'} />)}</div>
                </div>
                <p style={{ fontSize:12, color:'#666' }}>{r.text}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
