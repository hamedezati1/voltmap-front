/**
 * Composition Root (نقطه‌ی ترکیب وابستگی‌ها).
 *
 * این تنها جایی در کل پروژه‌ست که پیاده‌سازی‌های مشخص (MySQL, sms.ir, jwt) رو می‌شناسه.
 * همه‌جای دیگه (Serviceها، Controllerها) فقط با Interface/Port کار می‌کنن.
 * اگر یک روز خواستی از MySQL به یک DB دیگه بری،
 * فقط کافیه یک پیاده‌سازی جدید از هر Repository interface بنویسی و اینجا wire کنی.
 */
import path from 'node:path'
import { config } from '../config/index.js'

import { MyUserRepository } from '../adapters/persistence/mysql/MyUserRepository.js'
import { MyStationRepository } from '../adapters/persistence/mysql/MyStationRepository.js'
import { MyCrowdReportRepository } from '../adapters/persistence/mysql/MyCrowdReportRepository.js'
import { MyFavoriteRepository } from '../adapters/persistence/mysql/MyFavoriteRepository.js'
import { MyVehicleRepository } from '../adapters/persistence/mysql/MyVehicleRepository.js'
import { MyNewsRepository } from '../adapters/persistence/mysql/MyNewsRepository.js'
import { MyStationReportRepository } from '../adapters/persistence/mysql/MyStationReportRepository.js'
import { MyRefreshTokenRepository } from '../adapters/persistence/mysql/MyRefreshTokenRepository.js'
import { MyRouteHistoryRepository } from '../adapters/persistence/mysql/MyRouteHistoryRepository.js'
import { MyCarCatalogRepository } from '../adapters/persistence/mysql/MyCarCatalogRepository.js'
import { MysqlUnitOfWork } from '../adapters/persistence/mysql/MysqlUnitOfWork.js'
import { MyOtpRepository } from '../adapters/persistence/mysql/MyOtpRepository.js'
import { JwtTokenService } from '../adapters/persistence/security/JwtTokenService.js'
import { SmsIrSender } from '../adapters/sms/SmsIrSender.js'
import { ConsoleSmsSender } from '../adapters/sms/ConsoleSmsSender.js'

import { AuthService } from '../application/services/AuthService.js'
import { StationService } from '../application/services/StationService.js'
import { ProfileService } from '../application/services/ProfileService.js'
import { VehicleService } from '../application/services/VehicleService.js'
import { NewsService } from '../application/services/NewsService.js'
import { StationReportService } from '../application/services/StationReportService.js'
import { AdminService } from '../application/services/AdminService.js'
import { RouteService } from '../application/services/RouteService.js'
import { OsrmDrivingRouter } from '../adapters/routing/OsrmDrivingRouter.js'
import { CarCatalogService } from '../application/services/CarCatalogService.js'
import { ImageUploadService } from '../application/services/ImageUploadService.js'
import { LocalImageStorage } from '../adapters/storage/LocalImageStorage.js'

import { authenticate, optionalAuthenticate, requireAdmin } from '../adapters/http/middlewares/authenticate.js'
import { logger } from './logger.js'

function buildSmsSender() {
  const { sms } = config
  if (sms.enabled && sms.apiKey && sms.templateId) {
    logger.info('SMS provider: sms.ir Verify API')
    return new SmsIrSender({
      apiKey: sms.apiKey,
      templateId: sms.templateId,
      templateParam: sms.templateParam,
    })
  }
  logger.warn('SMS provider: Console (DEV) — OTP در لاگ سرور چاپ می‌شود. برای ارسال واقعی SMS_IR_ENABLED=true و کلید/قالب را تنظیم کنید.')
  return new ConsoleSmsSender()
}

export function buildContainer() {
  // ── Repositories (Adapters خارج) ──────────────────────────────────────
  const repositories = {
    userRepository: new MyUserRepository(),
    stationRepository: new MyStationRepository(),
    crowdReportRepository: new MyCrowdReportRepository(),
    favoriteRepository: new MyFavoriteRepository(),
    vehicleRepository: new MyVehicleRepository(),
    newsRepository: new MyNewsRepository(),
    stationReportRepository: new MyStationReportRepository(),
    refreshTokenRepository: new MyRefreshTokenRepository(),
    routeHistoryRepository: new MyRouteHistoryRepository(),
    carCatalogRepository: new MyCarCatalogRepository(),
    otpRepository: new MyOtpRepository(),
  }

  const unitOfWork = new MysqlUnitOfWork()
  const tokenService = new JwtTokenService()
  const smsSender = buildSmsSender()

  // ── Services (Application layer) ──────────────────────────────────────
  const services = {
    authService: new AuthService({
      userRepository: repositories.userRepository,
      refreshTokenRepository: repositories.refreshTokenRepository,
      otpRepository: repositories.otpRepository,
      smsSender,
      tokenService,
      unitOfWork,
      jwtConfig: config.jwt,
      otpConfig: config.otp,
    }),
    stationService: new StationService({
      stationRepository: repositories.stationRepository,
      crowdReportRepository: repositories.crowdReportRepository,
      userRepository: repositories.userRepository,
      unitOfWork,
    }),
    profileService: new ProfileService({
      userRepository: repositories.userRepository,
      favoriteRepository: repositories.favoriteRepository,
      stationRepository: repositories.stationRepository,
    }),
    vehicleService: new VehicleService({
      vehicleRepository: repositories.vehicleRepository,
      carCatalogRepository: repositories.carCatalogRepository,
      unitOfWork,
    }),
    newsService: new NewsService({ newsRepository: repositories.newsRepository }),
    stationReportService: new StationReportService({ stationReportRepository: repositories.stationReportRepository }),
    adminService: new AdminService({
      stationRepository: repositories.stationRepository,
      userRepository: repositories.userRepository,
    }),
    routeService: new RouteService({
      routeHistoryRepository: repositories.routeHistoryRepository,
      stationRepository: repositories.stationRepository,
      vehicleRepository: repositories.vehicleRepository,
      drivingRouter: new OsrmDrivingRouter({
        baseUrl: config.routing.osrmBaseUrl,
        timeoutMs: config.routing.timeoutMs,
      }),
    }),
    carCatalogService: new CarCatalogService({
      carCatalogRepository: repositories.carCatalogRepository,
    }),
    imageUploadService: new ImageUploadService({
      imageStorage: new LocalImageStorage({ rootDir: path.resolve(config.storage.dir) }),
    }),
  }

  // ── Middlewares که به tokenService وابسته‌اند ──────────────────────────
  const middlewares = {
    authenticate: authenticate(tokenService),
    optionalAuthenticate: optionalAuthenticate(tokenService),
    requireAdmin,
  }

  return { repositories, services, middlewares, tokenService, smsSender }
}
