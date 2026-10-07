export function createProfileController(profileService) {
  return {
    async get(req, res, next) {
      try { res.json(await profileService.getProfile(req.auth.userId)) } catch (err) { next(err) }
    },
    async update(req, res, next) {
      try { res.json(await profileService.updateProfile(req.auth.userId, req.body)) } catch (err) { next(err) }
    },
    async favorites(req, res, next) {
      try { res.json(await profileService.listFavorites(req.auth.userId)) } catch (err) { next(err) }
    },
    async addFavorite(req, res, next) {
      try { await profileService.addFavorite(req.auth.userId, Number(req.params.id)); res.status(201).json({ ok: true }) } catch (err) { next(err) }
    },
    async removeFavorite(req, res, next) {
      try { await profileService.removeFavorite(req.auth.userId, Number(req.params.id)); res.status(204).send() } catch (err) { next(err) }
    },
  }
}
