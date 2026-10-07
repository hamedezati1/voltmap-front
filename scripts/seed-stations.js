/**
 * Seed ایستگاه‌ها از Excel کاتالوگ (scripts/data/stations.xlsx)
 * اجرا: npm run db:seed-stations
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { pool, closePool } from '../src/infrastructure/database/pool.js'
import { logger } from '../src/infrastructure/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const XLSX_PATH = path.join(__dirname, 'data', 'stations.xlsx')

function trimStr(v) {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' || s === '-' ? null : s
}

function toInt(v, fallback = 0) {
  if (v == null || v === '' || v === '-') return fallback
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function toFloat(v) {
  if (v == null || v === '') return null
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function yesNo(v) {
  const s = trimStr(v)
  if (!s) return false
  return ['بله', 'بلی', 'yes', 'true', '1', 'آره'].includes(s.toLowerCase())
}

function isActiveStatus(v) {
  const s = trimStr(v)
  if (!s) return true
  return !['غیرفعال', 'خاموش', 'inactive', 'offline', 'خیر'].includes(s.toLowerCase())
}

/** اکسل گاهی «۱۱-۷» را به تاریخ تبدیل می‌کند */
function normalizePower(v) {
  if (v == null || v === '') return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getDate()}-${v.getMonth() + 1}`
  }
  const s = String(v).trim()
  if (!s || s === '-' || s === 'null') return null
  // مثل "11-Jul" از raw:false
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3})$/)
  if (m) {
    const months = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 }
    const month = months[m[2]]
    if (month) return `${m[1]}-${month}`
  }
  return s
}

function loadRows() {
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
}

function mapRow(row, index) {
  const code = trimStr(row['شناسه_ایستگاه']) || `ST${String(index + 1).padStart(3, '0')}`
  const name = trimStr(row['نام_ایستگاه']) || code
  const city = trimStr(row['شهر']) || trimStr(row['استان']) || 'نامشخص'
  const address = trimStr(row['آدرس']) || name

  return {
    code,
    name,
    operator: trimStr(row['نام_اپراتور']),
    province: trimStr(row['استان']),
    city,
    district: trimStr(row['منطقه']),
    address,
    lat: toFloat(row['عرض_جغرافیایی']),
    lng: toFloat(row['طول_جغرافیایی']),
    ac_ports: toInt(row['تعداد_پورت_AC'], 0),
    dc_ports: toInt(row['تعداد_پورت_DC'], 0),
    max_power: normalizePower(row['حداکثر_توان_کیلووات']),
    connectors: trimStr(row['نوع_سوکت‌ها']),
    parking_spots: trimStr(row['تعداد_جای_پارک']),
    is_free: yesNo(row['رایگان_است']) ? 1 : 0,
    price_per_kwh: trimStr(row['هزینه_هر_کیلووات']),
    is_active: isActiveStatus(row['وضعیت']) ? 1 : 0,
    is_verified: yesNo(row['تایید_شده']) ? 1 : 0,
    hours: trimStr(row['ساعت_کاری']),
    phone: trimStr(row['شماره_تماس']),
    image1: trimStr(row['تصویر_۱']),
    image2: trimStr(row['تصویر_۲']),
    image3: trimStr(row['تصویر_۳']),
    description: trimStr(row['توضیحات']),
    data_updated_at: (() => {
      const v = row['آخرین_بروزرسانی']
      if (!v) return null
      if (v instanceof Date && !Number.isNaN(v.getTime())) {
        return v.toISOString().slice(0, 10)
      }
      const s = String(v).trim()
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      return null
    })(),
    status: 'available',
  }
}

async function seedStations() {
  const raw = loadRows()
  const stations = raw.map(mapRow)
  const client = await pool.getConnection()
  try {
    await client.beginTransaction()

    await client.query('DELETE FROM station_reviews')
    await client.query('DELETE FROM station_crowd_reports')
    await client.query('DELETE FROM user_favorites')
    await client.query('DELETE FROM stations')

    const sql = `
      INSERT INTO stations (
        code, name, operator, province, city, district, address,
        lat, lng, ac_ports, dc_ports, max_power, connectors, parking_spots,
        is_free, price_per_kwh, is_active, is_verified, hours, phone,
        image1, image2, image3, description, data_updated_at, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `

    for (const s of stations) {
      await client.query(sql, [
        s.code, s.name, s.operator, s.province, s.city, s.district, s.address,
        s.lat, s.lng, s.ac_ports, s.dc_ports, s.max_power, s.connectors, s.parking_spots,
        s.is_free, s.price_per_kwh, s.is_active, s.is_verified, s.hours, s.phone,
        s.image1, s.image2, s.image3, s.description, s.data_updated_at, s.status,
      ])
    }

    await client.commit()
    logger.info(`🌱 ${stations.length} ایستگاه از Excel با موفقیت seed شد`)
  } catch (err) {
    await client.rollback()
    throw err
  } finally {
    client.release()
    await closePool()
  }
}

seedStations().catch((err) => {
  logger.error('Seed stations failed', { error: err.message })
  process.exit(1)
})
