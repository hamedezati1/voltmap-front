/** تبدیل قیمت از رشته فارسی به عدد — مثال: '۱۲۰۰ تومان/kWh' → 1200 */
export function parsePricePerKwh(priceStr) {
  if (!priceStr) return 1000;
  const normalized = String(priceStr).replace(
    /[۰-۹٠-٩]/g,
    (d) => d.charCodeAt(0) - (d >= "٠" && d <= "٩" ? 0x0660 : 0x06f0),
  );
  const num = parseInt(normalized.match(/\d+/)?.[0] || "1000", 10);
  return Number.isNaN(num) ? 1000 : num;
}

export function calcChargeCost(
  chargeFrom,
  chargeTo,
  batteryCapacity,
  pricePerKwh,
) {
  const chargePercent = Math.max(0, chargeTo - chargeFrom);
  const kwhCharged = (chargePercent / 100) * batteryCapacity;
  return Math.round(kwhCharged * pricePerKwh);
}

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeRealRange(baseRange, batteryPct, weather) {
  const { temp = 22, ac = false, heat = false } = weather;
  let tempFactor = 1.0;
  if (temp < 0) tempFactor = 0.65;
  else if (temp < 10) tempFactor = 0.78;
  else if (temp < 15) tempFactor = 0.88;
  else if (temp > 30) tempFactor = 0.9;
  else if (temp > 25) tempFactor = 0.95;

  let hvacFactor = 1.0;
  if (ac) hvacFactor = 0.87;
  if (heat) hvacFactor = 0.82;

  return baseRange * tempFactor * hvacFactor * (batteryPct / 100);
}

function scoreStation(station, deviationKm, crowdBonus = 0) {
  let score = 0;
  const power = station.power || 22;
  if (power >= 150) score += 30;
  else if (power >= 100) score += 25;
  else if (power >= 50) score += 18;
  else if (power >= 22) score += 10;
  else score += 4;

  const ports = station.ports || 2;
  if (ports >= 6) score += 15;
  else if (ports >= 4) score += 10;
  else if (ports >= 2) score += 6;
  else score += 2;

  if (station.status === "available") score += 25;
  else if (station.status === "waiting") score += 10;
  else if (station.status === "busy") score += 5;

  if (station.reviews?.length >= 3)
    score += Math.min(20, station.reviews.length * 3);
  if (station.rating >= 4.5) score += 5;
  else if (station.rating >= 4.0) score += 3;

  score -= Math.min(10, Math.floor(deviationKm / 2));
  score += Math.min(10, crowdBonus);
  return Math.max(0, score);
}

function deviationFromPath(station, origin, destination) {
  const direct = haversine(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  );
  const viaStation =
    haversine(origin.lat, origin.lng, station.lat, station.lng) +
    haversine(station.lat, station.lng, destination.lat, destination.lng);
  return Math.max(0, viaStation - direct);
}

