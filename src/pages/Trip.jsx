/**
 * صفحه برنامه‌ریزی سفر هوشمند EV
 *
 * TODO: وقتی به دیتابیس وصل شد:
 *   - POST /trip/plan  { origin, destination, vehicle, weather }
 *   - GET  /trip/:id
 *   - weather از: GET /weather?lat=...&lng=...
 *   - elevation از: GET /elevation?path=...
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Navigation, MapPin, Zap, Crown, ChevronRight, ChevronLeft,
  X, Loader2, CheckCircle, AlertTriangle, Info, Battery,
  Thermometer, Wind, TrendingUp, Clock, Star, Users,
  RotateCcw, ArrowRight, DollarSign
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchVehicles, updateVehicle } from '../api'
import { fetchStations } from '../api'
import VoltMap from "../assets/svg/logo-gold.png";

// ─── تبدیل قیمت از رشته فارسی به عدد ──────────────────────────────────────
// مثال: '۱۲۰۰ تومان/kWh' → 1200
function parsePricePerKwh(priceStr) {
  if (!priceStr) return 1000
  // تبدیل اعداد فارسی/عربی به انگلیسی با charCode
  // ۰ = U+06F0, پس d.charCodeAt(0) - 0x06F0 = رقم معادل
  const normalized = priceStr.replace(/[۰-۹٠-٩]/g, d => d.charCodeAt(0) - (d >= '٠' && d <= '٩' ? 0x0660 : 0x06F0))
  const num = parseInt(normalized.match(/\d+/)?.[0] || '1000')
  return isNaN(num) ? 1000 : num
}

// ─── محاسبه هزینه شارژ در یک ایستگاه ───────────────────────────────────
// هزینه = (درصد شارژ گرفته شده / 100) × ظرفیت باتری (kWh) × قیمت هر kWh
function calcChargeCost(chargeFrom, chargeTo, batteryCapacity, pricePerKwh) {
  const chargePercent = Math.max(0, chargeTo - chargeFrom)
  const kwhCharged    = (chargePercent / 100) * batteryCapacity
  return Math.round(kwhCharged * pricePerKwh)
}

// ─── الگوریتم هاورساین ──────────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── محاسبه برد واقعی با ضریب‌های محیطی ────────────────────────────────────
/**
 * برد واقعی = برد تجربی کاربر × ضریب دما × ضریب بار کولر/بخاری × ضریب شیب
 * TODO: دما و شیب رو از API های واقعی بگیر
 */
function computeRealRange(baseRange, batteryPct, weather) {
  const { temp = 22, ac = false, heat = false } = weather

  // ضریب دما (طبق داده‌های واقعی EV)
  let tempFactor = 1.0
  if (temp < 0)        tempFactor = 0.65  // سرمای شدید: ۳۵٪ کاهش
  else if (temp < 10)  tempFactor = 0.78  // سرما: ۲۲٪ کاهش
  else if (temp < 15)  tempFactor = 0.88  // خنک: ۱۲٪ کاهش
  else if (temp > 30)  tempFactor = 0.90  // گرمای شدید: ۱۰٪ کاهش
  else if (temp > 25)  tempFactor = 0.95  // گرم: ۵٪ کاهش

  // ضریب سیستم تهویه
  let hvacFactor = 1.0
  if (ac)   hvacFactor = 0.87   // کولر: ۱۳٪ کاهش
  if (heat) hvacFactor = 0.82   // بخاری: ۱۸٪ کاهش

  const realRange = baseRange * tempFactor * hvacFactor
  // برد در دسترس بر اساس درصد شارژ فعلی
  return realRange * (batteryPct / 100)
}

// ─── مصرف انرژی به ازای هر کیلومتر (kWh/km) ─────────────────────────────
function computeConsumption(baseRange, batteryCapacityKwh = 75, weather) {
  const { ac = false, heat = false, temp = 22 } = weather
  let base = batteryCapacityKwh / baseRange  // مصرف پایه
  if (temp < 10 || temp > 35) base *= 1.20
  if (ac)   base *= 1.13
  if (heat) base *= 1.18
  return base
}

// ─── امتیازدهی به ایستگاه ───────────────────────────────────────────────────
/**
 * معیارها:
 * ۱. توان شارژ (max 30pt)
 * ۲. تعداد پورت (max 15pt)
 * ۳. وضعیت (max 25pt) — خلوت بهتره
 * ۴. گزارش مردمی (max 20pt)
 * ۵. انحراف از مسیر (max 10pt) — کمتر بهتره
 */
function scoreStation(station, deviationKm, crowdBonus = 0) {
  let score = 0

  // توان شارژ
  const power = station.power || 22
  if (power >= 150) score += 30
  else if (power >= 100) score += 25
  else if (power >= 50) score += 18
  else if (power >= 22) score += 10
  else score += 4

  // تعداد پورت
  const ports = station.ports || 2
  if (ports >= 6) score += 15
  else if (ports >= 4) score += 10
  else if (ports >= 2) score += 6
  else score += 2

  // وضعیت
  if (station.status === 'available') score += 25
  else if (station.status === 'waiting') score += 10
  else if (station.status === 'busy') score += 5
  else score += 0  // offline

  // گزارش مردمی (از reviews)
  if (station.reviews?.length >= 3) score += Math.min(20, station.reviews.length * 3)
  if (station.rating >= 4.5) score += 5
  else if (station.rating >= 4.0) score += 3

  // انحراف از مسیر — هر ۲ کیلومتر ۱ امتیاز کم می‌شه
  const deviationPenalty = Math.min(10, Math.floor(deviationKm / 2))
  score -= deviationPenalty

  // bonus گزارش مردمی crowd
  score += Math.min(10, crowdBonus)

  return Math.max(0, score)
}

