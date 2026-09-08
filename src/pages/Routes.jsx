// TODO: وقتی به دیتابیس وصل شد، ایستگاه‌ها از API گرفته می‌شن: GET /stations?connector=...&type=...
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  SlidersHorizontal,
  X,
  Locate,
  Navigation,
  Loader2,
  Zap,
  Plug,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Heart,
  RefreshCw,
} from "lucide-react";
import {
  fetchStations,
  addFavoriteStation,
  removeFavoriteStation,
  isFavoriteStation,
} from "../api";
import { buildPinHTML } from "../components/MapView";
import {
  buildViewportItems,
  buildClusterHTML,
  clusterIconSize,
} from "../lib/mapMarkers";

// ─── الگوریتم هاورساین برای محاسبه فاصله ──────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
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

function findNearestTwo(userLat, userLng, stations) {
  const sorted = stations
    .filter((s) => s.status !== "offline")
    .map((s) => ({ ...s, dist: haversine(userLat, userLng, s.lat, s.lng) }))
    .sort((a, b) => a.dist - b.dist);
  return { first: sorted[0] || null, second: sorted[1] || null };
}

// ─── دریافت مسیر واقعی از OSRM (رایگان، بدون API key) ────────────────────
// TODO: وقتی به دیتابیس وصل شد، می‌توان از سرویس مسیریابی اختصاصی استفاده کرد
async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
    }
  } catch {}
  return [
    [fromLat, fromLng],
    [toLat, toLng],
  ];
}

const CONNECTOR_FILTERS = [
  { label: "CCS2", value: "CCS2" },
  { label: "Type 2", value: "Type2" },
  { label: "GB/T", value: "GB/T" },
];

const TYPE_FILTERS = [
  { label: "DC (فست شارژ)", value: "DC" },
  { label: "AC", value: "AC" },
  { label: "AC/DC", value: "AC/DC" },
];

const STATUS_LABELS = {
  available: "خالی",
  busy: "شلوغ",
  waiting: "در انتظار",
  offline: "خاموش",
};
const STATUS_COLORS_MAP = {
  available: "#27AE60",
  busy: "#E74C3C",
  waiting: "#3ca8e7",
  offline: "#57606f",
};

