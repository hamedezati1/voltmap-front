import { createRouteDistance } from './routeDistance.js'

/** حداکثر فاصله از مسیر برای انتخاب توقف شارژ. */
const CORRIDOR_KM = 25
/** برای نمایش ایستگاه‌های غیرقابل‌رسیدن، فقط ایستگاه چسبیده به خود خط مسیر. */
const ON_LINE_KM = 6

/** از این درصد تا ۱۰ درصد سفر ممکن است، ولی هشدار داده می‌شود. زیر این درصد ناممکن است. */
const MIN_ARRIVAL_PCT = 5
const WARN_BELOW_ARRIVAL_PCT = 10

function lowArrivalWarning(arrivalPct) {
  if (arrivalPct >= WARN_BELOW_ARRIVAL_PCT) return null
  const pct = Math.round(arrivalPct)
  return `شارژ هنگام رسیدن به مقصد حدود ${pct} درصد است.`
}

function parsePricePerKwh(priceStr) {
  if (!priceStr) return 1000
  const normalized = String(priceStr).replace(
    /[۰-۹٠-٩]/g,
    (d) => d.charCodeAt(0) - (d >= '٠' && d <= '٩' ? 0x0660 : 0x06f0),
  )
  const num = parseInt(normalized.match(/\d+/)?.[0] || '1000', 10)
  return Number.isNaN(num) ? 1000 : num
}

function calcChargeCost(chargeFrom, chargeTo, batteryCapacity, pricePerKwh) {
  const chargePercent = Math.max(0, chargeTo - chargeFrom)
  const kwhCharged = (chargePercent / 100) * batteryCapacity
  return Math.round(kwhCharged * pricePerKwh)
}

function scoreStation(station, deviationKm) {
  let score = 0
  const power = station.power || 22
  if (power >= 150) score += 30
  else if (power >= 100) score += 25
  else if (power >= 50) score += 18
  else if (power >= 22) score += 10
  else score += 4

  const ports = station.ports || 2
  if (ports >= 6) score += 15
  else if (ports >= 4) score += 10
  else if (ports >= 2) score += 6
  else score += 2

  if (station.status === 'available') score += 25
  else if (station.status === 'waiting') score += 10
  else if (station.status === 'busy') score += 5

  if (station.reviews?.length >= 3) score += Math.min(20, station.reviews.length * 3)
  if (station.rating >= 4.5) score += 5
  else if (station.rating >= 4.0) score += 3

  score -= Math.min(10, Math.floor(deviationKm / 2))
  return Math.max(0, score)
}

function stationDto(station) {
  return {
    id: station.id,
    name: station.name,
    city: station.city,
    address: station.address,
    lat: Number(station.lat),
    lng: Number(station.lng),
    status: station.status,
    power: station.power,
    ports: station.ports,
    type: station.type,
    connector: station.connector || station.connectors || null,
    price: station.price,
    rating: station.rating,
  }
}

function connectorMatches(station, connector) {
  if (!connector) return true
  if (!station.connector && !station.connectors) return true
  const stationConnectors = String(station.connectors || station.connector)
    .split('+')
    .map((x) => x.trim().toLowerCase())
  const vehicleConnectors = String(connector)
    .split('+')
    .map((x) => x.trim().toLowerCase())
  return vehicleConnectors.some((vc) => stationConnectors.some((sc) => sc.includes(vc) || vc.includes(sc)))
}

function onRoute(station, distance) {
  if (station.lat == null || station.lng == null) return false
  return distance.deviation(station) <= CORRIDOR_KM
}

/** با شارژ کامل، آیا ایستگاه‌های روی مسیر فاصله را به تکه‌های قابل‌عبور تقسیم می‌کنند؟ */
function canCoverWithFullRange(origin, destination, routeStations, usableKm, distance) {
  const ordered = [...routeStations].sort((a, b) => distance.progress(a) - distance.progress(b))
  const points = [origin, ...ordered, destination]
  let index = 0
  let guard = points.length
  while (index < points.length - 1 && guard-- > 0) {
    let next = -1
    for (let j = points.length - 1; j > index; j -= 1) {
      if (distance.between(points[index], points[j]) <= usableKm) {
        next = j
        break
      }
    }
    if (next < 0) return false
    index = next
  }
  return index === points.length - 1
}

