import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js'
import { MEMBERSHIP } from '../../domain/entities/User.js'

export class AdminService {
  constructor({ stationRepository, userRepository }) {
    this.stationRepository = stationRepository
    this.userRepository = userRepository
  }

  async getDashboardStats() {
    const stations = await this.stationRepository.findAll({})
    const allReviews = await this.stationRepository.listAllReviews()
    return {
      totalStations: stations.length,
      available: stations.filter(s => s.status === 'available').length,
      busy: stations.filter(s => s.status === 'busy').length,
      waiting: stations.filter(s => s.status === 'waiting').length,
      offline: stations.filter(s => s.status === 'offline').length,
      totalReviews: allReviews.length,
    }
  }

  async getAllReviews() {
    return this.stationRepository.listAllReviews()
  }

  async deleteReview(stationId, reviewId) {
    const station = Number(stationId)
    const review = Number(reviewId)
    if (!Number.isInteger(station) || station <= 0 || !Number.isInteger(review) || review <= 0) {
      throw new ValidationError('شناسه ایستگاه و نظر الزامی است')
    }
    const existing = await this.stationRepository.findById(station)
    if (!existing) throw new NotFoundError('ایستگاه یافت نشد')
    const removed = await this.stationRepository.deleteReview(station, review)
    if (!removed) throw new NotFoundError('نظر این ایستگاه یافت نشد')
    const updated = await this.stationRepository.findById(station)
    return { stationId: station, reviewId: review, rating: updated?.rating ?? 0 }
  }

  async getUsageReport(days = 7) {
    // TODO: وقتی جدول station_sessions اضافه شد، این باید از داده‌ی واقعی مصرف بیاد.
    // فعلاً ساختار خروجی حفظ شده تا فرانت بدون تغییر کار کند.
    const labels = Array.from({ length: days }, (_, i) => `روز ${i + 1}`)
    const values = Array.from({ length: days }, () => 0)
    return { labels, values }
  }

  async updateUserMembership(userId, membership) {
    if (!Object.values(MEMBERSHIP).includes(membership)) {
      throw new ValidationError('سطح عضویت نامعتبر است')
    }
    const user = await this.userRepository.updateMembership(userId, membership)
    return user?.toPublic()
  }

  async listUsers() {
    const users = await this.userRepository.list()
    return users.map(u => u.toPublic())
  }
}
