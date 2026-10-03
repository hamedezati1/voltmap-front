/**
 * محاسبهٔ توقف‌های شارژ در بک‌اند انجام می‌شود (POST /routes/plan).
 * اینجا فقط جستجوی مکان، رسم خط مسیر روی نقشه و رنگ امتیاز می‌ماند.
 */

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
  } catch {
    // خط مسیر از خود نقاط ساخته می‌شود
  }
  return points.map((p) => [p.lat, p.lng]);
}

export function scoreColor(score) {
  if (score >= 70) return "#27AE60";
  if (score >= 50) return "#F39C12";
  return "#E74C3C";
}
