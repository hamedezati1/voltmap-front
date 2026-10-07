import { Router } from 'express'
import { createStationReportController } from '../controllers/stationReportController.js'
import { validateBody } from '../middlewares/validate.js'
import { stationReportSchema, rejectReportSchema } from '../validators/stationReportValidators.js'

export function stationReportsRoutes(container) {
  const router = Router()
  const controller = createStationReportController(container.services.stationReportService)
  const { authenticate, requireAdmin, optionalAuthenticate } = container.middlewares

  router.get('/', authenticate, requireAdmin, controller.list)
  router.post('/', optionalAuthenticate, validateBody(stationReportSchema), controller.submit)
  router.patch('/:id/approve', authenticate, requireAdmin, controller.approve)
  router.patch('/:id/reject', authenticate, requireAdmin, validateBody(rejectReportSchema), controller.reject)
  router.delete('/:id', authenticate, requireAdmin, controller.remove)

  return router
}
