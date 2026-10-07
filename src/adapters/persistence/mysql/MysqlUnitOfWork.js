import { pool } from '../../../infrastructure/database/pool.js'
import { UnitOfWork } from '../../../application/ports/UnitOfWork.js'
import { MyUserRepository } from './MyUserRepository.js'
import { MyStationRepository } from './MyStationRepository.js'
import { MyCrowdReportRepository } from './MyCrowdReportRepository.js'
import { MyFavoriteRepository } from './MyFavoriteRepository.js'
import { MyVehicleRepository } from './MyVehicleRepository.js'
import { MyNewsRepository } from './MyNewsRepository.js'
import { MyStationReportRepository } from './MyStationReportRepository.js'
import { MyRefreshTokenRepository } from './MyRefreshTokenRepository.js'
import { MyRouteHistoryRepository } from './MyRouteHistoryRepository.js'
import { MyOtpRepository } from './MyOtpRepository.js'

/**
 * پیاده‌سازی MySQL الگوی Unit of Work.
 *
 * withTransaction یک connection اختصاصی از pool می‌گیره، BEGIN می‌زنه،
 * repositoryهایی که با همون connection کار می‌کنن رو به callback می‌ده،
 * و در پایان یا COMMIT یا (در صورت خطا) ROLLBACK می‌کنه.
 */
export class MysqlUnitOfWork extends UnitOfWork {
  async withTransaction(work) {
    const client = await pool.getConnection()
    try {
      await client.beginTransaction()

      const repos = {
        users: new MyUserRepository(client),
        stations: new MyStationRepository(client),
        crowdReports: new MyCrowdReportRepository(client),
        favorites: new MyFavoriteRepository(client),
        vehicles: new MyVehicleRepository(client),
        news: new MyNewsRepository(client),
        stationReports: new MyStationReportRepository(client),
        refreshTokens: new MyRefreshTokenRepository(client),
        routeHistory: new MyRouteHistoryRepository(client),
        otps: new MyOtpRepository(client),
      }

      const result = await work(repos)
      await client.commit()
      return result
    } catch (err) {
      await client.rollback()
      throw err
    } finally {
      client.release()
    }
  }
}
