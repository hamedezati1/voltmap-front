export function createNewsController(newsService) {
  return {
    async list(req, res, next) {
      try { res.json(await newsService.list()) } catch (err) { next(err) }
    },
    async create(req, res, next) {
      try { res.status(201).json(await newsService.create(req.body)) } catch (err) { next(err) }
    },
    async update(req, res, next) {
      try { res.json(await newsService.update(Number(req.params.id), req.body)) } catch (err) { next(err) }
    },
    async remove(req, res, next) {
      try { await newsService.delete(Number(req.params.id)); res.status(204).send() } catch (err) { next(err) }
    },
  }
}
