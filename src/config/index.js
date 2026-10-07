import "dotenv/config";

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  db: {
    host: required("MYSQL_HOST", "localhost"),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: required("MYSQL_USER", "root"),
    password: required("MYSQL_PASSWORD", ""),
    database: required("MYSQL_DATABASE", "voltmap"),
    poolMax: Number(process.env.DB_POOL_MAX || 10),
    poolMin: Number(process.env.DB_POOL_MIN || 0),
    idleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  },

  jwt: {
    accessSecret: required(
      "JWT_ACCESS_SECRET",
      "dev_access_secret_change_me_32_chars",
    ),
    refreshSecret: required(
      "JWT_REFRESH_SECRET",
      "dev_refresh_secret_change_me_32_chars",
    ),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "30d",
  },

  cookieSecret:
    process.env.COOKIE_SECRET || "dev_cookie_secret_change_me_32_chars",
  csrfEnabled: process.env.CSRF_ENABLED !== "false",

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  },

  /**
   * sms.ir Verify API
   * کلید: پنل sms.ir → برنامه‌نویسان → کلید API
   * قالب: پنل → ارسال سریع → ساخت قالب با پارامتر (مثلاً #CODE#)
   */
  sms: {
    enabled: process.env.SMS_IR_ENABLED === "true",
    apiKey: process.env.SMS_IR_API_KEY || "",
    templateId: process.env.SMS_IR_TEMPLATE_ID || "",
    templateParam: process.env.SMS_IR_TEMPLATE_PARAM || "CODE",
  },

  otp: {
    ttlSec: Number(process.env.OTP_TTL_SEC || 120),
    resendCooldownSec: Number(process.env.OTP_RESEND_COOLDOWN_SEC || 60),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    codeLength: Number(process.env.OTP_CODE_LENGTH || 5),
  },

  /** شماره ادمین پیش‌فرض برای seed */
  adminPhone: process.env.ADMIN_PHONE || "09120000000",

  /** فاصلهٔ رانندگی روی جاده (OSRM). خط مستقیم استفاده نمی‌شود. */
  routing: {
    osrmBaseUrl: process.env.OSRM_BASE_URL || "https://router.project-osrm.org",
    timeoutMs: Number(process.env.ROUTING_TIMEOUT_MS || 8000),
  },

  /** عکس ایستگاه‌ها روی دیسک همین سرور. در دیتابیس فقط مسیر نسبی ذخیره می‌شود. */
  storage: {
    dir: process.env.STORAGE_DIR || "storage",
    publicPath: "/uploads",
  },
};
