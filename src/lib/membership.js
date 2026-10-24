/**
 * سطح‌های اشتراک ولت‌مپ
 *
 * رایگان ← پرو ← پلاس   (پلاس بالاترین سطح است)
 *
 * نام‌های قدیمی (ویژه / طلایی / gold / ...) هنوز ممکن است در localStorage یا
 * دیتابیس باشند؛ همه‌ی مقدارها از طریق normalizeMembership به نام جدید تبدیل می‌شوند.
 *
 * TODO: وقتی بک‌اند آماده شد، enum سطح اشتراک در دیتابیس هم باید
 *       به free / pro / plus تغییر کند (فعلاً برچسب فارسی ارسال می‌شود).
 */

export const MEMBERSHIP = {
  FREE: "رایگان",
  PRO: "پرو",
  PLUS: "پلاس",
};

/** ترتیب نمایش از پایین به بالا */
export const MEMBERSHIP_OPTIONS = [
  MEMBERSHIP.FREE,
  MEMBERSHIP.PRO,
  MEMBERSHIP.PLUS,
];

const ALIASES = {
  // نام‌های جدید
  رایگان: MEMBERSHIP.FREE,
  free: MEMBERSHIP.FREE,
  پرو: MEMBERSHIP.PRO,
  pro: MEMBERSHIP.PRO,
  پلاس: MEMBERSHIP.PLUS,
  plus: MEMBERSHIP.PLUS,
  // نام‌های قدیمی
  ویژه: MEMBERSHIP.PRO,
  "حرفه‌ای": MEMBERSHIP.PRO,
  طلایی: MEMBERSHIP.PLUS,
  gold: MEMBERSHIP.PLUS,
};

export function normalizeMembership(value) {
  if (value === undefined || value === null || value === "") {
    return MEMBERSHIP.FREE;
  }
  const key = String(value).trim();
  return ALIASES[key] ?? ALIASES[key.toLowerCase()] ?? MEMBERSHIP.FREE;
}

export function membershipLevel(user) {
  return normalizeMembership(user?.membership);
}

/** کاربر پرو یا پلاس */
export function isPaidMember(user) {
  const level = membershipLevel(user);
  return level === MEMBERSHIP.PRO || level === MEMBERSHIP.PLUS;
}

export function isPlusMember(user) {
  return membershipLevel(user) === MEMBERSHIP.PLUS;
}

/** فقط پرو و پلاس می‌توانند ایستگاه خانگی در اختیار عموم بگذارند */
export function canHostHomeStation(user) {
  return isPaidMember(user);
}

/** ایستگاه‌های خانگی فقط برای پرو و پلاس روی نقشه دیده می‌شوند */
export function canSeeHomeStations(user) {
  return isPaidMember(user);
}

/** برای تغییر اشتراک ادمین و نمایش در UI */
export function isPremiumLabel(label) {
  const level = normalizeMembership(label);
  return level === MEMBERSHIP.PRO || level === MEMBERSHIP.PLUS;
}
