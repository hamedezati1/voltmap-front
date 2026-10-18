import { isPaidMember } from '../../lib/membership'

/**
 * برنامه‌ریزی سفر برای اعضای پرو و پلاس فعال است.
 * (نام تابع برای سازگاری با کدهای قبلی مانده است)
 */
export function isGoldMember(user) {
  return isPaidMember(user)
}
