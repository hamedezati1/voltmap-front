import { Router } from 'express'
import { createCarCatalogController } from '../controllers/carCatalogController.js'

/**
 * کاتالوگ خودروهای برقی ایران — عمومی (بدون نیاز به لاگین)
 * GET /api/cars
 * GET /api/cars/brands
 * GET /api/cars/:id
 */
export function carsRoutes(container) {
  const router = Router()
  const controller = createCarCatalogController(container.services.carCatalogService)

  router.get('/', controller.list)
  router.get('/brands', controller.listBrands)
  router.get('/:id', controller.getById)

  return router
}
