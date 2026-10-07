/**
 * Port مخزن کدهای OTP
 */
export class OtpRepository {
  async create(_record) { throw new Error('Not implemented') }
  async findLatestValid(_phone, _purpose) { throw new Error('Not implemented') }
  async findLatest(_phone) { throw new Error('Not implemented') }
  async incrementAttempts(_id) { throw new Error('Not implemented') }
  async consume(_id) { throw new Error('Not implemented') }
  async invalidateActive(_phone) { throw new Error('Not implemented') }
}
