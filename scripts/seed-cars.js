/**
 * وارد کردن کاتالوگ خودروهای برقی از scripts/data/electric_cars.json
 * اجرا: npm run db:seed-cars
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, closePool } from '../src/infrastructure/database/pool.js'
import { MyCarCatalogRepository } from '../src/adapters/persistence/mysql/MyCarCatalogRepository.js'
import { logger } from '../src/infrastructure/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, 'data', 'electric_cars.json')

async function seedCars() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`فایل داده پیدا نشد: ${DATA_PATH}`)
  }

  const cars = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  if (!Array.isArray(cars) || cars.length === 0) {
    throw new Error('لیست خودروها خالی است')
  }

  const repo = new MyCarCatalogRepository(pool)
  const count = await repo.upsertMany(cars)
  logger.info(`🚗 ${count} خودرو در کاتالوگ ذخیره/به‌روز شد`)
}

seedCars()
  .catch((err) => {
    logger.error('Seed cars failed', { error: err.message })
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
