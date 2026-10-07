import { config } from '../config/index.js'
import { createApp } from '../adapters/http/app.js'
import { buildContainer } from './container.js'
import { closePool, pool } from './database/pool.js'
import { logger } from './logger.js'

const SHUTDOWN_TIMEOUT_MS = 10000

export async function startServer() {
  // چک اولیه‌ی اتصال به دیتابیس قبل از بالا آوردن HTTP server —
  // بهتره سرور اصلاً بالا نیاد تا این‌که بیاد و بعد هر request خطای DB بده
  await pool.query('SELECT 1')
  logger.info('✅ اتصال به MySQL برقرار شد')

  const container = buildContainer()
  const app = createApp(container)

  const server = app.listen(config.port, () => {
    logger.info(`🚀 VoltMap backend روی پورت ${config.port} در حالت ${config.env} اجراست`)
  })

  /**
   * Graceful Shutdown:
   * وقتی سیگنال SIGINT/SIGTERM بیاد (مثلاً از Ctrl+C، Docker stop، یا orchestrator):
   * 1) دیگه connection جدید HTTP قبول نکن (server.close)
   * 2) به request های در حال پردازش فرصت بده تموم بشن
   * 3) بعد connection pool دیتابیس رو ببند
   * 4) اگه بیش از حد طول کشید (SHUTDOWN_TIMEOUT_MS)، به‌زور خارج شو تا پروسس هنگ نکنه
   */
  function shutdown(signal) {
    logger.info(`دریافت سیگنال ${signal} — شروع graceful shutdown...`)

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout — خروج اجباری')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExitTimer.unref()

    server.close(async (err) => {
      if (err) {
        logger.error('خطا در بستن HTTP server', { error: err.message })
      } else {
        logger.info('HTTP server بسته شد (دیگه request جدید قبول نمی‌شه)')
      }
      try {
        await closePool()
      } catch (poolErr) {
        logger.error('خطا در بستن connection pool', { error: poolErr.message })
      } finally {
        clearTimeout(forceExitTimer)
        process.exit(err ? 1 : 0)
      }
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason: String(reason) })
  })
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack })
    // خطای ناشناخته در سطح پروسس یعنی state ممکنه inconsistent باشه؛ بهتره graceful shutdown کنیم
    shutdown('uncaughtException')
  })

  return server
}
