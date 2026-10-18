import { canSeeHomeStations } from "./membership";

/** ایستگاه خانگی که کاربر پرو/پلاس در اختیار عموم گذاشته است */
export function isHomeStation(station) {
  return Boolean(station?.isHomeStation || station?.is_home_station);
}

/**
 * ایستگاه‌هایی که این کاربر اجازه‌ی دیدنشان را دارد.
 * کاربر رایگان ایستگاه خانگی نمی‌بیند؛ پرو و پلاس می‌بینند.
 *
 * TODO: وقتی به دیتابیس وصل شد، این فیلتر باید سمت سرور هم اعمال شود
 *       (مثلاً GET /stations برای کاربر رایگان ایستگاه خانگی برنگرداند).
 */
export function filterStationsForUser(stations, user) {
  const list = Array.isArray(stations) ? stations : [];
  if (canSeeHomeStations(user)) return list;
  return list.filter((s) => !isHomeStation(s));
}
