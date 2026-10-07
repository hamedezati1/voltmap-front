import { NotFoundError } from '../../domain/errors/AppError.js'

function toPublicObject(car) {
  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    trim: car.trim,
    bodyType: car.bodyType,
    batteryKwh: car.batteryKwh,
    rangeKm: car.rangeKm,
    connector: car.connector,
    maxDcKw: car.maxDcKw,
    displayName: car.displayName,
  }
}

export class CarCatalogService {
  constructor({ carCatalogRepository }) {
    this.carCatalogRepository = carCatalogRepository
  }

  async list(filters = {}) {
    const cars = await this.carCatalogRepository.findAll(filters)
    return cars.map(toPublicObject)
  }

  async getById(id) {
    const car = await this.carCatalogRepository.findById(id)
    if (!car) throw new NotFoundError('خودرو در کاتالوگ یافت نشد')
    return toPublicObject(car)
  }

  /** لیست برندها برای سلکت فرانت */
  async listBrands() {
    const cars = await this.carCatalogRepository.findAll()
    return [...new Set(cars.map(c => c.brand))].sort((a, b) => a.localeCompare(b))
  }
}
