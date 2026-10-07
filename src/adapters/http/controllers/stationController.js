export function createStationController(stationService) {
  return {
    async list(req, res, next) {
      try { res.json(await stationService.list(req.query)) } catch (err) { next(err) }
    },
    async getById(req, res, next) {
      try { res.json(await stationService.getById(Number(req.params.id))) } catch (err) { next(err) }
    },
    async create(req, res, next) {
      try { res.status(201).json(await stationService.create(req.body)) } catch (err) { next(err) }
    },
    async update(req, res, next) {
      try { res.json(await stationService.update(Number(req.params.id), req.body)) } catch (err) { next(err) }
    },
    async remove(req, res, next) {
      try { await stationService.delete(Number(req.params.id)); res.status(204).send() } catch (err) { next(err) }
    },
    async addReview(req, res, next) {
      try {
        const station = await stationService.addReview(Number(req.params.id), {
          userId: req.auth?.userId,
          text: req.body.text,
          rating: req.body.rating,
        })
        res.status(201).json(station)
      } catch (err) { next(err) }
    },
    async updateStatus(req, res, next) {
      try { res.json(await stationService.updateStatus(Number(req.params.id), req.body.status)) } catch (err) { next(err) }
    },
    async submitCrowdReport(req, res, next) {
      try {
        const userId = req.auth?.userId ?? null
        res.json(await stationService.submitCrowdReport(Number(req.params.id), req.body.type, userId))
      } catch (err) { next(err) }
    },
    async getCrowdStats(req, res, next) {
      try { res.json(await stationService.getCrowdStats(Number(req.params.id))) } catch (err) { next(err) }
    },
    async getAllCrowdStats(req, res, next) {
      try { res.json(await stationService.getAllCrowdStats()) } catch (err) { next(err) }
    },
  }
}
