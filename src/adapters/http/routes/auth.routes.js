import { Router } from 'express'
import { createAuthController } from '../controllers/authController.js'
import { authRateLimiter } from '../middlewares/rateLimiters.js'
import { validateBody } from '../middlewares/validate.js'
import { requestOtpSchema, verifyOtpSchema } from '../validators/authValidators.js'
import { verifyCsrf, issueCsrfToken } from '../middlewares/csrf.js'

export function authRoutes(container) {
  const router = Router()
  const controller = createAuthController(container.services.authService)
  const authenticate = container.middlewares.authenticate

  router.get('/csrf-token', issueCsrfToken)
  router.post('/otp/request', authRateLimiter, validateBody(requestOtpSchema), controller.requestOtp)
  router.post('/otp/verify', authRateLimiter, validateBody(verifyOtpSchema), controller.verifyOtp)
  router.post('/refresh', authRateLimiter, verifyCsrf, controller.refresh)
  router.post('/logout', verifyCsrf, controller.logout)
  router.get('/me', authenticate, controller.me)

  return router
}
