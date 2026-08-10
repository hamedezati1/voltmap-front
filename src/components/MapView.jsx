import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * رنگ پین بر اساس وضعیت ایستگاه:
 * available  → سبز
 * busy       → قرمز
 * waiting    → آبی
 * offline    → خاکستری
 */
const STATUS_COLORS = {
  available: { main: "#27AE60", dark: "#1a7a40", badge: "#1a7a40" },
  busy: { main: "#E74C3C", dark: "#e01e1e", badge: "#da2a47" },
  waiting: { main: "#3ca8e7", dark: "#265aa9", badge: "#2654a9" },
  offline: { main: "#57606f", dark: "#2f3542", badge: "#2f3542" },
};

/**
 * ساخت HTML پین EV به صورت SVG خالص
 * شامل: بدنه قطره‌ای، آیکون شارژر، نمایش توان در پایین
 */
export function buildPinHTML(station) {
  const status = station.status || "available";
  const c = STATUS_COLORS[status] || STATUS_COLORS.available;
  const powerNum = station.power || (String(station.maxPower || "").match(/(\d+(?:\.\d+)?)/g) || []).map(Number).sort((a,b)=>b-a)[0];
  const power = powerNum ? `${powerNum}KW` : "—";

  return `
    <div style="position:relative; width:52px; height:64px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 64" width="52" height="64">
        <defs>
          <linearGradient id="pg_${station.id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${c.main}" />
            <stop offset="100%" stop-color="${c.dark}" />
          </linearGradient>
          <!-- کلیپ پین -->
          <clipPath id="pc_${station.id}">
            <path d="M26 2 C13.3 2 3 12.3 3 25 C3 38.5 26 62 26 62 C26 62 49 38.5 49 25 C49 12.3 38.7 2 26 2 Z"/>
          </clipPath>
        </defs>

<g transform="translate(4 4) scale(0.85)">
  <path
   d="M26 2 C13.3 2 3 12.3 3 25
      C3 38.5 26 62 26 62
      C26 62 49 38.5 49 25
      C49 12.3 38.7 2 26 2 Z"
   fill="url(#pg_${station.id})"
   stroke="white"
   stroke-width="2.5"
  />
</g>




<g transform="translate(-2 -2)">
  <rect
    x="22"
    y="16"
    width="12"
    height="18"
    rx="3"
    fill="white"
  />

  <path
   d="
    M28 18
    L25 24
    H28
    L26 31
    L33 23
    H30
    L32 18
    Z
   "
   fill="${c.main}"
  />
</g>

        <!-- نوار توان در پایین -->
        <rect x="9" y="38" width="34" height="13" rx="6.5"
          fill="${c.badge}" opacity="0.92"/>
        <text x="26" y="48.5"
          font-family="Vazirmatn, Arial, sans-serif"
          font-size="8.5"
          font-weight="700"
          fill="white"
          text-anchor="middle">${power}</text>
      </svg>
    </div>
  `;
}

// forwardRef برای اینکه Home بتونه flyTo رو از بیرون صدا بزنه
// TODO: وقتی به دیتابیس وصل شد، ref همچنان قابل استفاده‌ست
const MapView = forwardRef(function MapView({ stations, onPinClick, onMapInteract }, ref) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const onMapInteractRef = useRef(onMapInteract);

  onMapInteractRef.current = onMapInteract;

  // expose flyTo به parent (برای وقتی کاربر شهر رو عوض می‌کنه)
  useImperativeHandle(ref, () => ({
    flyTo: (latlng, zoom = 13) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(latlng, zoom, { duration: 1.2 })
      }
    }
  }), [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [35.7219, 51.3347],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const handleInteract = () => onMapInteractRef.current?.();
    map.on("movestart", handleInteract);
    map.on("zoomstart", handleInteract);

    mapInstanceRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(mapRef.current);

    return () => {
      map.off("movestart", handleInteract);
      map.off("zoomstart", handleInteract);
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // حذف مارکرهای قبلی
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((s) => {
      if (s.lat == null || s.lng == null || Number.isNaN(Number(s.lat)) || Number.isNaN(Number(s.lng))) return

      const c = STATUS_COLORS[s.status] || STATUS_COLORS.available;

      const statusLabels = {
        available: "خالی",
        busy: "شلوغ",
        waiting: "در انتظار",
        offline: "خاموش",
      };

      const icon = L.divIcon({
        className: "",
        html: buildPinHTML(s),
        iconSize: [60, 72],
        iconAnchor: [30, 72],
        popupAnchor: [0, -72],
      });

      const powerText = s.maxPower || (s.power ? `${s.power}` : "—")
      const marker = L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`
          <div style="font-family: Vazirmatn, sans-serif; direction: rtl; min-width: 170px;">
            <div style="font-weight:700; font-size:13px; margin-bottom:4px; color:#1a1a1a;">${s.name}</div>
            <div style="font-size:12px; color:#888; margin-bottom:4px;">${[s.operator, s.city].filter(Boolean).join(" · ")}</div>
            <div style="font-size:11px; color:#aaa; margin-bottom:8px;">${s.address || ""}</div>
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span style="font-size:11px; background:${c.main}22; color:${c.main}; padding:3px 10px; border-radius:12px; font-weight:600;">
                ${statusLabels[s.status] || "—"}
              </span>
              <span style="font-size:11px; color:#555;">${powerText}kW · ${s.type}</span>
              <span style="font-size:11px; color:#888;">${s.connector || ""}</span>
            </div>
          </div>
        `);

      marker.on("click", () => {
        if (onPinClick) onPinClick(s);
      });

      markersRef.current.push(marker);
    });
  }, [stations, onPinClick]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}

)

export default MapView
