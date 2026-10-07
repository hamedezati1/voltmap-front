import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors/AppError.js'
import { STATION_STATUS } from '../../domain/entities/Station.js'

const CROWD_WINDOW_MS = 30 * 60 * 1000
const CROWD_MIN_REPORTS = 2

export class StationService {
  constructor({ stationRepository, crowdReportRepository, unitOfWork, userRepository }) {
    this.stationRepository = stationRepository
    this.crowdReportRepository = crowdReportRepository
    this.unitOfWork = unitOfWork
    this.userRepository = userRepository
  }

  async list(filters) {
    const stations = await this.stationRepository.findAll(filters)
    const withReviews = await Promise.all(
      stations.map(async (s) => ({ ...s, reviews: await this.stationRepository.listReviewsByStation(s.id) }))
    )
    return withReviews
  }

  async getById(id) {
    const station = await this.stationRepository.findById(id)
    if (!station) throw new NotFoundError('ایستگاه یافت نشد')
    const reviews = await this.stationRepository.listReviewsByStation(id)
    return { ...station, reviews }
  }

  async create(data) {
    this.#validateStationInput(data)
    return this.stationRepository.create(this.#normalizeInput(data))
  }

  async update(id, changes) {
    const existing = await this.stationRepository.findById(id)
    if (!existing) throw new NotFoundError('ایستگاه یافت نشد')
    return this.stationRepository.update(id, this.#normalizeInput(changes, true))
  }

  async delete(id) {
    const existing = await this.stationRepository.findById(id)
    if (!existing) throw new NotFoundError('ایستگاه یافت نشد')
    return this.stationRepository.delete(id)
  }

  async addReview(stationId, { userId, text, rating }) {
    if (!userId) throw new UnauthorizedError('برای ثبت نظر باید وارد حساب شوید')
    const user = await this.userRepository.findById(userId)
    if (!user) throw new UnauthorizedError('کاربر یافت نشد')
    const existing = await this.stationRepository.findById(stationId)
    if (!existing) throw new NotFoundError('ایستگاه یافت نشد')
    if (!text || !rating || rating < 1 || rating > 5) {
      throw new ValidationError('متن نظر و امتیاز (بین ۱ تا ۵) الزامی است')
    }
    const userName = String(user.name || '').trim() || user.phone || 'کاربر'
    await this.stationRepository.addReview(stationId, { userId, userName, text, rating })
    return this.getById(stationId)
  }

  async updateStatus(id, status) {
    if (!STATION_STATUS.includes(status)) throw new ValidationError('وضعیت نامعتبر')
    const existing = await this.stationRepository.findById(id)
    if (!existing) throw new NotFoundError('ایستگاه یافت نشد')
    return this.stationRepository.update(id, { status })
  }

  async submitCrowdReport(stationId, type, userId = null) {
    if (!['available', 'busy'].includes(type)) throw new ValidationError('نوع گزارش نامعتبر است')
    const station = await this.stationRepository.findById(stationId)
    if (!station) throw new NotFoundError('ایستگاه یافت نشد')

    return this.unitOfWork.withTransaction(async (repos) => {
      await repos.crowdReports.add(stationId, type, userId)
      const stats = await repos.crowdReports.getStats(stationId, CROWD_WINDOW_MS)

      if (stats.recent < CROWD_MIN_REPORTS) {
        return { status: null, updated: false }
      }
      const ratio = stats.busyCount / stats.recent
      const computedStatus = ratio > 0.5 ? 'busy' : 'available'
      await repos.stations.update(stationId, { status: computedStatus })
      return { status: computedStatus, updated: true }
    })
  }

  async getCrowdStats(stationId) {
    const stats = await this.crowdReportRepository.getStats(stationId, CROWD_WINDOW_MS)
    const ratio = stats.recent > 0 ? stats.busyCount / stats.recent : 0
    const computedStatus = stats.recent >= CROWD_MIN_REPORTS ? (ratio > 0.5 ? 'busy' : 'available') : null
    return { ...stats, computedStatus }
  }

  async getAllCrowdStats() {
    return this.crowdReportRepository.getAllStats(CROWD_WINDOW_MS)
  }

  async listAllReviews() {
    return this.stationRepository.listAllReviews()
  }

  #normalizeInput(data, partial = false) {
    const out = { ...data }
    if (out.connector && !out.connectors) out.connectors = out.connector
    if (out.image && !out.image1) out.image1 = out.image
    if (out.price && !out.pricePerKwh) out.pricePerKwh = out.price
    if (out.power != null && out.maxPower == null) out.maxPower = String(out.power)
    if (!partial && out.name && !out.address) out.address = out.name
    return out
  }

  #validateStationInput(data) {
    const required = ['name', 'city', 'address']
    for (const key of required) {
      if (data[key] === undefined || data[key] === null || data[key] === '') {
        throw new ValidationError(`فیلد ${key} الزامی است`)
      }
    }
    const hasPorts = data.acPorts != null || data.dcPorts != null
    const hasLegacy = data.type != null || data.ports != null
    if (!hasPorts && !hasLegacy) {
      throw new ValidationError('تعداد پورت AC/DC الزامی است')
    }
  }
}
