import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Zap, Users, BarChart2, Settings,
  LogOut, Bell, TrendingUp, TrendingDown, Plus, Trash2,
  RefreshCw, Star, Upload, X, CheckCircle, AlertCircle,
  Clock, PowerOff, Search, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'
import { addStation, deleteStation, updateStation } from '../data/stations'

const NAV = [
  { key:'dashboard', Icon:LayoutDashboard, label:'داشبورد' },
  { key:'stations',  Icon:MapPin,          label:'ایستگاه‌ها' },
  { key:'chargers',  Icon:Zap,             label:'شارژرها' },
  { key:'users',     Icon:Users,           label:'کاربران و نظرات' },
  { key:'reports',   Icon:BarChart2,       label:'گزارش‌ها' },
  { key:'settings',  Icon:Settings,        label:'تنظیمات' },
]

const STATUSES = [
  { value:'available', label:'خلوت',      Icon:CheckCircle, color:'#27AE60', bg:'#e8faf0' },
  { value:'busy',      label:'شلوغ',      Icon:AlertCircle, color:'#E67E22', bg:'#fef3e2' },
  { value:'waiting',   label:'در انتظار', Icon:Clock,       color:'#3498DB', bg:'#EBF5FB' },
  { value:'offline',   label:'خاموش',     Icon:PowerOff,    color:'#95a5a6', bg:'#f0f0f0' },
]

const EMPTY_FORM = {
  name:'', city:'', address:'', lat:35.7219, lng:51.3347,
  type:'AC', connector:'Type2', power:22, ports:2,
  status:'available', price:'', hours:'۲۴ ساعته', image:'',
}

function StatCard({ label, value, sub, subUp, Icon, color, bg }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', border:'1px solid #eef0f3', flex:1, minWidth:160 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <span style={{ fontSize:13, color:'#888', fontFamily:'Vazirmatn' }}>{label}</span>
        <div style={{ width:42, height:42, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize:28, fontWeight:700, color:'#1a1a1a', marginBottom:8, letterSpacing:'-0.5px' }}>{value}</div>
      <div style={{ fontSize:12, display:'flex', alignItems:'center', gap:4, color: subUp?'#27AE60':'#e74c3c' }}>
        {subUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
        <span>{sub}</span>
      </div>
    </div>
  )
}

