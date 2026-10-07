import { Router } from 'express'
import { createUploadController } from '../controllers/uploadController.js'
import { stationImageUpload } from '../middlewares/stationImageUpload.js'

export function uploadsRoutes(container) {
  const router = Router()
  const controller = createUploadController(container.services.imageUploadService)
  const { authenticate, requireAdmin } = container.middlewares

  router.post('/stations', authenticate, requireAdmin, stationImageUpload, controller.stationImage)

  return router
}
