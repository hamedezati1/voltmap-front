/**
 * سطح‌های اشتراک ولت‌مپ
 *
 * مقدار ذخیره‌شده در API و دیتابیس: free ← pro ← plus
 * متن نمایشی: رایگان ← پرو ← پلاس   (پلاس بالاترین سطح است)
 *
 * نام‌های قدیمی (ویژه / طلایی / gold / برچسب فارسی) هنوز ممکن است در
 * localStorage باشند؛ normalizeMembership همه‌شان را به کد جدید برمی‌گرداند.
 */

export const MEMBERSHIP = {
  FREE: "free",
  PRO: "pro",
  PLUS: "plus",
};

export const MEMBERSHIP_LABELS = {
  [MEMBERSHIP.FREE]: "رایگان",
  [MEMBERSHIP.PRO]: "پرو",
  [MEMBERSHIP.PLUS]: "پلاس",
};

/** ترتیب نمایش از پایین به بالا — مقدار ارسالی به API */
export const MEMBERSHIP_OPTIONS = [
  MEMBERSHIP.FREE,
  MEMBERSHIP.PRO,
  MEMBERSHIP.PLUS,
];

const ALIASES = {
  free: MEMBERSHIP.FREE,
  رایگان: MEMBERSHIP.FREE,
  pro: MEMBERSHIP.PRO,
  پرو: MEMBERSHIP.PRO,
  ویژه: MEMBERSHIP.PRO,
  "حرفه‌ای": MEMBERSHIP.PRO,
  plus: MEMBERSHIP.PLUS,
  پلاس: MEMBERSHIP.PLUS,
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

/** برچسب فارسی برای نمایش در UI */
export function membershipLabel(value) {
  return MEMBERSHIP_LABELS[normalizeMembership(value)];
}

export function membershipLevel(user) {
  return normalizeMembership(user?.membership);
}

/** کاربر پرو یا پلاس با اشتراک هنوز معتبر. ادمین بدون خرید هم دسترسی دارد. */
export function isPaidMember(user) {
  if (user?.role === "admin") return true;
  const level = membershipLevel(user);
  if (level !== MEMBERSHIP.PRO && level !== MEMBERSHIP.PLUS) return false;
  if (!user?.membershipExpiresAt) return true;
  const time = new Date(user.membershipExpiresAt).getTime();
  return Number.isFinite(time) && time > Date.now();
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
