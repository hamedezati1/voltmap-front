import { ValidationError } from '../../domain/errors/AppError.js'
import { planTrip } from './tripPlanner.js'

export class RouteService {
  constructor({ routeHistoryRepository, stationRepository, vehicleRepository, drivingRouter }) {
    this.routeHistoryRepository = routeHistoryRepository
    this.stationRepository = stationRepository
    this.vehicleRepository = vehicleRepository
    this.drivingRouter = drivingRouter
  }

  async planRoute(userId, body) {
    const origin = body.origin
    const destination = body.destination
    if (origin?.lat == null || origin?.lng == null || destination?.lat == null || destination?.lng == null) {
      throw new ValidationError('مختصات مبدا و مقصد الزامی است')
    }

    const vehicles = await this.vehicleRepository.findAllByUser(userId)
    const vehicle = vehicles.find((v) => v.isDefault) || vehicles[0] || null

    const baseRange = Number(body.vehicleRange || vehicle?.estimatedRange || 0)
    const batteryPct = Number(body.batteryPct ?? vehicle?.batteryLevel ?? 0)
    const connector = body.connector || body.connectorType || vehicle?.connector || null

    if (!baseRange || baseRange <= 0) {
      throw new ValidationError('برد تجربی خودرو مشخص نیست')
    }
    if (!batteryPct || batteryPct <= 0 || batteryPct > 100) {
      throw new ValidationError('درصد باتری معتبر نیست')
    }

    const stations = await this.stationRepository.findAll()
    const drivingRoute = await this.drivingRouter.route(origin, destination)
    const plan = planTrip({
      origin,
      destination,
      baseRange,
      batteryPct,
      stations,
      connector,
      minArrival: 5,
      drivingRoute,
    })

    const saved = await this.routeHistoryRepository.create({
      userId,
      origin,
      destination,
      vehicleRange: baseRange,
      connectorType: connector,
      totalDistance: plan.totalDist,
      totalDuration: plan.totalChargeTime,
      chargingStops: plan.stops,
    })

    return { id: saved.id, ...plan }
  }

  async getHistory(userId) {
    return this.routeHistoryRepository.findAllByUser(userId)
  }
}
