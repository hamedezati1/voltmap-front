import jwt from 'jsonwebtoken'
import { config } from '../../../config/index.js'
import { TokenService } from '../../../application/ports/services/TokenService.js'
import { UnauthorizedError } from '../../../domain/errors/AppError.js'

export class JwtTokenService extends TokenService {
  signAccessToken(payload) {
    return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtl })
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.accessSecret)
    } catch {
      throw new UnauthorizedError('توکن نامعتبر یا منقضی شده است')
    }
  }

  signRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshTtl })
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret)
    } catch {
      throw new UnauthorizedError('refresh token نامعتبر یا منقضی شده است')
    }
  }
}