export default function Admin({ stations, setStations }) {
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [addMode, setAddMode] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [imagePreview, setImagePreview] = useState('')

  const SIDEBAR_W = collapsed ? 72 : 240

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.name.trim() || !form.city.trim()) return alert('نام و شهر را وارد کنید')
    setStations(addStation({ ...form, image: imagePreview }))
    setForm(EMPTY_FORM); setImagePreview('')
    setSaved(true); setTimeout(() => { setSaved(false); setAddMode(false) }, 1500)
  }

  const handleDelete = (id) => {
    if (!window.confirm('حذف شود؟')) return
    setStations(deleteStation(id))
  }

  const handleToggleStatus = (id, status) => {
    const next = STATUSES[(STATUSES.findIndex(s => s.value === status) + 1) % STATUSES.length].value
    setStations(updateStation(id, { status: next }))
  }

  const handleImage = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const filtered = useMemo(() =>
    stations.filter(s => !search || s.name.includes(search) || s.city.includes(search))
  , [stations, search])

  const allReviews = useMemo(() =>
    stations.flatMap(s => s.reviews.map(r => ({ ...r, stationName: s.name, stationId: s.id })))
  , [stations])

  const available = stations.filter(s => s.status === 'available').length
  const busy      = stations.filter(s => s.status === 'busy').length
  const waiting   = stations.filter(s => s.status === 'waiting').length
  const offline   = stations.filter(s => s.status === 'offline').length
  const chartData = [120, 145, 130, 190, 175, 220, 180]
  const chartDays = ['۱۸ خرداد','۱۹','۲۰','۲۱','۲۲','۲۳','۲۴']

  const inputStyle = { width:'100%', border:'1px solid #e8eaed', borderRadius:10, padding:'9px 13px', fontSize:13, fontFamily:'Vazirmatn', outline:'none', background:'#fff', color:'#1a1a1a' }
  const selectStyle = { ...inputStyle }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'Vazirmatn', direction:'rtl', background:'#f4f5f7' }}>

      {/* ════ SIDEBAR ════ */}
      <div style={{
        width: SIDEBAR_W, background:'#0f1923', flexShrink:0,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, right:0, height:'100vh',
        overflowY:'auto', overflowX:'hidden',
        transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)', zIndex:100,
        boxShadow:'0 0 40px rgba(0,0,0,0.2)'
      }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent: collapsed?'center':'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2ECC71,#1a7a40)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap size={18} color="#fff" />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', lineHeight:1.2 }}>
                  ولت<span style={{ color:'#2ECC71' }}>مپ</span>
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:1 }}>VoltMap Admin</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center' }}>
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div style={{ padding:'12px 0', display:'flex', justifyContent:'center' }}>
            <button onClick={() => setCollapsed(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.6)', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setActive(key)}
              title={collapsed ? label : ''}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding: collapsed ? '10px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius:12, border:'none', cursor:'pointer',
                width:'100%', textAlign:'right',
                background: active===key ? 'rgba(46,204,113,0.15)' : 'transparent',
                color: active===key ? '#2ECC71' : 'rgba(255,255,255,0.5)',
                fontFamily:'Vazirmatn', fontSize:13,
                fontWeight: active===key ? 600 : 400,
                transition:'all 0.15s',
                position:'relative',
              }}>
              {active===key && <div style={{ position:'absolute', right:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:'#2ECC71' }} />}
              <Icon size={18} style={{ flexShrink:0 }} />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          {/* Admin info */}
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.05)', marginBottom:8 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#2ECC71,#1a7a40)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Users size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>مدیر سیستم</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>admin@voltmap.ir</div>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/')}
            title={collapsed ? 'بازگشت به اپ' : ''}
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:12, border:'none', cursor:'pointer',
              width:'100%', background:'transparent',
              color:'rgba(255,255,255,0.35)', fontFamily:'Vazirmatn', fontSize:13,
              transition:'all 0.15s'
            }}>
            <LogOut size={17} />
            {!collapsed && 'بازگشت به اپ'}
          </button>
        </div>
      </div>

      {/* ════ MAIN ════ */}
      <div style={{ flex:1, marginRight: SIDEBAR_W, transition:'margin-right 0.25s cubic-bezier(0.4,0,0.2,1)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div style={{ background:'#fff', borderBottom:'1px solid #eef0f3', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color:'#1a1a1a', letterSpacing:'-0.3px' }}>
              {NAV.find(n => n.key === active)?.label}
            </div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>نمای کلی سیستم</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button style={{ width:40, height:40, borderRadius:11, border:'1px solid #eef0f3', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
              <Bell size={18} color="#555" />
              <span style={{ position:'absolute', top:8, right:9, width:7, height:7, background:'#2ECC71', borderRadius:'50%', border:'2px solid #fff' }}></span>
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f4f5f7', borderRadius:12, padding:'8px 14px' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#2ECC71,#1a7a40)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Users size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>مدیر سیستم</div>
                <div style={{ fontSize:11, color:'#aaa' }}>Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:28, flex:1 }}>

          {/* ── DASHBOARD ── */}
          {active === 'dashboard' && <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard label="تعداد ایستگاه‌ها" value={stations.length} sub="۳.۱٪ نسبت به ماه قبل" subUp Icon={MapPin} color="#2ECC71" bg="#e8faf0" />
              <StatCard label="ایستگاه‌های خلوت" value={available} sub="در دسترس" subUp Icon={CheckCircle} color="#27AE60" bg="#d5f0e0" />
              <StatCard label="ایستگاه‌های شلوغ" value={busy} sub="مشغول" subUp={false} Icon={AlertCircle} color="#E67E22" bg="#fef3e2" />
              <StatCard label="نظرات کاربران" value={allReviews.length} sub="۸.۵٪ نسبت به ماه قبل" subUp Icon={Star} color="#F39C12" bg="#fef9e7" />
            </div>

            {/* Two cols */}
            <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, marginBottom:24 }}>
              {/* Recent stations */}
              <div style={{ background:'#fff', borderRadius:16, padding:22, border:'1px solid #eef0f3' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>آخرین ایستگاه‌های ثبت شده</span>
                  <button onClick={() => setActive('stations')} style={{ fontSize:12, color:'#2ECC71', background:'none', border:'none', cursor:'pointer', fontFamily:'Vazirmatn' }}>مشاهده همه</button>
                </div>
                {stations.slice(0, 5).map(s => {
                  const st = STATUSES.find(x => x.value === s.status) || STATUSES[0]
                  return (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14, paddingBottom:14, marginBottom:14, borderBottom:'1px solid #f5f7fa' }}>
                      <div style={{ width:50, height:50, borderRadius:12, overflow:'hidden', background:'#e8faf0', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {s.image ? <img src={s.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : <Zap size={22} color="#2ECC71" />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1a1a1a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                        <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{s.city} · {s.type} · {s.power}kW</div>
                      </div>
                      <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600, flexShrink:0 }}>{st.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Donut chart */}
              <div style={{ background:'#fff', borderRadius:16, padding:22, border:'1px solid #eef0f3' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:20 }}>وضعیت شارژرها</div>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                  <div style={{ position:'relative', width:140, height:140 }}>
                    <svg viewBox="0 0 36 36" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="3.5"/>
                      {stations.length > 0 && <>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2ECC71" strokeWidth="3.5"
                          strokeDasharray={`${(available/stations.length)*100} 100`} strokeLinecap="round"/>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F39C12" strokeWidth="3.5"
                          strokeDasharray={`${(busy/stations.length)*100} 100`}
                          strokeDashoffset={`${-((available/stations.length)*100)}`} strokeLinecap="round"/>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3498DB" strokeWidth="3.5"
                          strokeDasharray={`${(waiting/stations.length)*100} 100`}
                          strokeDashoffset={`${-(((available+busy)/stations.length)*100)}`} strokeLinecap="round"/>
                      </>}
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ fontSize:24, fontWeight:700, color:'#1a1a1a' }}>{stations.length}</div>
                      <div style={{ fontSize:11, color:'#aaa' }}>جمع کل</div>
                    </div>
                  </div>
                </div>
                {STATUSES.map(s => {
                  const count = stations.filter(st => st.status === s.value).length
                  const pct = stations.length ? Math.round((count/stations.length)*100) : 0
                  return (
                    <div key={s.value} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }}></div>
                        <span style={{ fontSize:13, color:'#555' }}>{s.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color:'#aaa' }}>{pct}٪</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a', minWidth:20, textAlign:'left' }}>{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chart + Reviews */}
            <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>
              <div style={{ background:'#fff', borderRadius:16, padding:22, border:'1px solid #eef0f3' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:20 }}>نمودار استفاده (۷ روز اخیر)</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:140 }}>
                  {chartData.map((v, i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <div style={{ width:'100%', background:'linear-gradient(180deg,#2ECC71,#1a8a40)', borderRadius:6, height:`${(v/250)*130}px`, minHeight:4 }}></div>
                      <span style={{ fontSize:10, color:'#aaa', whiteSpace:'nowrap' }}>{chartDays[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'#fff', borderRadius:16, padding:22, border:'1px solid #eef0f3' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>گزارش‌های اخیر</span>
                  <button onClick={() => setActive('users')} style={{ fontSize:12, color:'#2ECC71', background:'none', border:'none', cursor:'pointer', fontFamily:'Vazirmatn' }}>همه</button>
                </div>
                {allReviews.length === 0
                  ? <p style={{ color:'#aaa', fontSize:13, textAlign:'center', padding:'20px 0' }}>هنوز نظری ثبت نشده</p>
                  : allReviews.slice(0, 4).map((r, i) => (
                    <div key={i} style={{ display:'flex', gap:12, paddingBottom:12, marginBottom:12, borderBottom:'1px solid #f5f7fa' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'#EBF5FB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Users size={15} color="#3498DB" />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{r.user}</span>
                          <div style={{ display:'flex', gap:1 }}>{[1,2,3,4,5].map(n=><Star key={n} size={11} color="#F39C12" fill={n<=r.rating?'#F39C12':'none'}/>)}</div>
                        </div>
                        <p style={{ fontSize:12, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.text}</p>
                        <p style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{r.stationName}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </>}

          {/* ── STATIONS ── */}
          {active === 'stations' && <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:16 }}>
              <div style={{ position:'relative' }}>
                <Search size={15} color="#aaa" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی ایستگاه..."
                  style={{ ...inputStyle, paddingRight:36, width:260, background:'#fff' }} />
              </div>
              <button onClick={() => setAddMode(m => !m)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'#2ECC71', color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Vazirmatn', boxShadow:'0 4px 12px rgba(46,204,113,0.3)' }}>
                <Plus size={16} /> افزودن ایستگاه جدید
              </button>
            </div>

            {/* Add form */}
            {addMode && (
              <div style={{ background:'#fff', borderRadius:16, padding:28, border:'1px solid #eef0f3', marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <span style={{ fontSize:16, fontWeight:700, color:'#1a1a1a' }}>ایستگاه جدید</span>
                  <button onClick={() => setAddMode(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} color="#aaa" /></button>
                </div>

                {/* Image upload */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:8, fontWeight:500 }}>تصویر ایستگاه</label>
                  <div style={{ border:'2px dashed #e0e0e0', borderRadius:14, padding:20, textAlign:'center', cursor:'pointer', position:'relative', background:'#fafafa', transition:'border-color 0.2s' }}>
                    {imagePreview
                      ? <div style={{ position:'relative', display:'inline-block' }}>
                          <img src={imagePreview} style={{ height:120, borderRadius:10, objectFit:'cover' }} alt="" />
                          <button onClick={() => setImagePreview('')}
                            style={{ position:'absolute', top:-8, left:-8, background:'#e74c3c', border:'none', borderRadius:'50%', width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <X size={12} color="#fff" />
                          </button>
                        </div>
                      : <>
                          <Upload size={32} color="#ccc" style={{ margin:'0 auto 10px' }} />
                          <p style={{ fontSize:13, color:'#aaa' }}>کلیک کنید یا عکس را اینجا بکشید</p>
                          <p style={{ fontSize:11, color:'#ccc', marginTop:4 }}>PNG، JPG تا ۵ مگابایت</p>
                        </>
                    }
                    <input type="file" accept="image/*" onChange={handleImage}
                      style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:14, marginBottom:14 }}>
                  {[['نام ایستگاه *','name','text'],['شهر *','city','text'],['آدرس کامل','address','text']].map(([label,key])=>(
                    <div key={key}>
                      <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>{label}</label>
                      <input value={form[key]} onChange={e=>f(key,e.target.value)} style={inputStyle} />
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>نوع</label>
                    <select value={form.type} onChange={e=>f('type',e.target.value)} style={selectStyle}>
                      {['AC','DC','AC/DC'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>کانکتور</label>
                    <select value={form.connector} onChange={e=>f('connector',e.target.value)} style={selectStyle}>
                      {['Type2','CCS2','CHAdeMO'].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>توان (kW)</label>
                    <input type="number" value={form.power} onChange={e=>f('power',Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>پورت</label>
                    <input type="number" value={form.ports} onChange={e=>f('ports',Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>قیمت</label>
                    <input value={form.price} onChange={e=>f('price',e.target.value)} placeholder="۱۰۰۰ تومان/kWh" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>ساعات</label>
                    <input value={form.hours} onChange={e=>f('hours',e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>عرض جغرافیایی</label>
                    <input type="number" step="0.0001" value={form.lat} onChange={e=>f('lat',Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>طول جغرافیایی</label>
                    <input type="number" step="0.0001" value={form.lng} onChange={e=>f('lng',Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#888', display:'block', marginBottom:6 }}>وضعیت اولیه</label>
                    <select value={form.status} onChange={e=>f('status',e.target.value)} style={selectStyle}>
                      {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {saved && (
                  <div style={{ background:'#e8faf0', color:'#27AE60', padding:12, borderRadius:12, textAlign:'center', fontSize:13, marginBottom:14, fontWeight:600 }}>
                    ✅ ایستگاه با موفقیت اضافه شد!
                  </div>
                )}
                <button onClick={handleAdd}
                  style={{ background:'#2ECC71', color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Vazirmatn', boxShadow:'0 4px 14px rgba(46,204,113,0.3)' }}>
                  ⚡ ثبت ایستگاه
                </button>
              </div>
            )}

            {/* Table */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #eef0f3', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fb' }}>
                    {['','نام ایستگاه','شهر','نوع','کانکتور','توان','پورت','وضعیت','امتیاز','عملیات'].map((h,i)=>(
                      <th key={i} style={{ padding:'13px 16px', fontSize:12, color:'#888', fontWeight:600, textAlign:'right', fontFamily:'Vazirmatn', borderBottom:'1px solid #eef0f3' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const st = STATUSES.find(x => x.value === s.status) || STATUSES[0]
                    return (
                      <tr key={s.id} style={{ borderTop:'1px solid #f5f7fa', transition:'background 0.1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ width:46, height:46, borderRadius:11, overflow:'hidden', background:'#e8faf0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {s.image ? <img src={s.image} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : <Zap size={20} color="#2ECC71" />}
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{s.name}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.city}</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:11, background:'#e8faf0', color:'#27AE60', padding:'3px 10px', borderRadius:8, fontWeight:500 }}>{s.type}</span></td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.connector}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.power}kW</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.ports}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <button onClick={() => handleToggleStatus(s.id, s.status)}
                            style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'Vazirmatn' }}>
                            {st.label}
                          </button>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Star size={13} color="#F39C12" fill={s.rating?'#F39C12':'none'} />
                            <span style={{ fontSize:13, color:'#1a1a1a', fontWeight:600 }}>{s.rating||'—'}</span>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <button onClick={() => handleDelete(s.id)}
                            style={{ background:'#FCEBEB', border:'none', borderRadius:9, padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                            <Trash2 size={14} color="#A32D2D" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign:'center', padding:48, color:'#aaa' }}>
                  <Search size={36} color="#ddd" style={{ margin:'0 auto 12px' }} />
                  <p style={{ fontSize:14 }}>نتیجه‌ای یافت نشد</p>
                </div>
              )}
            </div>
          </>}

          {/* ── USERS & REVIEWS ── */}
          {active === 'users' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              <StatCard label="کل نظرات" value={allReviews.length} sub="نظر ثبت شده" subUp Icon={Star} color="#F39C12" bg="#fef9e7" />
              <StatCard label="میانگین امتیاز" value={allReviews.length ? (allReviews.reduce((a,r)=>a+r.rating,0)/allReviews.length).toFixed(1) : '—'} sub="از ۵" subUp Icon={Star} color="#2ECC71" bg="#e8faf0" />
              <StatCard label="ایستگاه‌های بدون نظر" value={stations.filter(s=>s.reviews.length===0).length} sub="نیاز به توجه" subUp={false} Icon={AlertCircle} color="#E67E22" bg="#fef3e2" />
            </div>

            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #eef0f3', overflow:'hidden' }}>
              <div style={{ padding:'18px 22px', borderBottom:'1px solid #f5f7fa', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>تمام نظرات کاربران</span>
                <span style={{ fontSize:12, color:'#aaa' }}>{allReviews.length} نظر</span>
              </div>
              <div style={{ padding:22 }}>
                {allReviews.length === 0
                  ? <p style={{ color:'#aaa', fontSize:14, textAlign:'center', padding:'40px 0' }}>هنوز هیچ نظری ثبت نشده</p>
                  : allReviews.map((r, i) => (
                    <div key={i} style={{ display:'flex', gap:16, paddingBottom:18, marginBottom:18, borderBottom:'1px solid #f5f7fa' }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'#EBF5FB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Users size={18} color="#3498DB" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#1a1a1a' }}>{r.user}</span>
                          <div style={{ display:'flex', gap:2 }}>
                            {[1,2,3,4,5].map(n=><Star key={n} size={14} color="#F39C12" fill={n<=r.rating?'#F39C12':'none'} />)}
                          </div>
                        </div>
                        <p style={{ fontSize:13, color:'#555', marginBottom:6, lineHeight:1.6 }}>{r.text}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <MapPin size={12} color="#2ECC71" />
                          <span style={{ fontSize:12, color:'#aaa' }}>{r.stationName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </>}

          {/* ── REPORTS ── */}
          {active === 'reports' && <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              <StatCard label="کل ایستگاه‌ها" value={stations.length} sub="ثبت شده" subUp Icon={MapPin} color="#2ECC71" bg="#e8faf0" />
              <StatCard label="خلوت" value={available} sub="در دسترس" subUp Icon={CheckCircle} color="#27AE60" bg="#d5f0e0" />
              <StatCard label="شلوغ" value={busy} sub="مشغول" subUp={false} Icon={AlertCircle} color="#E67E22" bg="#fef3e2" />
              <StatCard label="خاموش" value={offline} sub="غیرفعال" subUp={false} Icon={PowerOff} color="#95a5a6" bg="#f0f0f0" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
              <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #eef0f3' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:20 }}>نمودار استفاده (۷ روز اخیر)</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:12, height:160 }}>
                  {chartData.map((v, i) => (
                    <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      <div style={{ fontSize:11, color:'#888', fontWeight:600 }}>{v}</div>
                      <div style={{ width:'100%', background:'linear-gradient(180deg,#2ECC71,#1a8a40)', borderRadius:'6px 6px 3px 3px', height:`${(v/250)*130}px` }}></div>
                      <span style={{ fontSize:10, color:'#aaa' }}>{chartDays[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #eef0f3' }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:16 }}>توزیع نوع شارژر</div>
                {['AC','DC','AC/DC'].map(type => {
                  const count = stations.filter(s=>s.type===type).length
                  const pct = stations.length ? Math.round((count/stations.length)*100) : 0
                  const colors = { AC:'#F39C12', DC:'#3498DB', 'AC/DC':'#2ECC71' }
                  return (
                    <div key={type} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:13, color:'#555' }}>{type}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{count} ({pct}٪)</span>
                      </div>
                      <div style={{ height:8, borderRadius:4, background:'#f0f0f0', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:4, background:colors[type], width:`${pct}%`, transition:'width 0.5s' }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #eef0f3', overflow:'hidden' }}>
              <div style={{ padding:'16px 22px', borderBottom:'1px solid #f5f7fa' }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#1a1a1a' }}>آمار تفصیلی همه ایستگاه‌ها</span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fb' }}>
                    {['ایستگاه','شهر','نوع','توان','پورت‌ها','وضعیت','نظرات','امتیاز'].map((h,i)=>(
                      <th key={i} style={{ padding:'12px 16px', fontSize:12, color:'#888', fontWeight:600, textAlign:'right', fontFamily:'Vazirmatn', borderBottom:'1px solid #eef0f3' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stations.map(s => {
                    const st = STATUSES.find(x=>x.value===s.status)||STATUSES[0]
                    return (
                      <tr key={s.id} style={{ borderTop:'1px solid #f5f7fa' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{s.name}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.city}</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:11, background:'#e8faf0', color:'#27AE60', padding:'3px 10px', borderRadius:8 }}>{s.type}</span></td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.power}kW</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.ports}</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span></td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#666' }}>{s.reviews.length}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Star size={13} color="#F39C12" fill={s.rating?'#F39C12':'none'} />
                            <span style={{ fontSize:13, fontWeight:600, color:'#1a1a1a' }}>{s.rating||'—'}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>}

          {/* ── OTHER ── */}
          {(active==='chargers'||active==='settings') && (
            <div style={{ background:'#fff', borderRadius:16, padding:60, textAlign:'center', border:'1px solid #eef0f3' }}>
              <Settings size={52} color="#ddd" style={{ margin:'0 auto 18px' }} />
              <h2 style={{ fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:10 }}>به زودی اضافه می‌شود</h2>
              <p style={{ fontSize:14, color:'#aaa' }}>این بخش در حال توسعه است</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
