// TODO: وقتی به دیتابیس وصل شد، ایستگاه‌ها از API گرفته می‌شن: GET /stations?city=...&type=...
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, SlidersHorizontal, Zap, Moon, Map, Route,
  ChevronUp, ChevronDown, MapPin, Navigation2, X, Bell
} from "lucide-react";
import Header from "../components/Header";
import MapView from "../components/MapView";
import StationCard from "../components/StationCard";
import Type2Icon from "../icons/Type2Icon";
import Ccs2Icon from "../icons/CCS2Icon";
import ACIcon from "../icons/ACIcon";
import DCIcon from "../icons/DCIcon";
import { fetchNews } from "../api";

// شهرهای موجود با مختصات مرکزی برای zoom
// TODO: این لیست باید از API گرفته شه: GET /cities
const CITIES = [
  { name: 'همه شهرها', lat: 32.5, lng: 53.5, zoom: 6 },
  { name: 'تهران',     lat: 35.6892, lng: 51.3890, zoom: 12 },
  { name: 'مشهد',      lat: 36.2972, lng: 59.6067, zoom: 12 },
  { name: 'شیراز',     lat: 29.5918, lng: 52.5837, zoom: 12 },
]

const CHIPS = [
  { label: "همه",       value: "",     Icon: null },
  { label: "سریع DC",   value: "DC",   Icon: DCIcon },
  { label: "معمولی AC", value: "AC",   Icon: ACIcon },
  { label: "CCS2",      value: "CCS2", Icon: Ccs2Icon },
  { label: "Type 2",    value: "TYPE2",Icon: Type2Icon },
  { label: "شبانه‌روزی",value: "24h",  Icon: Moon },
];

const SNAP = {
  balanced: { mapFlex: "0 0 220px", sheetFlex: "1 1 auto" },
  map:      { mapFlex: "1 1 68%",   sheetFlex: "0 1 32%" },
  list:     { mapFlex: "0 0 120px", sheetFlex: "1 1 auto" },
};

