export function createAdminController(adminService) {
  return {
    async dashboard(req, res, next) {
      try { res.json(await adminService.getDashboardStats()) } catch (err) { next(err) }
    },
    async reviews(req, res, next) {
      try { res.json(await adminService.getAllReviews()) } catch (err) { next(err) }
    },
    async deleteReview(req, res, next) {
      try {
        res.json(await adminService.deleteReview(req.params.stationId, req.params.reviewId))
      } catch (err) { next(err) }
    },
    async usageReport(req, res, next) {
      try { res.json(await adminService.getUsageReport(Number(req.query.days) || 7)) } catch (err) { next(err) }
    },
    async updateMembership(req, res, next) {
      try { res.json(await adminService.updateUserMembership(req.params.userId, req.body.membership)) } catch (err) { next(err) }
    },
    async listUsers(req, res, next) {
      try { res.json(await adminService.listUsers()) } catch (err) { next(err) }
    },
  }
}