export default function RoutesPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersLayerRef = useRef(null);
  const syncMarkersRef = useRef(() => {});
  const filteredRef = useRef([]);
  const routeRef = useRef(null);
  const userMarker = useRef(null);

  const [stations, setStations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [locating, setLocating] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterConn, setFilterConn] = useState([]);
  const [filterType, setFilterType] = useState([]);
  const [filterFast, setFilterFast] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ─── popup ایستگاه (جایگزین popup لیفلت) ────────────────────────────────
  const [selectedStation, setSelectedStation] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    fetchStations()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setStations(list);
        setFiltered(list);
      })
      .catch(() => {
        setStations([]);
        setFiltered([]);
      });
  }, []);

  // TODO: فیلتر — وقتی به دیتابیس وصل شد: GET /stations?connector=...&type=...&fast=true
  useEffect(() => {
    let result = stations;
    if (filterConn.length) {
      result = result.filter((s) => {
        const c = (s.connectors || s.connector || "").toLowerCase();
        return filterConn.some((fc) => c.includes(String(fc).toLowerCase()));
      });
    }
    if (filterType.length)
      result = result.filter((s) => filterType.includes(s.type));
    if (filterFast)
      result = result.filter(
        (s) => (s.type === "DC" || s.type === "AC/DC") && s.power >= 50,
      );
    setFiltered(result);
  }, [stations, filterConn, filterType, filterFast]);

  filteredRef.current = filtered;

  // ─── اولیه‌سازی نقشه ────────────────────────────────────────────────────
  useEffect(() => {
    const el = mapRef.current;
    if (!el || mapInst.current) return;

    const map = L.map(el, {
      center: [35.7219, 51.3347],
      zoom: 12,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    markersLayerRef.current = layer;
    mapInst.current = map;

    const sync = () => {
      const currentMap = mapInst.current;
      const currentLayer = markersLayerRef.current;
      if (!currentMap || !currentLayer) return;
      currentLayer.clearLayers();
      const items = buildViewportItems(filteredRef.current || [], currentMap);
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
          }).addTo(currentLayer);
          continue;
        }
        const s = item.station;
        const icon = L.divIcon({
          className: "",
          html: buildPinHTML(s),
          iconSize: [52, 64],
          iconAnchor: [26, 64],
          popupAnchor: [0, -64],
        });
        const marker = L.marker([s.lat, s.lng], { icon }).addTo(currentLayer);
        marker.on("click", () => {
          setSelectedStation(s);
          isFavoriteStation(s.id).then(setIsFav);
        });
      }
    };
    syncMarkersRef.current = sync;

    let viewTimer;
    const handleViewChange = () => {
      clearTimeout(viewTimer);
      viewTimer = setTimeout(sync, 60);
    };
    map.on("moveend", handleViewChange);
    map.on("zoomend", handleViewChange);

    const resize = () => {
      map.invalidateSize();
      sync();
    };
    requestAnimationFrame(resize);
    const t = setTimeout(resize, 150);
    const obs = new ResizeObserver(resize);
    obs.observe(el);

    return () => {
      clearTimeout(t);
      clearTimeout(viewTimer);
      map.off("moveend", handleViewChange);
      map.off("zoomend", handleViewChange);
      obs.disconnect();
      map.remove();
      mapInst.current = null;
      markersLayerRef.current = null;
      syncMarkersRef.current = () => {};
    };
  }, []);

  // ─── مارکرهای ایستگاه (فقط نمای فعلی + خوشه در زوم پایین) ──────────────
  useEffect(() => {
    syncMarkersRef.current();
  }, [filtered]);

  // ─── موقعیت‌یابی و رسم مسیر ─────────────────────────────────────────────
  const handleLocate = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند");
      return;
    }
    setLocating(true);
    setRouteInfo(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const map = mapInst.current;
        if (!map) {
          setLocating(false);
          return;
        }
        if (userMarker.current) userMarker.current.remove();
        const userIcon = L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;background:#2ECC71;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(46,204,113,0.25);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        userMarker.current = L.marker([lat, lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(
            '<div style="font-family:Vazirmatn;direction:rtl;font-size:12px;">موقعیت شما</div>',
          )
          .openPopup();
        const { first: near, second: near2 } = findNearestTwo(
          lat,
          lng,
          filtered.length ? filtered : stations,
        );
        setLocating(false);
        if (near) {
          map.fitBounds(
            [
              [lat, lng],
              [near.lat, near.lng],
            ],
            { padding: [60, 60] },
          );
          setRouting(true);
          const coords = await fetchRoute(lat, lng, near.lat, near.lng);
          if (routeRef.current) {
            routeRef.current.remove();
            routeRef.current = null;
          }
          routeRef.current = L.polyline(coords, {
            color: "#2ECC71",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          const fmtDist = (s) =>
            s.dist < 1
              ? `${Math.round(s.dist * 1000)} متر`
              : `${s.dist.toFixed(1)} km`;
          setRouteInfo({
            first: {
              name: near.name,
              city: near.city,
              power: near.power,
              price: near.price,
              connector: near.connector,
              status: near.status,
              station: near,
              dist: fmtDist(near),
            },
            second: near2
              ? {
                  name: near2.name,
                  city: near2.city,
                  power: near2.power,
                  price: near2.price,
                  connector: near2.connector,
                  status: near2.status,
                  station: near2,
                  dist: fmtDist(near2),
                }
              : null,
          });
          setSheetOpen(true);
          setRouting(false);
        }
      },
      () => {
        setLocating(false);
        alert("دسترسی به موقعیت مکانی امکان‌پذیر نبود.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [filtered, stations]);

  const clearRoute = () => {
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }
    setRouteInfo(null);
    setSheetOpen(false);
  };

  // TODO: POST/DELETE /profile/favorites/:id
  const handleToggleFav = async () => {
    if (!selectedStation) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavoriteStation(selectedStation.id);
        setIsFav(false);
      } else {
        await addFavoriteStation(selectedStation.id);
        setIsFav(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const toggleFilter = (arr, setArr, val) =>
    setArr((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );

  const activeFilterCount =
    filterConn.length + filterType.length + (filterFast ? 1 : 0);

  // ارتفاع sheet اطلاعات ایستگاه نزدیک
  const routeSheetH = sheetOpen ? 320 : 56;
  // موقعیت دکمه locate: اگه sheet باز باشه بالاتر بره
  const locateBtnBottom = 80 + (routeInfo ? routeSheetH + 8 : 0);

  return (
    <div className="routes-page">
      {/* نقشه */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* ─── نوار بالا ─── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          left: 12,
          zIndex: 1000,
          display: "flex",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 14,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            flex: 1,
          }}
        >
          <Navigation size={15} color="#2ECC71" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1a1a1a",
              fontFamily: "Vazirmatn",
            }}
          >
            نقشه مسیریابی
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#888",
              fontFamily: "Vazirmatn",
              marginRight: "auto",
            }}
          >
            {filtered.length} ایستگاه
          </span>
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          style={{
            position: "relative",
            width: 42,
            height: 42,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            border: "none",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal
            size={18}
            color={activeFilterCount > 0 ? "#2ECC71" : "#555"}
          />
          {activeFilterCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#2ECC71",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {activeFilterCount}
            </div>
          )}
        </button>
      </div>

      {/* ─── پنل فیلتر ─── */}
      {showFilters && (
        <div
          style={{
            position: "absolute",
            top: 62,
            right: 12,
            left: 12,
            zIndex: 1000,
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1a1a1a",
                fontFamily: "Vazirmatn",
              }}
            >
              فیلتر ایستگاه‌ها
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterConn([]);
                    setFilterType([]);
                    setFilterFast(false);
                  }}
                  style={{
                    fontSize: 11,
                    color: "#e74c3c",
                    background: "#fef2f2",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                  }}
                >
                  پاک کردن
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#888" />
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "#888",
                fontWeight: 600,
                marginBottom: 8,
                fontFamily: "Vazirmatn",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Plug size={12} /> نوع پورت
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CONNECTOR_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() =>
                    toggleFilter(filterConn, setFilterConn, f.value)
                  }
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1px solid",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    background: filterConn.includes(f.value)
                      ? "#2ECC71"
                      : "#fff",
                    borderColor: filterConn.includes(f.value)
                      ? "#2ECC71"
                      : "#e0e0e0",
                    color: filterConn.includes(f.value) ? "#fff" : "#444",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "#888",
                fontWeight: 600,
                marginBottom: 8,
                fontFamily: "Vazirmatn",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Zap size={12} /> نوع شارژر
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() =>
                    toggleFilter(filterType, setFilterType, f.value)
                  }
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "1px solid",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "Vazirmatn",
                    background: filterType.includes(f.value)
                      ? "#2ECC71"
                      : "#fff",
                    borderColor: filterType.includes(f.value)
                      ? "#2ECC71"
                      : "#e0e0e0",
                    color: filterType.includes(f.value) ? "#fff" : "#444",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <div
              onClick={() => setFilterFast((f) => !f)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: filterFast ? "#2ECC71" : "#e0e0e0",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s",
                  transform: filterFast
                    ? "translateX(-18px)"
                    : "translateX(-2px)",
                  right: 0,
                }}
              />
            </div>
            <span
              style={{ fontSize: 12, color: "#444", fontFamily: "Vazirmatn" }}
            >
              فقط فست‌شارژ (DC ≥ 50kW)
            </span>
          </label>
        </div>
      )}

      {/* ─── دکمه موقعیت‌یابی (بالا می‌ره وقتی sheet بازه) ─── */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: locateBtnBottom,
          zIndex: 1000,
          transition: "bottom 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* دکمه مسیریابی Google Maps وقتی ایستگاه پیشنهادی داریم */}
        {routeInfo?.first && (
          <button
            onClick={() =>
              window.open(
                `https://maps.google.com/?q=${routeInfo.first.lat},${routeInfo.first.lng}&navigate=yes`,
              )
            }
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#fff",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
              cursor: "pointer",
              gap: 2,
            }}
          >
            <Navigation size={17} color="#3498DB" />
            <span
              style={{
                fontSize: 8,
                color: "#3498DB",
                fontFamily: "Vazirmatn",
                fontWeight: 600,
              }}
            >
              {" "}
              مسیریابی سریع{" "}
            </span>
          </button>
        )}
        <button
          onClick={handleLocate}
          disabled={locating || routing}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#2ECC71",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(46,204,113,0.5)",
            cursor: "pointer",
          }}
        >
          {locating || routing ? (
            <Loader2
              size={22}
              color="#fff"
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Locate size={22} color="#fff" />
          )}
        </button>
      </div>

      {/* ─── sheet دو پیشنهاد ایستگاه ─── */}
      {routeInfo?.first && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
            zIndex: 999,
            background: "#fff",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            transition: "max-height 0.3s ease",
            maxHeight: sheetOpen ? 500 : 56,
          }}
        >
          {/* handle */}
          <div
            onClick={() => setSheetOpen((o) => !o)}
            style={{
              padding: "10px 0 6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "#e0e0e0",
                marginBottom: 4,
              }}
            />
            {sheetOpen ? (
              <ChevronDown size={14} color="#aaa" />
            ) : (
              <ChevronUp size={14} color="#aaa" />
            )}
          </div>

          {sheetOpen && (
            <div
              style={{
                padding: "0 14px 20px",
                fontFamily: "Vazirmatn",
                direction: "rtl",
              }}
            >
              {/* header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}
                >
                  ایستگاه‌های پیشنهادی نزدیک شما
                </span>
                <button
                  onClick={clearRoute}
                  style={{
                    background: "#fef2f2",
                    border: "none",
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    color: "#e74c3c",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <X size={12} /> پاک
                </button>
              </div>

              {/* کارت ایستگاه */}
              {[routeInfo.first, routeInfo.second]
                .filter(Boolean)
                .map((info, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: idx === 0 ? "#f0faf5" : "#f8f9fb",
                      borderRadius: 14,
                      padding: "12px",
                      marginBottom: 10,
                      border:
                        idx === 0 ? "1.5px solid #2ECC71" : "1px solid #e8e8e8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 3,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: idx === 0 ? "#2ECC71" : "#aaa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#1a1a1a",
                            }}
                          >
                            {info.name}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#888",
                            marginRight: 26,
                          }}
                        >
                          {info.city} · {info.dist}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          fontWeight: 600,
                          flexShrink: 0,
                          background:
                            info.status === "available"
                              ? "#e8faf0"
                              : info.status === "busy"
                                ? "#fef3e2"
                                : "#f0f0f0",
                          color:
                            info.status === "available"
                              ? "#27AE60"
                              : info.status === "busy"
                                ? "#E67E22"
                                : "#888",
                        }}
                      >
                        {STATUS_LABELS[info.status] || "—"}
                      </span>
                    </div>
                    {/* آمار */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {[
                        { label: "توان", value: `${info.power}kW` },
                        { label: "کانکتور", value: info.connector },
                        {
                          label: "قیمت",
                          value: info.price || "—",
                          highlight: true,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            background: "#fff",
                            borderRadius: 8,
                            padding: "7px 4px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: "#aaa",
                              marginBottom: 2,
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: item.highlight ? "#D97706" : "#1a1a1a",
                            }}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* دکمه‌ها */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() =>
                          window.open(
                            `https://maps.google.com/?q=${info.station.lat},${info.station.lng}&navigate=yes`,
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: idx === 0 ? "#2ECC71" : "#555",
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <Navigation size={13} /> مسیریابی سریع
                      </button>
                      <button
                        onClick={() => navigate(`/station/${info.station.id}`)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "#fff",
                          color: "#555",
                          border: "1px solid #e0e0e0",
                          borderRadius: 10,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        جزئیات
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ─── اسلاید پنل ایستگاه انتخاب‌شده (جایگزین popup لیفلت) ─── */}
      {selectedStation && (
        <>
          {/* overlay */}
          <div
            onClick={() => setSelectedStation(null)}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1099,
              background: "transparent",
            }}
          />
          {/* پنل — دقیقاً مثل StationCard ولی در قالب sheet */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              left: 0,
              zIndex: 1100,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
              padding: "0 0 24px",
              fontFamily: "Vazirmatn",
              direction: "rtl",
            }}
          >
            {/* handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px 8px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "#e0e0e0",
                  margin: "0 auto",
                }}
              />
            </div>

            {/* تصویر (اگه بود) */}
            {selectedStation.image && (
              <div
                style={{ height: 140, overflow: "hidden", marginBottom: 12 }}
              >
                <img
                  src={selectedStation.image}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            <div style={{ padding: "0 16px" }}>
              {/* نام و وضعیت */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: 2,
                    }}
                  >
                    {selectedStation.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#888",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <MapPin size={12} color="#2ECC71" /> {selectedStation.city}
                  </div>
                </div>
                {(() => {
                  const st = {
                    available: { c: "#27AE60", bg: "#e8faf0", l: "خلوت" },
                    busy: { c: "#E67E22", bg: "#fef3e2", l: "شلوغ" },
                    waiting: { c: "#3498DB", bg: "#EBF5FB", l: "در انتظار" },
                    offline: { c: "#95a5a6", bg: "#f0f0f0", l: "خاموش" },
                  }[selectedStation.status] || {
                    c: "#888",
                    bg: "#f0f0f0",
                    l: "—",
                  };
                  return (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontWeight: 600,
                        background: st.bg,
                        color: st.c,
                        flexShrink: 0,
                      }}
                    >
                      {st.l}
                    </span>
                  );
                })()}
              </div>

              {/* آمار */}
              <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
                {[
                  { label: "توان", value: `${selectedStation.power}kW` },
                  { label: "نوع", value: selectedStation.type },
                  { label: "پورت", value: `${selectedStation.ports} عدد` },
                  { label: "کانکتور", value: selectedStation.connector },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      flex: 1,
                      background: "#f5f7fa",
                      borderRadius: 10,
                      padding: "8px 4px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#1a1a1a",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {selectedStation.rating > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 10,
                  }}
                >
                  <Star size={14} color="#F39C12" fill="#F39C12" />
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}
                  >
                    {selectedStation.rating}
                  </span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    ({selectedStation.reviews?.length || 0} نظر)
                  </span>
                </div>
              )}

              {/* دکمه‌ها */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${selectedStation.lat},${selectedStation.lng}`,
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#2ECC71",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Navigation size={15} /> مسیریابی
                </button>
                <button
                  onClick={handleToggleFav}
                  disabled={favLoading}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: `1.5px solid ${isFav ? "#e74c3c" : "#e0e0e0"}`,
                    background: isFav ? "#fef2f2" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {favLoading ? (
                    <Loader2
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Heart
                      size={15}
                      color={isFav ? "#e74c3c" : "#888"}
                      fill={isFav ? "#e74c3c" : "none"}
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedStation(null);
                    navigate(`/station/${selectedStation.id}`);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f5f7fa",
                    color: "#333",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  جزئیات بیشتر
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
