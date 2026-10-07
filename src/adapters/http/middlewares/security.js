import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import { config } from '../../../config/index.js'

/**
 * مجموعه‌ی میدل‌ورهای امنیتی مطابق توصیه‌های OWASP:
 * - helmet: هدرهای امنیتی HTTP (CSP, X-Frame-Options, HSTS, ...)
 * - cors: محدود کردن origin مجاز (فقط فرانت خودمون)
 * - hpp: جلوگیری از HTTP Parameter Pollution
 * نکته‌ی مهم SQLi: در این پروژه هیچ کوئری‌ای با string concatenation ساخته نمی‌شه؛
 * همه‌ی کوئری‌های MySQL با پارامترهای positional (?, ?, ...) نوشته شدن (پرهیز کامل از تزریق SQL).
 */
export function applySecurityMiddlewares(app) {
  app.disable('x-powered-by')

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }))

  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }))

  app.use(hpp())
}