function gapReason(fromLabel, toLabel, gapKm, usableKm) {
  return `با وجود این ایستگاه در مسیر، فاصله از ${fromLabel} تا ${toLabel} حدود ${gapKm} کیلومتر است و از برد تجربی خودرو (${usableKm} کیلومتر) بیشتر است؛ احتمالاً به آنجا نمی‌رسید.`
}

/** بین مبدا و مقصد و نزدیک خود خط رانندگی، نه کل ایستگاه‌های شهر. */
function liesOnRouteLine(station, distance) {
  if (distance.deviation(station) > ON_LINE_KM) return false
  const progress = distance.progress(station)
  return progress >= 3 && progress <= distance.totalDist - 3
}

/** ایستگاه‌های روی مسیر، فقط برای نمایش. چون فاصلهٔ یک تکه‌شان از برد خودرو بیشتر است، قابل انتخاب نیستند. */
function disabledRouteStops(origin, destination, routeStations, usableKm, distance) {
  const ordered = routeStations
    .filter((station) => liesOnRouteLine(station, distance))
    .sort((a, b) => distance.progress(a) - distance.progress(b))
  const rangeKm = Math.round(usableKm)
  const points = [
    { point: origin, label: 'مبدا' },
    ...ordered.map((station) => ({ point: station, label: station.name || 'ایستگاه' })),
    { point: destination, label: 'مقصد' },
  ]
  const legs = []
  for (let i = 0; i < points.length - 1; i += 1) {
    legs.push({
      fromLabel: points[i].label,
      toLabel: points[i + 1].label,
      gapKm: Math.round(distance.between(points[i].point, points[i + 1].point)),
    })
  }

  let passedBreak = false
  return ordered.map((station, index) => {
    const incoming = legs[index]
    const outgoing = legs[index + 1]
    const incomingTooFar = incoming.gapKm > usableKm
    let reason
    if (!passedBreak && incomingTooFar) {
      reason = gapReason(incoming.fromLabel, incoming.toLabel, incoming.gapKm, rangeKm)
    } else if (passedBreak) {
      reason = 'این ایستگاه روی مسیر است، اما چون فاصلهٔ یکی از ایستگاه‌های قبلی از برد خودرو بیشتر بود، احتمالاً به اینجا نمی‌رسید.'
    } else if (outgoing.gapKm > usableKm) {
      reason = gapReason(outgoing.fromLabel, outgoing.toLabel, outgoing.gapKm, rangeKm)
    } else {
      reason = 'این ایستگاه روی مسیر است، اما ادامهٔ مسیر به‌خاطر فاصلهٔ زیاد تا ایستگاه بعدی ممکن نیست.'
    }
    if (incomingTooFar) passedBreak = true
    return {
      station: stationDto(station),
      disabled: true,
      distFromPrev: incoming.gapKm,
      reason,
      batteryOnArrival: null,
      chargeFrom: null,
      chargeTo: null,
      chargeTimeMin: 0,
      deviation: Math.round(distance.deviation(station)),
      score: 0,
      pricePerKwh: null,
      chargeCost: 0,
    }
  })
}

function impossiblePlan(totalDist, connector, routeStations, usableKm, distance, origin, destination) {
  const nozzle = connector ? ` و نازل ${connector}` : ''
  const stops = disabledRouteStops(origin, destination, routeStations, usableKm, distance)
  const warnings = [
    `با توجه به مسافت تجربی خودرو${nozzle}، باتری برای رسیدن به مقصد کافی نیست.`,
  ]
  if (stops.length > 0) {
    warnings.push('ایستگاه‌های زیر روی مسیر هستند، اما به‌خاطر فاصلهٔ زیاد تا ایستگاه بعدی نمی‌توان به آن‌ها رسید.')
  } else {
    warnings.push('ایستگاهی روی خود مسیر نیست که این فاصله را پر کند.')
  }
  return {
    feasible: false,
    totalDist: Math.round(totalDist),
    stops,
    finalBattery: 0,
    needsPreCharge: false,
    preChargeStation: null,
    warnings,
    nearestToDestination: null,
    totalCost: 0,
    totalChargeTime: 0,
    cheapestStop: null,
    message: 'این سفر با برد تجربی خودرو ممکن نیست',
  }
}

/**
 * برنامه‌ریزی سفر.
 * اگر drivingRoute داده شود، totalDist طول مسیر رانندگی است نه خط مستقیم.
 * فقط ایستگاه‌های نزدیک همان مسیر در نظر گرفته می‌شوند.
 * اگر حتی با شارژ کامل هم نتوان فاصله را روی همان مسیر پیمود، بدون پیشنهاد شارژهای کنار مسیر برمی‌گردد.
 */