// ─── محاسبه انحراف از مسیر ──────────────────────────────────────────────────
function deviationFromPath(station, origin, destination) {
  // فاصله از خط مستقیم مبدا-مقصد تا ایستگاه
  // روش تقریبی: مجموع فاصله مبدا→ایستگاه + ایستگاه→مقصد منهای مبدا→مقصد
  const direct = haversine(origin.lat, origin.lng, destination.lat, destination.lng)
  const viaStation = haversine(origin.lat, origin.lng, station.lat, station.lng) +
                     haversine(station.lat, station.lng, destination.lat, destination.lng)
  return Math.max(0, viaStation - direct)
}

// ─── الگوریتم اصلی برنامه‌ریزی سفر ─────────────────────────────────────────
/**
 * @param {Object} params
 * @param {Object} params.origin       {lat, lng, name}
 * @param {Object} params.destination  {lat, lng, name}
 * @param {number} params.realRange    برد واقعی در دسترس (km) بر اساس شارژ فعلی
 * @param {number} params.baseRange    برد کامل ماشین (km)
 * @param {number} params.batteryPct   شارژ فعلی (%)
 * @param {Array}  params.stations     لیست همه ایستگاه‌ها
 * @param {number} params.minArrival   حداقل شارژ هنگام رسیدن به مقصد (%)
 * @returns {Object} نتیجه برنامه‌ریزی
 */
