export function createStationReportController(stationReportService) {
  return {
    async list(req, res, next) {
      try { res.json(await stationReportService.list(req.query.status)) } catch (err) { next(err) }
    },
    async submit(req, res, next) {
      try {
        const userId = req.auth?.userId ?? null
        res.status(201).json(await stationReportService.submit(userId, req.body))
      } catch (err) { next(err) }
    },
    async approve(req, res, next) {
      try { res.json(await stationReportService.approve(req.params.id)) } catch (err) { next(err) }
    },
    async reject(req, res, next) {
      try { res.json(await stationReportService.reject(req.params.id, req.body.reason)) } catch (err) { next(err) }
    },
    async remove(req, res, next) {
      try { await stationReportService.delete(req.params.id); res.status(204).send() } catch (err) { next(err) }
    },
  }
}