export function planTrip({
  origin,
  destination,
  realRange,
  baseRange,
  batteryPct,
  stations,
  minArrival = 20,
}) {
  const totalDist = haversine(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  );
  const warnings = [];
  const stops = [];
  const batteryCapacity = 75;
  const pctPerKm = 100 / baseRange;

  const batteryAtDest = batteryPct - totalDist * pctPerKm;
  if (batteryAtDest >= minArrival) {
    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDest),
      warnings:
        batteryAtDest < minArrival + 10
          ? ["توصیه می‌شه قبل از حرکت کمی شارژ بگیرید"]
          : [],
      message: "با شارژ فعلی به مقصد می‌رسید",
    };
  }

  const batteryAtDestFull = 100 - totalDist * pctPerKm;
  if (batteryAtDestFull >= minArrival && batteryAtDest < minArrival) {
    const nearestToOrigin =
      stations
        .filter((s) => s.status !== "offline")
        .map((s) => ({
          ...s,
          dist: haversine(origin.lat, origin.lng, s.lat, s.lng),
        }))
        .filter((s) => s.dist < 500)
        .sort((a, b) => a.dist - b.dist)[0] || null;

    return {
      feasible: true,
      totalDist: Math.round(totalDist),
      stops: [],
      finalBattery: Math.round(batteryAtDestFull),
      needsPreCharge: true,
      preChargeStation: nearestToOrigin,
      warnings: [],
      message: "قبل از حرکت شارژ کنید",
    };
  }

  let currentPos = { lat: origin.lat, lng: origin.lng };
  let currentBatPct = batteryPct;
  const usedStationIds = new Set();
  let maxIterations = 10;

  while (maxIterations-- > 0) {
    const remainKm = haversine(
      currentPos.lat,
      currentPos.lng,
      destination.lat,
      destination.lng,
    );
    if (currentBatPct - remainKm * pctPerKm >= minArrival) break;

    const reachableKm = (currentBatPct / 100) * baseRange * 0.88;
    const candidates = stations
      .filter((s) => {
        if (s.status === "offline") return false;
        if (usedStationIds.has(s.id)) return false;
        const distToStation = haversine(
          currentPos.lat,
          currentPos.lng,
          s.lat,
          s.lng,
        );
        if (distToStation > reachableKm) return false;
        if (distToStation < 1) return false;
        const distStationToDest = haversine(
          s.lat,
          s.lng,
          destination.lat,
          destination.lng,
        );
        if (distStationToDest >= remainKm) {
          const deviation = deviationFromPath(s, currentPos, destination);
          if (deviation > 20) return false;
        }
        return true;
      })
      .map((s) => {
        const distToStation = haversine(
          currentPos.lat,
          currentPos.lng,
          s.lat,
          s.lng,
        );
        const distToDest = haversine(
          s.lat,
          s.lng,
          destination.lat,
          destination.lng,
        );
        const deviation = deviationFromPath(s, currentPos, destination);
        const directionBonus =
          Math.max(0, (remainKm - distToDest) / remainKm) * 20;
        return {
          ...s,
          distToStation,
          distToDest,
          deviation,
          score: scoreStation(s, deviation) + directionBonus,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      warnings.push(
        "⚠️ در این بخش از مسیر ایستگاه شارژ قابل دسترس پیدا نشد — ریسک مسیر بالاست",
      );
      break;
    }

    const best = candidates[0];
    usedStationIds.add(best.id);
    const batOnArrival = Math.max(
      5,
      currentBatPct - best.distToStation * pctPerKm,
    );

    const nextCandidates = stations
      .filter((s) => {
        if (s.status === "offline") return false;
        if (usedStationIds.has(s.id)) return false;
        const d = haversine(best.lat, best.lng, s.lat, s.lng);
        return d > 1 && d < baseRange * 0.9;
      })
      .map((s) => ({
        ...s,
        dist: haversine(best.lat, best.lng, s.lat, s.lng),
        distToDest: haversine(s.lat, s.lng, destination.lat, destination.lng),
      }))
      .filter((s) => s.distToDest < best.distToDest)
      .sort((a, b) => a.distToDest - b.distToDest);

    let chargeTarget;
    if (best.distToDest <= baseRange * 0.85) {
      chargeTarget = Math.min(95, best.distToDest * pctPerKm + minArrival + 8);
    } else if (nextCandidates.length > 0) {
      chargeTarget = Math.min(
        90,
        nextCandidates[0].dist * pctPerKm + minArrival + 12,
      );
    } else {
      chargeTarget = Math.min(95, best.distToDest * pctPerKm + minArrival + 15);
    }

    chargeTarget = Math.max(chargeTarget, batOnArrival);
    const chargeNeeded = Math.max(0, chargeTarget - batOnArrival);
    const chargeTimeMin =
      chargeNeeded < 1
        ? 0
        : Math.round(
            ((chargeNeeded / 100) * batteryCapacity) / (best.power / 60),
          );

    const pricePerKwh = parsePricePerKwh(best.price);
    const chargeCost = calcChargeCost(
      Math.round(batOnArrival),
      Math.round(chargeTarget),
      batteryCapacity,
      pricePerKwh,
    );

    stops.push({
      station: best,
      distFromPrev: Math.round(best.distToStation),
      batteryOnArrival: Math.round(batOnArrival),
      chargeFrom: Math.round(batOnArrival),
      chargeTo: Math.round(chargeTarget),
      chargeTimeMin,
      deviation: Math.round(best.deviation),
      score: Math.round(best.score),
      pricePerKwh,
      chargeCost,
    });

    currentPos = { lat: best.lat, lng: best.lng };
    currentBatPct = chargeTarget;
  }

  const lastPos =
    stops.length > 0
      ? {
          lat: stops[stops.length - 1].station.lat,
          lng: stops[stops.length - 1].station.lng,
        }
      : { lat: origin.lat, lng: origin.lng };
  const lastKm = haversine(
    lastPos.lat,
    lastPos.lng,
    destination.lat,
    destination.lng,
  );
  const lastBat =
    stops.length > 0 ? stops[stops.length - 1].chargeTo : batteryPct;
  const finalBattery = Math.round(lastBat - lastKm * pctPerKm);

  const nearestToDestination =
    stations
      .filter((s) => s.status !== "offline")
      .map((s) => ({
        ...s,
        distToDest: haversine(s.lat, s.lng, destination.lat, destination.lng),
      }))
      .filter((s) => {
        const validLat = s.lat > 25 && s.lat < 40;
        const validLng = s.lng > 44 && s.lng < 64;
        return s.distToDest < 80 && validLat && validLng;
      })
      .sort((a, b) => a.distToDest - b.distToDest)[0] || null;

  if (finalBattery < 0)
    warnings.push("❌ با ایستگاه‌های موجود، رسیدن به مقصد بسیار دشوار است");
  else if (finalBattery < minArrival)
    warnings.push("⚠️ شارژ هنگام رسیدن به مقصد کمتر از حد امن است");
  if (stops.some((s) => s.deviation > 15)) {
    warnings.push("ℹ️ برخی ایستگاه‌ها انحراف قابل توجهی از مسیر اصلی دارند");
  }

  const totalCost = stops.reduce((sum, s) => sum + (s.chargeCost || 0), 0);
  const totalChargeTime = stops.reduce(
    (sum, s) => sum + (s.chargeTimeMin || 0),
    0,
  );
  const cheapestStop =
    stops.length > 1
      ? stops.reduce(
          (min, s) => (s.pricePerKwh < min.pricePerKwh ? s : min),
          stops[0],
        )
      : null;

  return {
    feasible: finalBattery >= 0,
    totalDist: Math.round(totalDist),
    stops,
    finalBattery: Math.max(0, finalBattery),
    warnings,
    nearestToDestination,
    totalCost,
    totalChargeTime,
    cheapestStop,
    message:
      stops.length === 0
        ? "مستقیم به مقصد می‌رسید"
        : `${stops.length} توقف برای شارژ پیشنهاد می‌شود`,
  };
}

export async function geocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " ایران")}&format=json&limit=5&accept-language=fa`;
    const res = await fetch(url, { headers: { "Accept-Language": "fa" } });
    const data = await res.json();
    return data.map((d) => ({
      name:
        d.display_name.split("،")[0] +
        "، " +
        (d.display_name.split("،")[1] || ""),
      fullName: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

/** اگر کاربر lat,lng وارد کرد، همان را برگردان */
export function parseLatLngInput(text) {
  const normalized = String(text || "")
    .trim()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const m = normalized.match(
    /^(-?\d+(?:\.\d+)?)\s*[,،\s]\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng, name: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
}

export async function fetchRouteCoords(points) {
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok") {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
    }
  } catch {}
  return points.map((p) => [p.lat, p.lng]);
}

export function scoreColor(score) {
  if (score >= 70) return "#27AE60";
  if (score >= 50) return "#F39C12";
  return "#E74C3C";
}
