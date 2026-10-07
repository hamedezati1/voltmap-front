export function createVehicleController(vehicleService) {
  return {
    async list(req, res, next) {
      try { res.json(await vehicleService.list(req.auth.userId)) } catch (err) { next(err) }
    },
    async getById(req, res, next) {
      try { res.json(await vehicleService.getById(req.params.id, req.auth.userId)) } catch (err) { next(err) }
    },
    async create(req, res, next) {
      try { res.status(201).json(await vehicleService.add(req.auth.userId, req.body)) } catch (err) { next(err) }
    },
    async update(req, res, next) {
      try { res.json(await vehicleService.update(req.params.id, req.auth.userId, req.body)) } catch (err) { next(err) }
    },
    async remove(req, res, next) {
      try { await vehicleService.delete(req.params.id, req.auth.userId); res.status(204).send() } catch (err) { next(err) }
    },
  }
}
