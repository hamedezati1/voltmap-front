import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js'

export class StationReportService {
  constructor({ stationReportRepository }) {
    this.stationReportRepository = stationReportRepository
  }

  async list(status) {
    return this.stationReportRepository.findAll(status)
  }

  async submit(userId, data) {
    if (!data.name) throw new ValidationError('نام ایستگاه پیشنهادی الزامی است')
    return this.stationReportRepository.create({ userId, ...data })
  }

  async approve(id) {
    const updated = await this.stationReportRepository.updateStatus(id, 'approved')
    if (!updated) throw new NotFoundError('گزارش یافت نشد')
    return updated
  }

  async reject(id, reason) {
    const updated = await this.stationReportRepository.updateStatus(id, 'rejected', reason ?? null)
    if (!updated) throw new NotFoundError('گزارش یافت نشد')
    return updated
  }

  async delete(id) {
    return this.stationReportRepository.delete(id)
  }
}
