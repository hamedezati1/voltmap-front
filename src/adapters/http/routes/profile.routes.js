import { Router } from 'express'
import { createProfileController } from '../controllers/profileController.js'
import { validateBody } from '../middlewares/validate.js'
import { updateProfileSchema } from '../validators/profileValidators.js'

export function profileRoutes(container) {
  const router = Router()
  const controller = createProfileController(container.services.profileService)
  const { authenticate } = container.middlewares

  router.use(authenticate)
  router.get('/', controller.get)
  router.patch('/', validateBody(updateProfileSchema), controller.update)
  router.get('/favorites', controller.favorites)
  router.post('/favorites/:id', controller.addFavorite)
  router.delete('/favorites/:id', controller.removeFavorite)

  return router
}