function planTrip({ origin, destination, realRange, baseRange, batteryPct, stations, minArrival = 20 }) {
  const totalDist = haversine(origin.lat, origin.lng, destination.lat, destination.lng)
  const warnings = []
  const stops = []
  const batteryCapacity = 75 // TODO: از مشخصات خودرو بگیر (kWh)

  // مصرف درصد باتری به ازای هر کیلومتر
  const pctPerKm = 100 / baseRange

  // برد ایمن فعلی (km) بر اساس درصد شارژ
  const availableKm = (batteryPct / 100) * baseRange

  // ─── بررسی رسیدن مستقیم ───────────────────────────────────────────────
  const batteryAtDest = batteryPct - totalDist * pctPerKm
  if (batteryAtDest >= minArrival) {
    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDest),
      warnings: batteryAtDest < minArrival + 10
        ? ['توصیه می‌شه قبل از حرکت کمی شارژ بگیرید'] : [],
      message: 'با شارژ فعلی به مقصد می‌رسید'
    }
  }

  // ─── بررسی: آیا با شارژ ۱۰۰٪ مستقیم می‌رسیم؟ ─────────────────────────
  // اگه آره، پیشنهاد می‌دیم اول کامل شارژ کنه
  const batteryAtDestFull = 100 - totalDist * pctPerKm
  const canReachWithFull  = batteryAtDestFull >= minArrival

  if (canReachWithFull && batteryAtDest < minArrival) {
    // نزدیک‌ترین ایستگاه به مبدا رو پیدا کن
    const nearestToOrigin = stations
      .filter(s => s.status !== 'offline')
      .map(s => ({ ...s, dist: haversine(origin.lat, origin.lng, s.lat, s.lng) }))
      .filter(s => s.dist < 500)   // فیلتر ایستگاه‌هایی با مختصات احتمالاً اشتباه
      .sort((a, b) => a.dist - b.dist)[0] || null

    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDestFull),
      needsPreCharge: true,  // نشانه‌گذاری که قبل از حرکت شارژ لازمه
      preChargeStation: nearestToOrigin,
      warnings: [],  // اطلاعات توی کارت زرد نشون داده می‌شه — نیاز به تکرار نیست
      message: 'قبل از حرکت شارژ کنید'
    }
  }

  // ─── الگوریتم انتخاب بهینه ایستگاه ────────────────────────────────────
  let currentPos   = { lat: origin.lat, lng: origin.lng }
  let currentBatPct = batteryPct
  const usedStationIds = new Set() // جلوگیری از انتخاب تکراری
  let maxIterations = 10

  while (maxIterations-- > 0) {
    const remainKm = haversine(currentPos.lat, currentPos.lng, destination.lat, destination.lng)

    // اگه با شارژ فعلی (منهای حاشیه امنیتی) می‌رسیم، تمومه
    if (currentBatPct - remainKm * pctPerKm >= minArrival) break

    // برد قابل استفاده از موقعیت فعلی (با ۱۲٪ حاشیه امنیتی)
    const reachableKm = (currentBatPct / 100) * baseRange * 0.88

    // ─── فیلتر ایستگاه‌های قابل دسترس ─────────────────────────────────
    const candidates = stations
      .filter(s => {
        if (s.status === 'offline')         return false
        if (usedStationIds.has(s.id))       return false  // جلوگیری از تکرار
        const distToStation = haversine(currentPos.lat, currentPos.lng, s.lat, s.lng)
        if (distToStation > reachableKm)    return false  // خارج از برد
        if (distToStation < 1)              return false  // خیلی نزدیک (همینجاست)

        // ایستگاه باید در جهت مقصد باشه (نه پشت سر)
        const distStationToDest = haversine(s.lat, s.lng, destination.lat, destination.lng)
        if (distStationToDest >= haversine(currentPos.lat, currentPos.lng, destination.lat, destination.lng)) {
          // اگه ایستگاه ما رو از مقصد دورتر کنه، فقط اگه انحرافش کم باشه قبول کن
          const deviation = deviationFromPath(s, currentPos, destination)
          if (deviation > 20) return false
        }
        return true
      })
      .map(s => {
        const distToStation  = haversine(currentPos.lat, currentPos.lng, s.lat, s.lng)
        const distToDest     = haversine(s.lat, s.lng, destination.lat, destination.lng)
        const deviation      = deviationFromPath(s, currentPos, destination)
        const score          = scoreStation(s, deviation)
        // امتیاز جهت‌دار: ایستگاهی که به مقصد نزدیک‌تره امتیاز بیشتری بگیره
        const directionBonus = Math.max(0, (remainKm - distToDest) / remainKm) * 20
        return { ...s, distToStation, distToDest, deviation, score: score + directionBonus }
      })
      .sort((a, b) => b.score - a.score)

    if (candidates.length === 0) {
      warnings.push('⚠️ در این بخش از مسیر ایستگاه شارژ قابل دسترس پیدا نشد — ریسک مسیر بالاست')
      break
    }

    const best = candidates[0]
    usedStationIds.add(best.id)

    // ─── محاسبه شارژ هنگام رسیدن به ایستگاه ───────────────────────────
    const batOnArrival = Math.max(5, currentBatPct - best.distToStation * pctPerKm)

    // ─── محاسبه هدف شارژ در این ایستگاه ───────────────────────────────
    // پیدا کردن ایستگاه بعدی (یا مقصد) تا بدونیم چقدر شارژ لازمه
    const nextCandidates = stations
      .filter(s => {
        if (s.status === 'offline')   return false
        if (usedStationIds.has(s.id)) return false
        const d = haversine(best.lat, best.lng, s.lat, s.lng)
        return d > 1 && d < baseRange * 0.9
      })
      .map(s => ({
        ...s,
        dist: haversine(best.lat, best.lng, s.lat, s.lng),
        distToDest: haversine(s.lat, s.lng, destination.lat, destination.lng)
      }))
      .filter(s => s.distToDest < best.distToDest) // فقط ایستگاه‌هایی که جلوترن
      .sort((a, b) => a.distToDest - b.distToDest)

    let chargeTarget
    if (best.distToDest <= baseRange * 0.85) {
      // مستقیم از اینجا به مقصد می‌رسیم — فقط همون‌قدر شارژ بگیر که لازمه
      chargeTarget = Math.min(95, best.distToDest * pctPerKm + minArrival + 8)
    } else if (nextCandidates.length > 0) {
      // ایستگاه بعدی وجود داره — تا اون کافیه
      const distToNext = nextCandidates[0].dist
      chargeTarget = Math.min(90, distToNext * pctPerKm + minArrival + 12)
    } else {
      // ایستگاه بعدی نیست — شارژ بیشتر بگیر
      chargeTarget = Math.min(95, best.distToDest * pctPerKm + minArrival + 15)
    }

    chargeTarget = Math.max(chargeTarget, batOnArrival) // نمی‌شه کمتر از ورودی شد
    const chargeNeeded = Math.max(0, chargeTarget - batOnArrival)
    const chargeTimeMin = chargeNeeded < 1 ? 0
      : Math.round((chargeNeeded / 100) * batteryCapacity / (best.power / 60))

    const pricePerKwh = parsePricePerKwh(best.price)
    const chargeCost  = calcChargeCost(Math.round(batOnArrival), Math.round(chargeTarget), batteryCapacity, pricePerKwh)

    stops.push({
      station:          best,
      distFromPrev:     Math.round(best.distToStation),
      batteryOnArrival: Math.round(batOnArrival),
      chargeFrom:       Math.round(batOnArrival),
      chargeTo:         Math.round(chargeTarget),
      chargeTimeMin,
      deviation:        Math.round(best.deviation),
      score:            Math.round(best.score),
      pricePerKwh,
      chargeCost,       // هزینه شارژ در این ایستگاه (تومان)
    })

    currentPos    = { lat: best.lat, lng: best.lng }
    currentBatPct = chargeTarget
  }

  // ─── شارژ نهایی هنگام رسیدن به مقصد ────────────────────────────────
  const lastPos      = stops.length > 0 ? { lat: stops[stops.length-1].station.lat, lng: stops[stops.length-1].station.lng } : { lat: origin.lat, lng: origin.lng }
  const lastKm       = haversine(lastPos.lat, lastPos.lng, destination.lat, destination.lng)
  const lastBat      = stops.length > 0 ? stops[stops.length-1].chargeTo : batteryPct
  const finalBattery = Math.round(lastBat - lastKm * pctPerKm)

  // ─── نزدیک‌ترین ایستگاه به مقصد (برای شارژ بازگشت / اضطرار) ─────────
  // TODO: GET /stations?near=lat,lng&radius=30 — ایستگاه‌های نزدیک مقصد
  // TODO: GET /stations?near=lat,lng&radius=50km
  const nearestToDestination = stations
    .filter(s => s.status !== 'offline')
    .map(s => ({ ...s, distToDest: haversine(s.lat, s.lng, destination.lat, destination.lng) }))
    .filter(s => {
      // فیلتر ایستگاه‌های با مختصات اشتباه (lat/lng باید در محدوده ایران باشه)
      const validLat = s.lat > 25 && s.lat < 40
      const validLng = s.lng > 44 && s.lng < 64
      return s.distToDest < 80 && validLat && validLng
    })
    .sort((a, b) => a.distToDest - b.distToDest)[0] || null

  if (finalBattery < 0)              warnings.push('❌ با ایستگاه‌های موجود، رسیدن به مقصد بسیار دشوار است')
  else if (finalBattery < minArrival) warnings.push('⚠️ شارژ هنگام رسیدن به مقصد کمتر از حد امن است')
  if (stops.some(s => s.deviation > 15)) warnings.push('ℹ️ برخی ایستگاه‌ها انحراف قابل توجهی از مسیر اصلی دارند')

  const totalCost     = stops.reduce((sum, s) => sum + (s.chargeCost || 0), 0)
  const totalChargeTime = stops.reduce((sum, s) => sum + (s.chargeTimeMin || 0), 0)
  const cheapestStop  = stops.length > 1
    ? stops.reduce((min, s) => s.pricePerKwh < min.pricePerKwh ? s : min, stops[0])
    : null

  return {
    feasible:   finalBattery >= 0,
    totalDist:  Math.round(totalDist),
    stops,
    finalBattery: Math.max(0, finalBattery),
    warnings,
    nearestToDestination,
    totalCost,          // هزینه کل شارژ سفر (تومان)
    totalChargeTime,    // مجموع زمان شارژ (دقیقه)
    cheapestStop,       // ارزان‌ترین ایستگاه (برای highlight)
    message: stops.length === 0
      ? 'مستقیم به مقصد می‌رسید'
      : `${stops.length} توقف برای شارژ پیشنهاد می‌شود`
  }
}

