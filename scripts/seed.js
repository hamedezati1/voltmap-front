/**
 * اسکریپت seed — ادمین و اخبار اولیه را داخل MySQL می‌ریزد.
 * ایستگاه‌ها جداگانه از Excel: npm run db:seed-stations
 * اجرا: npm run db:seed
 *
 * ادمین با شماره موبایل (ADMIN_PHONE در .env) ساخته می‌شود و با OTP وارد می‌شود.
 */
import { randomUUID } from 'node:crypto'
import { pool, closePool } from '../src/infrastructure/database/pool.js'
import { logger } from '../src/infrastructure/logger.js'
import { config } from '../src/config/index.js'

const NEWS = [
  { title: 'افتتاح ایستگاه شارژ جدید در تهران', body: 'ولت‌مپ با افتخار از افتتاح جدیدترین ایستگاه شارژ سریع خود در منطقه ونک تهران خبر می‌دهد. این ایستگاه مجهز به ۶ پورت DC با توان ۱۲۰ کیلووات است.', category: 'ایستگاه', pinned: true },
  { title: 'به‌روزرسانی اپلیکیشن ولت‌مپ - نسخه ۲.۰', body: 'نسخه جدید ولت‌مپ با قابلیت‌های جدید شامل مسیریابی هوشمند، فیلتر پیشرفته و رابط تاریک منتشر شد.', category: 'شرکت', pinned: false },
]

async function seed() {
  const client = await pool.getConnection()
  try {
    await client.beginTransaction()

    const adminPhone = config.adminPhone
    const { rows: existingAdmin } = await client.query(
      `SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      ['admin@voltmap.ir', adminPhone]
    )
    if (existingAdmin[0]) {
      await client.query(
        `UPDATE users SET phone = ?, role = 'admin', membership = 'ویژه' WHERE id = ?`,
        [adminPhone, existingAdmin[0].id]
      )
    } else {
      await client.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, membership)
         VALUES (?,?,?,?,NULL,'admin','ویژه')`,
        [randomUUID(), 'ادمین ولت‌مپ', 'admin@voltmap.ir', adminPhone]
      )
    }

    for (const n of NEWS) {
      await client.query(
        `INSERT INTO news (title, body, category, pinned) VALUES (?,?,?,?)`,
        [n.title, n.body, n.category, n.pinned ? 1 : 0]
      )
    }

    await client.commit()
    logger.info('🌱 seed با موفقیت انجام شد (ادمین + اخبار)')
    logger.info(`👤 ادمین: شماره ${adminPhone} — ورود با OTP (purpose=login)`)
    logger.info('📍 برای ایستگاه‌ها: npm run db:seed-stations')
  } catch (err) {
    await client.rollback()
    throw err
  } finally {
    client.release()
    await closePool()
  }
}

seed().catch((err) => {
  logger.error('Seed failed', { error: err.message })
  process.exit(1)
})
