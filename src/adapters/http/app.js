import path from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import compression from 'compression'
import { config } from '../../config/index.js'
import { applySecurityMiddlewares } from './middlewares/security.js'
import { globalRateLimiter } from './middlewares/rateLimiters.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'

import { authRoutes } from './routes/auth.routes.js'
import { stationsRoutes } from './routes/stations.routes.js'
import { profileRoutes } from './routes/profile.routes.js'
import { vehiclesRoutes } from './routes/vehicles.routes.js'
import { carsRoutes } from './routes/cars.routes.js'
import { newsRoutes } from './routes/news.routes.js'
import { stationReportsRoutes } from './routes/stationReports.routes.js'
import { adminRoutes } from './routes/admin.routes.js'
import { smartRoutesRoutes } from './routes/routes.routes.js'
import { uploadsRoutes } from './routes/uploads.routes.js'

/**
 * Express App Factory — لایه‌ی «Driving Adapter» در معماری هگزاگونال.
 * فقط مسئول HTTP wiring هست: میدل‌ور، مسیر، تبدیل req/res.
 * تمام منطق کسب‌وکار در application/services هست، نه اینجا.
 */
export function createApp(container) {
  const app = express()

  app.set('trust proxy', 1) // برای دریافت صحیح IP پشت reverse proxy (rate limit دقیق‌تر)

  applySecurityMiddlewares(app)
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(cookieParser(config.cookieSecret))
  if (!config.isProd) app.use(morgan('dev'))

  // اسم فایل‌ها UUID است و عوض نمی‌شود؛ مرورگر بعد از اولین دریافت تا یک سال دوباره درخواست نمی‌زند.
  app.use(config.storage.publicPath, express.static(path.resolve(config.storage.dir), {
    etag: true,
    lastModified: true,
    maxAge: '365d',
    immutable: true,
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    },
  }))

  app.use(globalRateLimiter)

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

  app.use('/api/auth', authRoutes(container))
  app.use('/api/stations', stationsRoutes(container))
  app.use('/api/profile', profileRoutes(container))
  app.use('/api/vehicles', vehiclesRoutes(container))
  app.use('/api/cars', carsRoutes(container))
  app.use('/api/news', newsRoutes(container))
  app.use('/api/station-reports', stationReportsRoutes(container))
  app.use('/api/admin', adminRoutes(container))
  app.use('/api/routes', smartRoutesRoutes(container))
  app.use('/api/uploads', uploadsRoutes(container))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