export default function Home({ stations }) {
  const navigate = useNavigate();
  const [search,       setSearch]       = useState("");
  const [activeChip,   setActiveChip]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [snap,         setSnap]         = useState("balanced");
  const [cityFilter,   setCityFilter]   = useState(CITIES[0]);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const sheetRef = useRef(null);
  const dragRef  = useRef({ startY: 0 });
  const mapViewRef = useRef(null);

  // ─── زنگوله اخبار ────────────────────────────────────────────────────────
  // TODO: GET /news?limit=1&sort=publishedAt:desc (جدیدترین خبر)
  const [bellShaking, setBellShaking] = useState(false);
  const [hasNewNews,  setHasNewNews]  = useState(false);
  const [lastNewsTs,  setLastNewsTs]  = useState(() => {
    // آخرین باری که کاربر اخبار رو دید در localStorage ذخیره می‌شه
    return Number(localStorage.getItem('voltmap_last_news_seen') || 0)
  });

  useEffect(() => {
    // هر ۳۰ ثانیه چک کن خبر جدید اومده یا نه
    // TODO: وقتی به دیتابیس وصل شد، اینجا از WebSocket یا SSE استفاده کن
    const checkNews = async () => {
      try {
        const news = await fetchNews();
        if (news.length === 0) return;
        const latestTs = new Date(news[0].publishedAt).getTime();
        if (latestTs > lastNewsTs) {
          setHasNewNews(true);
          // زنگوله ۱۰ ثانیه لرزش داره
          setBellShaking(true);
          setTimeout(() => setBellShaking(false), 10000);
        }
      } catch {}
    };
    checkNews();
    const timer = setInterval(checkNews, 30000);
    return () => clearInterval(timer);
  }, [lastNewsTs]);

  const handleBellClick = () => {
    setBellShaking(false);
    setHasNewNews(false);
    const now = Date.now();
    localStorage.setItem('voltmap_last_news_seen', String(now));
    setLastNewsTs(now);
    navigate('/reports');
  };

  // ─── فیلتر ───────────────────────────────────────────────────────────────
  // TODO: وقتی به دیتابیس وصل شد، پارامترها رو مستقیم به API بفرست
  const filtered = useMemo(() => {
    return stations.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.includes(q) || s.city.includes(q) || s.address.includes(q);
      const matchChip =
        !activeChip ||
        (activeChip === "CCS2"  ? s.connector === "CCS2"
       : activeChip === "24h"   ? s.hours?.includes("۲۴")
       : activeChip === "free"  ? s.price?.includes("رایگان")
       : s.type.includes(activeChip));
      const matchStatus = !statusFilter || s.status === statusFilter;
      // TODO: فیلتر شهر — بعداً از API: GET /stations?city=...
      const matchCity = cityFilter.name === 'همه شهرها' || s.city === cityFilter.name;
      return matchSearch && matchChip && matchStatus && matchCity;
    });
  }, [stations, search, activeChip, statusFilter, cityFilter]);

  const handleMapInteract = useCallback(() => {
    setSnap(prev => prev === "list" ? prev : "map");
  }, []);

  const cycleSnap = () => setSnap(prev => prev === "balanced" ? "list" : prev === "list" ? "map" : "balanced");
  const expandList = () => setSnap("list");

  const handleTouchStart = (e) => { dragRef.current = { startY: e.touches[0].clientY }; };
  const handleTouchEnd   = (e) => {
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    if (Math.abs(dy) < 40) return;
    if (dy < -40) expandList();
    else if (dy > 40) setSnap("map");
  };

  // وقتی شهر عوض شد، نقشه رو به مختصات شهر ببر
  const handleCitySelect = (city) => {
    setCityFilter(city);
    setShowCityMenu(false);
    // TODO: این مختصات از API شهرها باید بیاد: GET /cities/:id
    if (mapViewRef.current?.flyTo) {
      mapViewRef.current.flyTo([city.lat, city.lng], city.zoom);
    }
  };

  const { mapFlex, sheetFlex } = SNAP[snap];
  const isMapExpanded  = snap === "map";
  const isListExpanded = snap === "list";

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden dark:bg-gray-900" style={{ paddingBottom: 70 }}>

      {/* Header با زنگوله سفارشی */}
      <Header
        onAdminClick={() => navigate("/admin")}
        bellShaking={bellShaking}
        hasNewNews={hasNewNews}
        onBellClick={handleBellClick}
      />

      {/* Search + فیلتر شهر */}
      <div className="bg-white px-4 pt-2 pb-3 flex gap-2 items-center shrink-0 dark:bg-gray-800">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو برای جایگاه، شهر یا آدرس..."
            className="w-full bg-gray-100 rounded-2xl py-2.5 pr-9 pl-3 text-sm outline-none dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
            style={{ fontFamily: "Vazirmatn", fontSize: 13 }}
          />
        </div>

        {/* دکمه فیلتر شهر */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCityMenu(m => !m)}
            className="h-10 px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0 transition-colors text-sm font-semibold"
            style={{
              background: cityFilter.name !== 'همه شهرها' ? '#e8faf0' : '#f3f4f6',
              color:      cityFilter.name !== 'همه شهرها' ? '#27AE60' : '#555',
            }}>
            <MapPin size={15} />
            <span style={{ fontSize: 12, fontFamily: 'Vazirmatn', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cityFilter.name === 'همه شهرها' ? 'شهر' : cityFilter.name}
            </span>
            <ChevronDown size={13} />
          </button>

          {/* منوی شهرها */}
          {showCityMenu && (
            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 9999, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 130 }}
              className="dark:bg-gray-800">
              {CITIES.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'right', fontFamily: 'Vazirmatn', fontSize: 13, border: 'none', cursor: 'pointer',
                    background: cityFilter.name === city.name ? '#e8faf0' : 'transparent',
                    color:      cityFilter.name === city.name ? '#27AE60' : '#333' }}
                  className="dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="bg-white pb-3 px-4 no-scrollbar flex gap-2 overflow-x-auto shrink-0 dark:bg-gray-800">
        {CHIPS.map(({ label, value, Icon }) => {
          const active = activeChip === value;
          return (
            <button key={value}
              onClick={() => setActiveChip(v => v === value ? "" : value)}
              className={`chip flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${active ? '' : 'dark:!bg-gray-700 dark:!border-gray-600 dark:!text-gray-300'}`}
              style={{ fontFamily:"Vazirmatn", background:active?"#2ECC71":"#fff", borderColor:active?"#2ECC71":"#e8e8e8", color:active?"#fff":"#444", fontSize:12 }}>
              {Icon && <Icon size={12} />}{label}
            </button>
          );
        })}
      </div>

      {/* Map + Sheet */}
      <div className="flex flex-1 flex-col min-h-0" onClick={() => showCityMenu && setShowCityMenu(false)}>
        <div className="map-panel relative min-h-0 transition-[flex] duration-300 ease-out"
          style={{ flex: mapFlex, minHeight: isListExpanded ? 120 : 160 }}>
          <MapView
            ref={mapViewRef}
            stations={filtered}
            onPinClick={s => navigate(`/station/${s.id}`)}
            onMapInteract={handleMapInteract}
          />
          <div className="absolute left-3 bottom-14 z-[1000] flex flex-col gap-2">
            <button className="map-control-btn"><MapPin size={18} color="#2ECC71" /></button>
            <button className="map-control-btn"><Navigation2 size={18} color="#555" /></button>
          </div>
          {isMapExpanded && (
            <button onClick={() => setSnap("balanced")}
              className="absolute top-3 left-3 z-[1000] flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md backdrop-blur-sm dark:bg-gray-800/95 dark:text-gray-300"
              style={{ fontFamily:"Vazirmatn" }}>
              <ChevronDown size={14} /> بازگشت
            </button>
          )}
        </div>

        {/* Sheet */}
        <div ref={sheetRef}
          className="station-sheet flex flex-col min-h-0 bg-white transition-[flex] duration-300 ease-out dark:bg-gray-800"
          style={{ flex:sheetFlex, minHeight:isMapExpanded?130:180, borderRadius:"20px 20px 0 0", boxShadow:"0 -4px 24px rgba(0,0,0,0.08)" }}>

          <div className="sheet-handle shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
            onClick={cycleSnap} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="mx-auto mt-2.5 mb-1 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center justify-center gap-1 pb-1">
              {isListExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
              <span className="text-[10px] text-gray-400" style={{ fontFamily:"Vazirmatn" }}>
                {isMapExpanded ? "بالا بکشید برای لیست" : isListExpanded ? "پایین بکشید برای نقشه" : "کشیدن برای تغییر اندازه"}
              </span>
            </div>
          </div>

          {/* عنوان: لیست جایگاه‌ها (تغییر از «نزدیک‌ترین جایگاه‌ها») */}
          <div className="flex shrink-0 items-center justify-between px-4 pb-2 cursor-pointer" onClick={expandList}>
            <span className="dark:!text-white" style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>
              لیست جایگاه‌ها
            </span>
            <div className="flex items-center gap-2">
              {cityFilter.name !== 'همه شهرها' && (
                <span style={{ fontSize:11, background:'#e8faf0', color:'#27AE60', padding:'2px 8px', borderRadius:20 }}>
                  {cityFilter.name}
                </span>
              )}
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background:"#e8faf0", color:"#27AE60" }}>
                {filtered.length} جایگاه
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            <div className="px-4">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400" style={{ fontSize:14 }}>
                  <Search size={36} className="mx-auto text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  <p className="mt-2">ایستگاهی یافت نشد</p>
                </div>
              ) : (
                filtered.map(s => <StationCard key={s.id} station={s} />)
              )}
            </div>

            {!isMapExpanded && (
              <div className="mx-4 mb-4 mt-2 rounded-2xl p-4 flex items-center justify-between dark:!border-emerald-900"
                style={{ background:"#f0faf5", border:"1px solid #d0f0e0" }}>
                <div>
                  <div className="dark:!text-white" style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>مسیر هوشمند</div>
                  <div className="dark:!text-gray-400" style={{ fontSize:12, color:"#888", marginTop:2 }}>بهترین مسیر و توقف‌های شارژ در سفر</div>
                </div>
                <div className="flex items-center gap-2">
                  <Map size={24} className="text-emerald-300" strokeWidth={1.5} />
                  <button onClick={() => navigate("/routes")}
                    className="text-white text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
                    style={{ background:"#2ECC71", fontFamily:"Vazirmatn", fontSize:12 }}>
                    <Route size={14} /> برنامه‌ریزی
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS زنگوله */}
      <style>{`
        @keyframes bellShake {
          0%,100%{transform:rotate(0)} 10%,30%,50%,70%,90%{transform:rotate(-12deg)} 20%,40%,60%,80%{transform:rotate(12deg)}
        }
        .bell-shake { animation: bellShake 0.6s ease-in-out infinite; transform-origin: top center; }
      `}</style>
    </div>
  );
}