// ─── دریافت مختصات از نام مکان (Nominatim رایگان) ──────────────────────────
async function geocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' ایران')}&format=json&limit=5&accept-language=fa`
    const res = await fetch(url, { headers: { 'Accept-Language': 'fa' } })
    const data = await res.json()
    return data.map(d => ({
      name: d.display_name.split('،')[0] + '، ' + (d.display_name.split('،')[1] || ''),
      fullName: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }))
  } catch {
    return []
  }
}

// ─── دریافت مسیر از OSRM ────────────────────────────────────────────────────
async function fetchRouteCoords(points) {
  // TODO: از سرویس مسیریابی اختصاصی استفاده کن
  try {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code === 'Ok') {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
    }
  } catch {}
  return points.map(p => [p.lat, p.lng])
}

// ─── رنگ بر اساس امتیاز ────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 70) return '#27AE60'
  if (score >= 50) return '#F39C12'
  return '#E74C3C'
}

// ─── کامپوننت اصلی ─────────────────────────────────────────────────────────
export default function Trip() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // بررسی membership
  const isGold = user?.membership === 'طلایی' || user?.membership === 'gold'

  // مراحل
  // modal1=معرفی، modal2=ورود اطلاعات خودرو، main=صفحه اصلی
  const [step, setStep] = useState('modal1')

  // اطلاعات خودرو
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [userRange, setUserRange] = useState('')        // برد تجربی
  const [currentBattery, setCurrentBattery] = useState('')  // درصد شارژ

  // مبدا و مقصد
  const [origin, setOrigin] = useState(null)       // {lat, lng, name}
  const [destination, setDest] = useState(null)    // {lat, lng, name}
  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [originResults, setOriginResults] = useState([])
  const [destResults, setDestResults] = useState([])
  const [searchingOrigin, setSearchingOrigin] = useState(false)
  const [searchingDest, setSearchingDest] = useState(false)

  // تنظیمات آب‌وهوا
  const [weather, setWeather] = useState({ temp: 22, ac: false, heat: false })

  // نتیجه
  const [stations, setStations] = useState([])
  const [planning, setPlanning] = useState(false)
  const [result, setResult] = useState(null)

  // نقشه
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const layersRef = useRef([])

  // گام انتخاب روی نقشه
  const [mapSelectMode, setMapSelectMode] = useState(null) // 'origin' | 'dest' | null

  // بارگذاری خودروها و ایستگاه‌ها
  useEffect(() => {
    // TODO: GET /vehicles و GET /stations
    fetchVehicles().then(list => {
      setVehicles(list)
      const def = list.find(v => v.isDefault) || list[0]
      if (def) {
        setSelectedVehicle(def)
        setUserRange(String(def.estimatedRange || ''))
      }
    })
    fetchStations().then(setStations)
  }, [])

  // مقداردهی اولیه نقشه
  useEffect(() => {
    if (step !== 'main' || !mapRef.current || mapInst.current) return
    const map = L.map(mapRef.current, {
      center: [35.7219, 51.3347], zoom: 6, zoomControl: false
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    mapInst.current = map
    requestAnimationFrame(() => map.invalidateSize())
    const obs = new ResizeObserver(() => map.invalidateSize())
    obs.observe(mapRef.current)
    return () => { obs.disconnect(); map.remove(); mapInst.current = null }
  }, [step])

  // کلیک روی نقشه برای انتخاب مبدا/مقصد
  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    if (!mapSelectMode) {
      map.off('click')
      map.getContainer().style.cursor = ''
      return
    }
    map.getContainer().style.cursor = 'crosshair'
    const handler = (e) => {
      const { lat, lng } = e.latlng
      const pos = { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
      if (mapSelectMode === 'origin') { setOrigin(pos); setOriginQuery(pos.name) }
      else { setDest(pos); setDestQuery(pos.name) }
      setMapSelectMode(null)
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [mapSelectMode])

  // رسم مسیر و مارکرها روی نقشه
  const drawRoute = useCallback(async (plan) => {
    const map = mapInst.current
    if (!map || !origin || !destination) return
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    const allPoints = [origin, ...plan.stops.map(s => ({ lat: s.station.lat, lng: s.station.lng })), destination]
    const coords = await fetchRouteCoords(allPoints)

    const line = L.polyline(coords, { color: '#2ECC71', weight: 5, opacity: 0.85, lineCap: 'round' }).addTo(map)
    layersRef.current.push(line)

    // مارکر مبدا
    const oIcon = L.divIcon({ className:'', html:`<div style="width:16px;height:16px;background:#3498DB;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize:[16,16], iconAnchor:[8,8] })
    const oMarker = L.marker([origin.lat, origin.lng], { icon: oIcon }).addTo(map).bindPopup(`<div dir="rtl" style="font-family:Vazirmatn;font-size:12px">مبدا: ${origin.name}</div>`)
    layersRef.current.push(oMarker)

    // مارکر مقصد
    const dIcon = L.divIcon({ className:'', html:`<div style="width:16px;height:16px;background:#E74C3C;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize:[16,16], iconAnchor:[8,8] })
    const dMarker = L.marker([destination.lat, destination.lng], { icon: dIcon }).addTo(map).bindPopup(`<div dir="rtl" style="font-family:Vazirmatn;font-size:12px">مقصد: ${destination.name}</div>`)
    layersRef.current.push(dMarker)

    // مارکرهای ایستگاه‌های توقف
    plan.stops.forEach((stop, i) => {
      const sIcon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:${scoreColor(stop.score)};border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${i+1}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
      })
      const m = L.marker([stop.station.lat, stop.station.lng], { icon: sIcon })
        .addTo(map)
        .bindPopup(`
          <div dir="rtl" style="font-family:Vazirmatn;font-size:12px;min-width:150px;">
            <b style="font-size:13px;">${stop.station.name}</b><br/>
            <span style="color:#888;">توقف ${i+1} · امتیاز ${stop.score}</span><br/>
            <span>شارژ از ${stop.chargeFrom}٪ به ${stop.chargeTo}٪</span><br/>
            <span>زمان شارژ: ~${stop.chargeTimeMin} دقیقه</span>
          </div>
        `)
      layersRef.current.push(m)
    })

    map.fitBounds(coords, { padding: [40, 40] })
  }, [origin, destination])

  useEffect(() => {
    if (result && step === 'main') drawRoute(result)
  }, [result, drawRoute, step])

  // جستجوی مکان
  const searchOrigin = useCallback(async () => {
    if (!originQuery || originQuery.length < 2) return
    setSearchingOrigin(true)
    const res = await geocode(originQuery)
    setOriginResults(res)
    setSearchingOrigin(false)
  }, [originQuery])

  const searchDest = useCallback(async () => {
    if (!destQuery || destQuery.length < 2) return
    setSearchingDest(true)
    const res = await geocode(destQuery)
    setDestResults(res)
    setSearchingDest(false)
  }, [destQuery])

  // اجرای برنامه‌ریزی سفر
  const handlePlan = useCallback(async () => {
    if (!origin || !destination || !userRange || !currentBattery) return
    setPlanning(true)
    setResult(null)

    const baseRange = parseInt(userRange)
    const batteryPct = parseInt(currentBattery)

    // سینک برد با پروفایل خودرو
    // TODO: PATCH /vehicles/:id  { estimatedRange: baseRange }
    if (selectedVehicle) {
      await updateVehicle(selectedVehicle.id, { estimatedRange: baseRange }).catch(() => {})
    }

    const realRange = computeRealRange(baseRange, batteryPct, weather)
    // فیلتر ایستگاه‌ها بر اساس نازل خودرو
    // TODO: وقتی connector شامل چند نازل بود (مثل CCS2+GB/T) هر دو چک بشن
    const vehicleConnector = selectedVehicle?.connector
    const compatibleStations = vehicleConnector
      ? stations.filter(s => {
          if (!s.connector) return true
          // چک می‌کنه connector ایستگاه با connector خودرو match داره
          const stationConnectors = s.connector.split('+').map(x => x.trim())
          const vehicleConnectors = vehicleConnector.split('+').map(x => x.trim())
          return vehicleConnectors.some(vc => stationConnectors.includes(vc))
        })
      : stations

    if (compatibleStations.length === 0 && vehicleConnector) {
      setResult({
        feasible: false,
        totalDist: 0,
        stops: [],
        finalBattery: 0,
        warnings: [`⚠️ هیچ ایستگاهی با نازل ${vehicleConnector} در مسیر پیدا نشد`],
        message: 'ایستگاه سازگار پیدا نشد'
      })
      setPlanning(false)
      return
    }

    const plan = planTrip({ origin, destination, realRange, baseRange, batteryPct, stations: compatibleStations, minArrival: 25 })

    setResult(plan)
    setPlanning(false)
  }, [origin, destination, userRange, currentBattery, weather, stations, selectedVehicle])

  // لوکیشن فعلی
  const handleGetLocation = useCallback((target) => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'موقعیت فعلی شما' }
      if (target === 'origin') { setOrigin(p); setOriginQuery(p.name) }
      else { setDest(p); setDestQuery(p.name) }
    })
  }, [])

  // ─── رندر مودال معرفی ───────────────────────────────────────────────────
  if (!isGold) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6 text-center" style={{ paddingBottom: 80 }}>
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
         <img src={VoltMap} alt="ولت‌مپ" className="w-48 md:w-40" />
        </div>   
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">ویژه اعضای طلایی</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-6">
          برنامه‌ریزی سفر هوشمند فقط برای اشتراک طلایی فعال است.<br />
          با ارتقا اشتراک از مسیریابی دقیق، پیشنهاد بهینه ایستگاه‌ها و هشدار ریسک مسیر بهره‌مند شوید.
        </p>
        <button onClick={() => navigate('/profile')}
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <Crown size={15} className="inline ml-2" />
          ارتقا به طلایی
        </button>
      </div>
    )
  }

  if (step === 'modal1') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingBottom: 80 }}>
        <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
            <Navigation size={40} color="#2ECC71" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">سفر هوشمند با ولت‌مپ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-7 mb-6">
            این ابزار مسیر سفر شما را تحلیل می‌کند، بهترین ایستگاه‌های شارژ را پیشنهاد می‌دهد و دقیقاً می‌گوید
            در هر ایستگاه چقدر شارژ بگیرید.
          </p>

          <div className="w-full space-y-3 mb-8">
            {[
              { icon: Battery, color: '#2ECC71', title: 'محاسبه برد واقعی', desc: 'بر اساس برد تجربی شما، دما، و کولر/بخاری' },
              { icon: Zap, color: '#F39C12', title: 'امتیازدهی ایستگاه‌ها', desc: 'توان شارژ، پورت خالی، گزارش مردمی، انحراف از مسیر' },
              { icon: Clock, color: '#3498DB', title: 'محاسبه زمان توقف', desc: 'فقط تا همان شارژی که برای رسیدن لازم دارید' },
              { icon: AlertTriangle, color: '#E74C3C', title: 'هشدار ریسک مسیر', desc: 'اگه ایستگاهی در مسیر نباشد یا وضعیت بدی داشته باشد' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '20' }}>
                  <item.icon size={18} color={item.color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('modal2')}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
            style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}>
            شروع برنامه‌ریزی سفر
          </button>
        </div>
      </div>
    )
  }

  if (step === 'modal2') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingBottom: 80 }}>
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep('modal1')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white">اطلاعات خودرو و شارژ</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* انتخاب خودرو */}
          {vehicles.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">انتخاب خودرو</p>
              <div className="space-y-2">
                {vehicles.map(v => (
                  <button key={v.id} onClick={() => { setSelectedVehicle(v); setUserRange(String(v.estimatedRange || '')) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-colors ${selectedVehicle?.id === v.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-gray-700'}`}
                    style={{ borderColor: selectedVehicle?.id === v.id ? '#2ECC71' : '#e5e7eb' }}>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Navigation size={16} color="#2ECC71" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{v.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-400">برد ثبت‌شده: {v.estimatedRange || '—'} km</p>
                    </div>
                    {selectedVehicle?.id === v.id && <CheckCircle size={16} color="#2ECC71" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* برد و شارژ */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">برد تجربی خودرو (km)</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
              برد واقعی‌ای که تجربه کرده‌اید، نه برد کارخانه
            </p>
            <input
              type="number"
              value={userRange}
              onChange={e => setUserRange(e.target.value)}
              placeholder="مثلاً ۳۵۰"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400"
              style={{ fontFamily: 'Vazirmatn' }}
            />

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 mt-4">درصد شارژ باتری در شروع سفر</p>
            <div className="mb-2 flex items-start gap-1.5 rounded-lg p-2" style={{ background:'#fef9e7', border:'1px solid #fde68a' }}>
              <span style={{ fontSize:13 }}>💡</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                برای سفر بهتر است شارژ خود را 80% تا 100% کنید تا الگوریتم بهترین مسیر را محاسبه کند.
              </p>
            </div>
            <div className="relative">
              <input
                type="number"
                value={currentBattery}
                onChange={e => setCurrentBattery(Math.min(100, Math.max(0, e.target.value)))}
                placeholder="مثلاً ۸۰"
                min="0" max="100"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400"
                style={{ fontFamily: 'Vazirmatn' }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">٪</span>
            </div>
          </section>

          {/* تنظیمات آب‌وهوا */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">شرایط محیطی (تأثیر بر برد)</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Thermometer size={14} color="#E74C3C" /> دمای هوا
                  </label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{weather.temp}°C</span>
                </div>
                <input type="range" min="-10" max="45" value={weather.temp}
                  onChange={e => setWeather(w => ({ ...w, temp: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>-۱۰°</span>
                  <span className={weather.temp < 10 || weather.temp > 35 ? 'text-red-400 font-semibold' : ''}>
                    {weather.temp < 10 ? '⚠️ سرما: برد کاهش می‌یابد' : weather.temp > 30 ? '⚠️ گرما: برد کاهش می‌یابد' : '✓ دمای مناسب'}
                  </span>
                  <span>+۴۵°</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setWeather(w => ({ ...w, ac: !w.ac, heat: false }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: weather.ac ? '#EBF5FB' : '#f8f9fa', borderColor: weather.ac ? '#3498DB' : '#e5e7eb', color: weather.ac ? '#3498DB' : '#555' }}>
                  <Wind size={14} /> کولر {weather.ac ? '(فعال)' : ''}
                </button>
                <button onClick={() => setWeather(w => ({ ...w, heat: !w.heat, ac: false }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: weather.heat ? '#FEF3E2' : '#f8f9fa', borderColor: weather.heat ? '#E67E22' : '#e5e7eb', color: weather.heat ? '#E67E22' : '#555' }}>
                  <Thermometer size={14} /> بخاری {weather.heat ? '(فعال)' : ''}
                </button>
              </div>
              {(weather.ac || weather.heat) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                  {weather.ac ? '⚠️ کولر حدود ۱۳٪ از برد کم می‌کند' : '⚠️ بخاری حدود ۱۸٪ از برد کم می‌کند'}
                </p>
              )}
            </div>
          </section>

          <button
            onClick={() => {
              if (!userRange || !currentBattery) return
              setStep('main')
            }}
            disabled={!userRange || !currentBattery}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}>
            ادامه — تعیین مبدا و مقصد
          </button>
        </div>
      </div>
    )
  }

  // ─── صفحه اصلی سفر ─────────────────────────────────────────────────────
  return (
    <div className="routes-page flex flex-col">
      {/* نقشه */}
      <div ref={mapRef} style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        {mapSelectMode && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontFamily: 'Vazirmatn', whiteSpace: 'nowrap' }}>
            {mapSelectMode === 'origin' ? '📍 روی نقشه کلیک کنید تا مبدا تعیین شود' : '🏁 روی نقشه کلیک کنید تا مقصد تعیین شود'}
          </div>
        )}
      </div>

      {/* پنل پایین */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 overflow-y-auto"
        style={{ maxHeight: '55%', flexShrink: 0 }}>

        {/* هدر */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Navigation size={17} color="#2ECC71" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">برنامه‌ریزی مسیر</span>
          </div>
          <button onClick={() => setStep('modal2')}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <RotateCcw size={13} /> ویرایش اطلاعات
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* انتخاب مبدا */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">مبدا سفر</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input value={originQuery} onChange={e => { setOriginQuery(e.target.value); setOriginResults([]) }}
                  onKeyDown={e => e.key === 'Enter' && searchOrigin()}
                  placeholder="جستجو آدرس مبدا..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400"
                  style={{ fontFamily: 'Vazirmatn' }} />
                {searchingOrigin && <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
              </div>
              <button onClick={() => handleGetLocation('origin')} title="موقعیت فعلی"
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <MapPin size={16} color="#2ECC71" />
              </button>
              <button onClick={() => setMapSelectMode('origin')} title="انتخاب از نقشه"
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Navigation size={16} color="#3498DB" />
              </button>
              <button onClick={searchOrigin}
                className="px-3 h-10 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                جستجو
              </button>
            </div>
            {originResults.length > 0 && (
              <div className="mt-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                {originResults.slice(0, 4).map((r, i) => (
                  <button key={i} onClick={() => { setOrigin(r); setOriginQuery(r.name); setOriginResults([]) }}
                    className="w-full text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
                    style={{ fontFamily: 'Vazirmatn' }}>
                    <MapPin size={12} className="inline ml-1.5 text-emerald-500" />{r.name}
                  </button>
                ))}
              </div>
            )}
            {origin && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">✓ {origin.name}</p>}
          </div>

          {/* انتخاب مقصد */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">مقصد سفر</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input value={destQuery} onChange={e => { setDestQuery(e.target.value); setDestResults([]) }}
                  onKeyDown={e => e.key === 'Enter' && searchDest()}
                  placeholder="جستجو آدرس مقصد..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-400"
                  style={{ fontFamily: 'Vazirmatn' }} />
                {searchingDest && <Loader2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" />}
              </div>
              <button onClick={() => setMapSelectMode('dest')} title="انتخاب از نقشه"
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Navigation size={16} color="#3498DB" />
              </button>
              <button onClick={searchDest}
                className="px-3 h-10 flex-shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                جستجو
              </button>
            </div>
            {destResults.length > 0 && (
              <div className="mt-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                {destResults.slice(0, 4).map((r, i) => (
                  <button key={i} onClick={() => { setDest(r); setDestQuery(r.name); setDestResults([]) }}
                    className="w-full text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700"
                    style={{ fontFamily: 'Vazirmatn' }}>
                    <MapPin size={12} className="inline ml-1.5 text-red-400" />{r.name}
                  </button>
                ))}
              </div>
            )}
            {destination && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">✓ {destination.name}</p>}
          </div>

          {/* دکمه محاسبه */}
          <button onClick={handlePlan}
            disabled={!origin || !destination || planning}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}>
            {planning ? <><Loader2 size={16} className="animate-spin" /> در حال محاسبه...</> : <><Navigation size={16} /> محاسبه بهینه‌ترین مسیر</>}
          </button>

          {/* نتیجه */}
          {result && (
            <div className="space-y-3">
              {/* کارت pre-charge: وقتی باید اول شارژ کنه بعد بره */}
              {result.needsPreCharge && (
                <div className="rounded-2xl p-4 border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} color="#F59E0B" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      قبل از حرکت شارژ کنید
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-3 leading-5">
                    با شارژ فعلی ({currentBattery}٪) به مقصد نمی‌رسید. اما با شارژ ۱۰۰٪ می‌توانید مستقیم برسید.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">شارژ فعلی</p>
                      <p className="text-sm font-bold text-red-500">{currentBattery}٪</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">شارژ پیشنهادی</p>
                      <p className="text-sm font-bold text-emerald-500">۱۰۰٪</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">گزینه‌های شارژ:</p>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl p-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Battery size={14} color="#2ECC71" />
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        در منزل شارژ کنید و با ۱۰۰٪ حرکت کنید
                      </p>
                    </div>
                    {result.preChargeStation && (
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Zap size={14} color="#3498DB" />
                          </div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            نزدیک‌ترین ایستگاه: {result.preChargeStation.name}
                          </p>
                        </div>
                        <div className="mr-9 mb-2 space-y-1">
                          <p className="text-[10px] text-gray-400">
                            {result.preChargeStation.city} · {result.preChargeStation.power}kW
                            {result.preChargeStation.dist != null && (
                              <span> · فاصله: {Math.round(result.preChargeStation.dist)} km</span>
                            )}
                          </p>
                          {result.preChargeStation.price && (
                            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              💰 قیمت: {result.preChargeStation.price} تومان
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 mr-9">
                          <button
                            onClick={() => window.open(`https://maps.google.com/?q=${result.preChargeStation.lat},${result.preChargeStation.lng}&navigate=yes`)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1"
                            style={{ background: '#2ECC71' }}>
                            <Navigation size={11} /> مسیریابی
                          </button>
                          <button
                            onClick={() => navigate(`/station/${result.preChargeStation.id}`)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center gap-1">
                            جزئیات
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* خلاصه — فقط وقتی needsPreCharge نیست نشون بده */}
              {!result.needsPreCharge && (
              <div className={`rounded-2xl p-4 border ${result.feasible ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.feasible
                    ? <CheckCircle size={18} color="#27AE60" />
                    : <AlertTriangle size={18} color="#E74C3C" />}
                  <span className="text-sm font-bold" style={{ color: result.feasible ? '#27AE60' : '#E74C3C' }}>
                    {result.message}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                  <span>📏 فاصله کل: {result.totalDist} km</span>
                  <span>🔋 شارژ در مقصد: ~{result.finalBattery}٪</span>
                </div>
              </div>
              )}

              {/* کارت هزینه کل سفر */}
              {result.stops.length > 0 && (
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {/* هدر */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">هزینه کل سفر</span>
                    </div>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {result.totalCost.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  {/* جزئیات */}
                  <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-700/50">
                    {[
                      { label: 'مسافت', value: `${result.totalDist} km` },
                      { label: 'زمان شارژ', value: `${result.totalChargeTime} دقیقه` },
                      { label: 'تعداد توقف', value: `${result.stops.length} ایستگاه` },
                    ].map(item => (
                      <div key={item.label} className="py-3 text-center border-l last:border-l-0 border-gray-100 dark:border-gray-600">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{item.label}</p>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* هزینه هر ایستگاه */}
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 space-y-2">
                    {result.stops.map((stop, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ background: stop === result.cheapestStop ? '#F39C12' : '#2ECC71' }}>
                            {i + 1}
                          </div>
                          <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{stop.station.name}</span>
                          {stop === result.cheapestStop && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-700">
                              ارزان‌ترین
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-gray-400">{stop.pricePerKwh.toLocaleString('fa-IR')} تومان/kWh</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {stop.chargeCost.toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* پیشنهاد ارزان‌ترین مسیر */}
                  {result.cheapestStop && (
                    <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 flex items-start gap-2">
                      <span className="text-sm">💡</span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-5">
                        ایستگاه <strong>{result.cheapestStop.station.name}</strong> با قیمت {result.cheapestStop.pricePerKwh.toLocaleString('fa-IR')} تومان/kWh ارزان‌ترین گزینه در مسیر شماست.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* هشدارها */}
              {!result.needsPreCharge && result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <Info size={15} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                </div>
              ))}

              {/* توقف‌ها */}
              {result.stops.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Zap size={13} color="#2ECC71" /> توقف‌های شارژ پیشنهادی
                  </p>
                  {result.stops.map((stop, i) => (
                    <div key={i} className="bg-white dark:bg-gray-700 rounded-2xl p-4 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: scoreColor(stop.score) }}>{i + 1}</div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{stop.station.name}</p>
                            <p className="text-xs text-gray-400">{stop.station.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star size={11} color="#F39C12" fill="#F39C12" />
                            <span className="text-xs font-bold" style={{ color: scoreColor(stop.score) }}>امتیاز {stop.score}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">{stop.station.power}kW · {stop.station.connector}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: 'شارژ ورودی', value: `${stop.chargeFrom}٪` },
                          { label: 'شارژ خروجی', value: `${stop.chargeTo}٪`, highlight: true },
                          { label: 'زمان توقف', value: `${stop.chargeTimeMin} دقیقه` },
                          { label: 'هزینه', value: `${(stop.chargeCost||0).toLocaleString('fa-IR')} ت`, cost: true },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl p-2 text-center"
                            style={{ background: item.highlight ? '#e8faf0' : item.cost ? '#fef9e7' : '#f8f9fb' }}>
                            <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                            <p className="text-xs font-bold"
                              style={{ color: item.highlight ? '#27AE60' : item.cost ? '#D97706' : '#1a1a1a' }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Navigation size={11} />
                        در این ایستگاه توقف کنید، از {stop.chargeFrom}٪ به {stop.chargeTo}٪ شارژ بگیرید،
                        سپس {i < result.stops.length - 1 ? 'به ایستگاه بعدی حرکت کنید' : 'تا مقصد حرکت کنید'}.
                      </p>

                      {stop.deviation > 5 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <TrendingUp size={11} /> انحراف از مسیر: {stop.deviation} کیلومتر
                        </p>
                      )}

                      {stop.station.status !== 'available' && (
                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertTriangle size={11} /> وضعیت ایستگاه: {stop.station.status === 'busy' ? 'شلوغ — احتمال انتظار دارید' : stop.station.status}
                        </p>
                      )}

                      <div className="mt-2 flex gap-2">
                        <button onClick={() => window.open(`https://maps.google.com/?q=${stop.station.lat},${stop.station.lng}&navigate=yes`)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                          style={{ background:'#2ECC71' }}>
                          <Navigation size={12} /> مسیریابی
                        </button>
                        <button onClick={() => navigate(`/station/${stop.station.id}`)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center gap-1">
                          جزئیات <ChevronLeft size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* اگه مستقیم می‌رسه */}
              {result.feasible && result.stops.length === 0 && !result.needsPreCharge && (
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 border border-gray-100 dark:border-gray-600 text-center">
                  <CheckCircle size={28} color="#27AE60" className="mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">بدون نیاز به توقف!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    با شارژ {currentBattery}٪ مستقیم به مقصد می‌رسید و حدود {result.finalBattery}٪ باتری باقی می‌ماند.
                  </p>
                  {destination && (
                    <button onClick={() => window.open(`https://maps.google.com/?q=\${destination.lat},\${destination.lng}&navigate=yes`)}
                      className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{ background:'#2ECC71' }}>
                      <Navigation size={15} /> مسیریابی به مقصد
                    </button>
                  )}
                </div>
              )}
            {/* کارت پیشنهاد شارژ در مقصد یا بازگشت */}
            {result && result.nearestToDestination && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-blue-100 dark:border-blue-800 mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Zap size={14} color="#3498DB" />
                  </div>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    نزدیک‌ترین ایستگاه به مقصد
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-5">
                  اگر در مقصد شارژ کافی ندارید یا برای بازگشت نیاز به شارژ دارید، این ایستگاه نزدیک شماست:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{result.nearestToDestination.name}</p>
                      <p className="text-xs text-gray-400">{result.nearestToDestination.city}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {Math.round(result.nearestToDestination.distToDest)} km
                    </span>
                  </div>
                  <div className="flex gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                    <span>⚡ {result.nearestToDestination.power}kW</span>
                    <span>🔌 {result.nearestToDestination.connector}</span>
                    <span className={{
                      available: 'text-emerald-600',
                      busy: 'text-orange-500',
                      waiting: 'text-blue-500',
                      offline: 'text-gray-400',
                    }[result.nearestToDestination.status] || 'text-gray-400'}>
                      {{available:'خالی',busy:'شلوغ',waiting:'در انتظار',offline:'خاموش'}[result.nearestToDestination.status]||'—'}
                    </span>
                    {result.nearestToDestination.price && (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        💰 {result.nearestToDestination.price}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 flex items-start gap-1">
                  <span>💡</span>
                  <span>همچنین در صورت داشتن شارژر خانگی یا پریز برق در مقصد، می‌توانید خودرو را به آرامی شارژ کنید.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${result.nearestToDestination.lat},${result.nearestToDestination.lng}&navigate=yes`)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                    style={{ background: '#3498DB' }}>
                    <Navigation size={12} /> مسیریابی
                  </button>
                  <button
                    onClick={() => navigate(`/station/${result.nearestToDestination.id}`)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center gap-1">
                    جزئیات <ChevronLeft size={12} />
                  </button>
                </div>
              </div>
            )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}