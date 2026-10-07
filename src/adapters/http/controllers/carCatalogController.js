export function createCarCatalogController(carCatalogService) {
  return {
    async list(req, res, next) {
      try {
        const { brand, bodyType, connector, search } = req.query
        const cars = await carCatalogService.list({ brand, bodyType, connector, search })
        res.json(cars)
      } catch (err) {
        next(err)
      }
    },

    async getById(req, res, next) {
      try {
        res.json(await carCatalogService.getById(Number(req.params.id)))
      } catch (err) {
        next(err)
      }
    },

    async listBrands(req, res, next) {
      try {
        res.json(await carCatalogService.listBrands())
      } catch (err) {
        next(err)
      }
    },
  }
}
