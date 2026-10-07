import { Router } from 'express'
import { createAdminController } from '../controllers/adminController.js'
import { validateBody } from '../middlewares/validate.js'
import { membershipSchema } from '../validators/adminValidators.js'

export function adminRoutes(container) {
  const router = Router()
  const controller = createAdminController(container.services.adminService)
  const { authenticate, requireAdmin } = container.middlewares

  router.use(authenticate, requireAdmin)
  router.get('/dashboard', controller.dashboard)
  router.get('/reviews', controller.reviews)
  router.delete('/stations/:stationId/reviews/:reviewId', controller.deleteReview)
  router.get('/reports/usage', controller.usageReport)
  router.get('/users', controller.listUsers)
  router.patch('/users/:userId/membership', validateBody(membershipSchema), controller.updateMembership)

  return router
}
