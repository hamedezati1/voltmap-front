import { canSeeHomeStations } from "./membership";

/** ایستگاه خانگی که کاربر پرو/پلاس در اختیار عموم گذاشته است */
export function isHomeStation(station) {
  return Boolean(station?.isHomeStation || station?.is_home_station);
}

/**
 * ایستگاه خانگی فقط برای پرو و پلاس دیده می‌شود.
 * اگر ادمین نمایش را خاموش کرده باشد، روی نقشه نمی‌آید.
 * همین محدودیت سمت سرور هم روی GET /stations اعمال می‌شود.
 */
export function filterStationsForUser(stations, user) {
  const list = Array.isArray(stations) ? stations : [];
  const canSee = canSeeHomeStations(user);
  return list.filter((station) => {
    if (!isHomeStation(station)) return true;
    if (!canSee) return false;
    return station.isActive !== false;
  });
}
