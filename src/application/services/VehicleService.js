import { NotFoundError, ValidationError } from '../../domain/errors/AppError.js'

function parseRangeKm(rangeKm) {
  if (!rangeKm) return null
  const nums = String(rangeKm).match(/\d+/g)
  if (!nums?.length) return null
  return Number(nums[nums.length - 1])
}

export class VehicleService {
  constructor({ vehicleRepository, carCatalogRepository, unitOfWork }) {
    this.vehicleRepository = vehicleRepository
    this.carCatalogRepository = carCatalogRepository
    this.unitOfWork = unitOfWork
  }

  async list(userId) {
    return this.vehicleRepository.findAllByUser(userId)
  }

  async getById(id, userId) {
    const vehicle = await this.vehicleRepository.findById(id, userId)
    if (!vehicle) throw new NotFoundError('خودرو یافت نشد')
    return vehicle
  }

  async add(userId, data) {
    let payload = { ...data }

    // اگر از کاتالوگ انتخاب شده، مشخصات خودرو را از DB پر کن
    if (data.catalogCarId != null) {
      const catalog = await this.carCatalogRepository.findById(Number(data.catalogCarId))
      if (!catalog) throw new NotFoundError('خودرو در کاتالوگ یافت نشد')
      payload = {
        ...payload,
        name: data.name || catalog.displayName,
        connector: data.connector || catalog.connector,
        estimatedRange: data.estimatedRange ?? parseRangeKm(catalog.rangeKm),
      }
    }

    if (!payload.name || !payload.connector) {
      throw new ValidationError('نام و نوع نازل خودرو الزامی است (یا catalogCarId بفرستید)')
    }

    return this.unitOfWork.withTransaction(async (repos) => {
      const existing = await repos.vehicles.findAllByUser(userId)
      const isDefault = existing.length === 0
      if (payload.isDefault && existing.length > 0) {
        await repos.vehicles.clearDefault(userId)
      }
      return repos.vehicles.create({
        userId,
        name: payload.name,
        image: payload.image,
        batteryLevel: payload.batteryLevel,
        estimatedRange: payload.estimatedRange,
        connector: payload.connector,
        year: payload.year,
        isDefault: isDefault || !!payload.isDefault,
      })
    })
  }

  async update(id, userId, changes) {
    const existing = await this.vehicleRepository.findById(id, userId)
    if (!existing) throw new NotFoundError('خودرو یافت نشد')

    if (changes.isDefault === true) {
      return this.unitOfWork.withTransaction(async (repos) => {
        await repos.vehicles.clearDefault(userId)
        return repos.vehicles.update(id, userId, changes)
      })
    }
    return this.vehicleRepository.update(id, userId, changes)
  }

  async delete(id, userId) {
    const existing = await this.vehicleRepository.findById(id, userId)
    if (!existing) throw new NotFoundError('خودرو یافت نشد')
    return this.vehicleRepository.delete(id, userId)
  }
}
