import { Router } from 'express'
import { createRouteController } from '../controllers/routeController.js'
import { validateBody } from '../middlewares/validate.js'
import { planRouteSchema } from '../validators/routeValidators.js'

export function smartRoutesRoutes(container) {
  const router = Router()
  const controller = createRouteController(container.services.routeService)
  const { authenticate } = container.middlewares

  router.use(authenticate)
  router.post('/plan', validateBody(planRouteSchema), controller.plan)
  router.get('/history', controller.history)

  return router
}
