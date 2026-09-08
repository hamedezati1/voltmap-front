/**
 * فیلتر نما + خوشه‌بندی مارکرهای ایستگاه
 * - فقط ایستگاه‌های داخل viewport رسم می‌شوند
 * - در زوم پایین، ایستگاه‌های نزدیک به‌صورت عدد (غیرقابل‌کلیک) نمایش داده می‌شوند
 * - از زوم ۱۴ به بالا مارکر تکی هر ایستگاه دیده می‌شود
 */

export const INDIVIDUAL_MIN_ZOOM = 14;

export function isValidStationLatLng(station) {
  if (!station) return false;
  const lat = Number(station.lat);
  const lng = Number(station.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function getClusterCellSize(zoom) {
  if (zoom >= 13) return 52;
  if (zoom >= 11) return 68;
  if (zoom >= 9) return 84;
  if (zoom >= 7) return 100;
  return 120;
}

export function clusterIconSize(count) {
  if (count >= 100) return 52;
  if (count >= 20) return 46;
  return 40;
}

export function buildClusterHTML(count) {
  const size = clusterIconSize(count);
  const label = Number(count).toLocaleString("fa-IR");
  return `
    <div class="map-cluster" style="width:${size}px;height:${size}px;font-size:${size >= 50 ? 14 : 13}px;">
      ${label}
    </div>
  `;
}

/**
 * ایستگاه‌های داخل نما را برمی‌گرداند و در زوم پایین آن‌ها را خوشه می‌کند.
 * @returns {{ type: 'station', station: object } | { type: 'cluster', count: number, lat: number, lng: number }}[]
 */
export function buildViewportItems(stations, map) {
  if (!map || !Array.isArray(stations) || stations.length === 0) return [];

  const zoom = map.getZoom();
  const bounds = map.getBounds().pad(0.25);
  const visible = [];

  for (const station of stations) {
    if (!isValidStationLatLng(station)) continue;
    if (bounds.contains([Number(station.lat), Number(station.lng)])) {
      visible.push(station);
    }
  }

  if (zoom >= INDIVIDUAL_MIN_ZOOM) {
    return visible.map((station) => ({ type: "station", station }));
  }

  const cell = getClusterCellSize(zoom);
  const groups = new Map();

  for (const station of visible) {
    const point = map.latLngToContainerPoint([
      Number(station.lat),
      Number(station.lng),
    ]);
    const key = `${Math.floor(point.x / cell)}_${Math.floor(point.y / cell)}`;
    const group = groups.get(key);
    if (group) group.push(station);
    else groups.set(key, [station]);
  }

  const items = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      items.push({ type: "station", station: group[0] });
      continue;
    }
    const lat =
      group.reduce((sum, s) => sum + Number(s.lat), 0) / group.length;
    const lng =
      group.reduce((sum, s) => sum + Number(s.lng), 0) / group.length;
    items.push({ type: "cluster", count: group.length, lat, lng });
  }
  return items;
}
