import crypto from "node:crypto";
import { config } from "../../../config/index.js";
import { ForbiddenError } from "../../../domain/errors/AppError.js";

const CSRF_COOKIE = "voltmap_csrf";
const CSRF_HEADER = "x-csrf-token";

/**
 * محافظت CSRF با الگوی Double-Submit Cookie.
 *
 * چرا اصلاً لازمه؟ چون access token به‌صورت Bearer در Authorization header فرستاده می‌شه
 * (که خودش در برابر CSRF امنه، چون مرورگر خودکار این هدر رو نمی‌فرسته)،
 * ولی refresh token در یک httpOnly cookie نگه داشته می‌شه تا از دسترسی جاوااسکریپت در امان باشه (XSS-safe).
 * این یعنی مسیرهایی مثل /auth/refresh و /auth/logout به کوکی متکی‌اند و باید در برابر CSRF محافظت بشن.
 *
 * روش کار:
 * 1) GET /auth/csrf-token یک توکن تصادفی صادر می‌کنه و در کوکی (غیر httpOnly) قرار می‌ده.
 * 2) فرانت مقدار کوکی رو می‌خونه و در هدر X-CSRF-Token برای درخواست‌های حساس می‌فرسته.
 * 3) سرور مقدار کوکی و هدر رو مقایسه می‌کنه؛ چون سایت مهاجم نمی‌تونه کوکی ما رو بخونه، نمی‌تونه هدر معتبر بسازه.
 */
export function issueCsrfToken(req, res, next) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: config.isProd,
    path: "/",
  });
  res.json({ csrfToken: token });
}

export function verifyCsrf(req, res, next) {
  if (!config.csrfEnabled) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ForbiddenError("CSRF token نامعتبر یا موجود نیست"));
  }
  next();
}
