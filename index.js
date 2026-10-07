import { startServer } from './src/infrastructure/server.js'
import { logger } from './src/infrastructure/logger.js'

startServer().catch((err) => {
  logger.error('راه‌اندازی سرور با خطا مواجه شد', { error: err.message })
  process.exit(1)
})