export function planTrip({
  origin,
  destination,
  baseRange,
  batteryPct,
  stations,
  connector = null,
  minArrival = MIN_ARRIVAL_PCT,
  drivingRoute = null,
}) {
  const distance = createRouteDistance(origin, destination, drivingRoute)
  const totalDist = distance.totalDist
  const warnings = []
  const stops = []
  const batteryCapacity = 75
  const pctPerKm = 100 / baseRange
  const usableKm = baseRange * ((100 - minArrival) / 100)

  const pool = (stations || []).filter(
    (s) => s.status !== 'offline' && s.lat != null && s.lng != null && connectorMatches(s, connector),
  )

  if (connector && pool.length === 0) {
    return {
      feasible: false,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: 0,
      warnings: [`هیچ ایستگاهی با نازل ${connector} پیدا نشد`],
      message: 'ایستگاه سازگار پیدا نشد',
      needsPreCharge: false,
      totalCost: 0,
      totalChargeTime: 0,
      cheapestStop: null,
      nearestToDestination: null,
    }
  }

  const routeStations = pool.filter((s) => onRoute(s, distance))

  const batteryAtDest = batteryPct - totalDist * pctPerKm
  if (batteryAtDest >= minArrival) {
    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDest),
      warnings: [lowArrivalWarning(batteryAtDest)].filter(Boolean),
      message: 'با شارژ فعلی به مقصد می‌رسید',
      needsPreCharge: false,
      totalCost: 0,
      totalChargeTime: 0,
      cheapestStop: null,
      nearestToDestination: null,
    }
  }

  const batteryAtDestFull = 100 - totalDist * pctPerKm
  if (batteryAtDestFull >= minArrival) {
    const nearOrigin = routeStations
      .map((s) => ({ ...s, dist: distance.between(origin, s) }))
      .filter((s) => s.dist <= 40)
      .sort((a, b) => a.dist - b.dist)[0]
    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDestFull),
      needsPreCharge: true,
      preChargeStation: nearOrigin ? stationDto(nearOrigin) : null,
      warnings: [lowArrivalWarning(batteryAtDestFull)].filter(Boolean),
      message: 'قبل از حرکت شارژ کنید',
      totalCost: 0,
      totalChargeTime: 0,
      cheapestStop: null,
      nearestToDestination: null,
    }
  }

  if (!canCoverWithFullRange(origin, destination, routeStations, usableKm, distance)) {
    return impossiblePlan(totalDist, connector, routeStations, usableKm, distance, origin, destination)
  }

  const reachableNowKm = Math.max(0, ((batteryPct - minArrival) / 100) * baseRange)
  const aheadOnRoute = routeStations.filter((s) => {
    const fromOrigin = distance.progress(s)
    const toDest = distance.between(s, destination)
    return fromOrigin >= 8 && toDest < totalDist - 5
  })
  const reachableAhead = aheadOnRoute.filter((s) => distance.between(origin, s) <= reachableNowKm)
  if (reachableAhead.length === 0) {
    return {
      feasible: false,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.max(0, Math.round(batteryAtDest)),
      needsPreCharge: false,
      preChargeStation: null,
      warnings: [
        'با شارژ فعلی به هیچ ایستگاهی روی مسیر نمی‌رسید. اول خودرو را شارژ کنید؛ با برد کامل، این مسیر قابل انجام است.',
      ],
      nearestToDestination: null,
      totalCost: 0,
      totalChargeTime: 0,
      cheapestStop: null,
      message: 'با باتری فعلی این سفر را شروع نکنید',
    }
  }

  let currentPos = { lat: origin.lat, lng: origin.lng }
  let currentBatPct = batteryPct
  const usedStationIds = new Set()
  let maxIterations = 8

  while (maxIterations-- > 0) {
    const remainKm = distance.between(currentPos, destination)
    if (currentBatPct - remainKm * pctPerKm >= minArrival) break

    const reachableKm = Math.max(0, ((currentBatPct - minArrival) / 100) * baseRange)
    const candidates = routeStations
      .filter((s) => {
        if (usedStationIds.has(s.id)) return false
        const distToStation = distance.between(currentPos, s)
        if (distToStation < 8 || distToStation > reachableKm) return false
        const distToDest = distance.between(s, destination)
        return distToDest < remainKm - 5
      })
      .map((s) => {
        const distToStation = distance.between(currentPos, s)
        const distToDest = distance.between(s, destination)
        const deviation = distance.deviation(s)
        return {
          ...s,
          distToStation,
          distToDest,
          deviation,
          score: scoreStation(s, deviation),
        }
      })

    if (candidates.length === 0) {
      warnings.push('با شارژ فعلی به ایستگاه بعدیِ روی مسیر نمی‌رسید. قبل از ادامه، خودرو را شارژ کنید')
      break
    }

    const farthest = Math.max(...candidates.map((s) => s.distToStation))
    const farBand = candidates
      .filter((s) => s.distToStation >= farthest - 20)
      .sort((a, b) => b.score - a.score)
    const best = farBand[0]
    usedStationIds.add(best.id)

    const batOnArrival = Math.max(5, currentBatPct - best.distToStation * pctPerKm)
    let chargeTarget
    if (best.distToDest <= usableKm) {
      chargeTarget = Math.min(95, best.distToDest * pctPerKm + minArrival + 8)
    } else {
      chargeTarget = Math.min(90, ((usableKm * 0.9) / baseRange) * 100 + minArrival)
    }
    chargeTarget = Math.min(95, Math.max(chargeTarget, batOnArrival))

    const chargeNeeded = Math.max(0, chargeTarget - batOnArrival)
    const chargeTimeMin =
      chargeNeeded < 1
        ? 0
        : Math.round(((chargeNeeded / 100) * batteryCapacity) / ((best.power || 22) / 60))

    const pricePerKwh = parsePricePerKwh(best.price)
    const chargeCost = calcChargeCost(
      Math.round(batOnArrival),
      Math.round(chargeTarget),
      batteryCapacity,
      pricePerKwh,
    )

    stops.push({
      station: stationDto(best),
      distFromPrev: Math.round(best.distToStation),
      batteryOnArrival: Math.round(batOnArrival),
      chargeFrom: Math.round(batOnArrival),
      chargeTo: Math.round(chargeTarget),
      chargeTimeMin,
      deviation: Math.round(best.deviation),
      score: Math.round(best.score),
      pricePerKwh,
      chargeCost,
    })

    currentPos = { lat: best.lat, lng: best.lng }
    currentBatPct = chargeTarget
  }

  const lastPos = stops.length
    ? { lat: stops[stops.length - 1].station.lat, lng: stops[stops.length - 1].station.lng }
    : { lat: origin.lat, lng: origin.lng }
  const lastKm = distance.between(lastPos, destination)
  const lastBat = stops.length ? stops[stops.length - 1].chargeTo : batteryPct
  const finalBatteryRaw = lastBat - lastKm * pctPerKm
  const finalBattery = Math.round(finalBatteryRaw)
  const canArrive = finalBatteryRaw >= minArrival

  if (finalBatteryRaw < 0) warnings.push('با ایستگاه‌های روی مسیر، رسیدن به مقصد ممکن نیست')
  else if (canArrive) {
    const lowBattery = lowArrivalWarning(finalBatteryRaw)
    if (lowBattery) warnings.push(lowBattery)
  }
  if (stops.some((s) => s.deviation > 15)) {
    warnings.push('برخی ایستگاه‌ها کمی از خط مستقیم مسیر فاصله دارند')
  }

  const totalCost = stops.reduce((sum, s) => sum + (s.chargeCost || 0), 0)
  const totalChargeTime = stops.reduce((sum, s) => sum + (s.chargeTimeMin || 0), 0)
  const cheapestStop =
    stops.length > 1
      ? stops.reduce((min, s) => (s.pricePerKwh < min.pricePerKwh ? s : min), stops[0])
      : null

  return {
    feasible: canArrive,
    totalDist: Math.round(totalDist),
    stops,
    finalBattery: Math.max(0, finalBattery),
    warnings,
    nearestToDestination: null,
    totalCost,
    totalChargeTime,
    cheapestStop,
    needsPreCharge: false,
    message: canArrive
      ? stops.length === 0
        ? 'مستقیم به مقصد می‌رسید'
        : `${stops.length} توقف شارژ روی مسیر پیشنهاد می‌شود`
      : 'این سفر با برد تجربی خودرو ممکن نیست',
  }
}
