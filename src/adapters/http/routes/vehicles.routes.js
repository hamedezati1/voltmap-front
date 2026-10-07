import { Router } from 'express'
import { createVehicleController } from '../controllers/vehicleController.js'
import { validateBody } from '../middlewares/validate.js'
import { vehicleSchema, updateVehicleSchema } from '../validators/vehicleValidators.js'

export function vehiclesRoutes(container) {
  const router = Router()
  const controller = createVehicleController(container.services.vehicleService)
  const { authenticate } = container.middlewares

  router.use(authenticate)
  router.get('/', controller.list)
  router.get('/:id', controller.getById)
  router.post('/', validateBody(vehicleSchema), controller.create)
  router.patch('/:id', validateBody(updateVehicleSchema), controller.update)
  router.delete('/:id', controller.remove)

  return router
}
