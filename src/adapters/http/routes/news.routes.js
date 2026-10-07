import { Router } from 'express'
import { createNewsController } from '../controllers/newsController.js'
import { validateBody } from '../middlewares/validate.js'
import { newsSchema, updateNewsSchema } from '../validators/newsValidators.js'

export function newsRoutes(container) {
  const router = Router()
  const controller = createNewsController(container.services.newsService)
  const { authenticate, requireAdmin } = container.middlewares

  router.get('/', controller.list)
  router.post('/', authenticate, requireAdmin, validateBody(newsSchema), controller.create)
  router.patch('/:id', authenticate, requireAdmin, validateBody(updateNewsSchema), controller.update)
  router.delete('/:id', authenticate, requireAdmin, controller.remove)

  return router
}
