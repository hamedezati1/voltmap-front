export function createRouteController(routeService) {
  return {
    async plan(req, res, next) {
      try { res.json(await routeService.planRoute(req.auth.userId, req.body)) } catch (err) { next(err) }
    },
    async history(req, res, next) {
      try { res.json(await routeService.getHistory(req.auth.userId)) } catch (err) { next(err) }
    },
  }
}
