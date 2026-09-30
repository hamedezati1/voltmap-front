import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildViewportItems,
  buildClusterHTML,
  clusterIconSize,
  isOwnerStation,
} from "../lib/mapMarkers";

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

/** پین ایستگاه کاربران: طلایی، جدا از رنگ وضعیت ایستگاه‌های عمومی */
const OWNER_COLORS = { main: "#F0B429", dark: "#C4840A", badge: "#8C5E08" };

/**
 * ساخت HTML پین EV به صورت SVG خالص
 * شامل: بدنه قطره‌ای، آیکون شارژر، نمایش توان در پایین
 */
export function buildPinHTML(station) {
  const status = station.status || "available";
  const owner = isOwnerStation(station);
  const c = owner
    ? OWNER_COLORS
    : STATUS_COLORS[status] || STATUS_COLORS.available;
  const powerNum =
    station.power ||
    (String(station.maxPower || "").match(/(\d+(?:\.\d+)?)/g) || [])
      .map(Number)
      .sort((a, b) => b - a)[0];
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




${
  owner
    ? `<path d="M26 14.5 L16.5 23 H19.2 V32 H23.4 V26.2 H28.6 V32 H32.8 V23 H35.5 Z" fill="white"/>`
    : `<g transform="translate(-2 -2)">
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
</g>`
}

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

const STATUS_LABELS = {
  available: "خالی",
  busy: "شلوغ",
  waiting: "در انتظار",
  offline: "خاموش",
};

function stationPopupHTML(station) {
  const owner = isOwnerStation(station);
  const c = owner
    ? OWNER_COLORS
    : STATUS_COLORS[station.status] || STATUS_COLORS.available;
  const powerText = station.maxPower || (station.power ? `${station.power}` : "—");
  return `
    <div style="font-family: Vazirmatn, sans-serif; direction: rtl; min-width: 170px;">
      <div style="font-weight:700; font-size:13px; margin-bottom:4px; color:#1a1a1a;">${station.name}</div>
      <div style="font-size:12px; color:#888; margin-bottom:4px;">${[station.operator, station.city].filter(Boolean).join(" · ")}</div>
      <div style="font-size:11px; color:#aaa; margin-bottom:8px;">${station.address || ""}</div>
      <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
        ${
          owner
            ? `<span style="font-size:11px; background:#FFF6E0; color:#8C5E08; padding:3px 10px; border-radius:12px; font-weight:700;">ایستگاه کاربران</span>`
            : ""
        }
        <span style="font-size:11px; background:${c.main}22; color:${c.main}; padding:3px 10px; border-radius:12px; font-weight:600;">
          ${STATUS_LABELS[station.status] || "—"}
        </span>
        <span style="font-size:11px; color:#555;">${powerText}kW · ${station.type}</span>
        <span style="font-size:11px; color:#888;">${station.connector || ""}</span>
      </div>
    </div>
  `;
}

function addViewportMarkers(map, layer, stations, onStationClick) {
  layer.clearLayers();
  const items = buildViewportItems(stations, map);

  for (const item of items) {
    if (item.type === "cluster") {
      const size = clusterIconSize(item.count);
      const icon = L.divIcon({
        className: "map-cluster-icon",
        html: buildClusterHTML(item.count),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([item.lat, item.lng], {
        icon,
        interactive: false,
        keyboard: false,
      }).addTo(layer);
      continue;
    }

    const station = item.station;
    const icon = L.divIcon({
      className: "",
      html: buildPinHTML(station),
      iconSize: [60, 72],
      iconAnchor: [30, 72],
      popupAnchor: [0, -72],
    });
    const marker = L.marker([station.lat, station.lng], { icon }).addTo(layer);
    marker.bindPopup(stationPopupHTML(station));
    marker.on("click", () => onStationClick?.(station));
  }
}

// forwardRef برای اینکه Home بتونه flyTo رو از بیرون صدا بزنه
// TODO: وقتی به دیتابیس وصل شد، ref همچنان قابل استفاده‌ست
const MapView = forwardRef(function MapView({ stations, onPinClick, onMapInteract }, ref) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);
  const syncRef = useRef(() => {});
  const stationsRef = useRef(stations);
  const onPinClickRef = useRef(onPinClick);
  const onMapInteractRef = useRef(onMapInteract);

  stationsRef.current = stations;
  onPinClickRef.current = onPinClick;
  onMapInteractRef.current = onMapInteract;

  // expose flyTo به parent (برای وقتی کاربر شهر رو عوض می‌کنه)
  useImperativeHandle(
    ref,
    () => ({
      flyTo: (latlng, zoom = 13) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(latlng, zoom, { duration: 1.2 });
        }
      },
    }),
    [],
  );

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

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const sync = () => {
      addViewportMarkers(
        map,
        layer,
        stationsRef.current || [],
        (station) => onPinClickRef.current?.(station),
      );
    };
    syncRef.current = sync;

    const handleInteract = () => onMapInteractRef.current?.();
    let viewTimer;
    const handleViewChange = () => {
      clearTimeout(viewTimer);
      viewTimer = setTimeout(sync, 60);
    };

    map.on("movestart", handleInteract);
    map.on("zoomstart", handleInteract);
    map.on("moveend", handleViewChange);
    map.on("zoomend", handleViewChange);

    mapInstanceRef.current = map;
    requestAnimationFrame(() => {
      map.invalidateSize();
      sync();
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      handleViewChange();
    });
    observer.observe(mapRef.current);

    return () => {
      clearTimeout(viewTimer);
      map.off("movestart", handleInteract);
      map.off("zoomstart", handleInteract);
      map.off("moveend", handleViewChange);
      map.off("zoomend", handleViewChange);
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
      syncRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    syncRef.current();
  }, [stations]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
});

export default MapView;
