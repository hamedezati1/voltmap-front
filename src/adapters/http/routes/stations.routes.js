import { Router } from "express";
import { createStationController } from "../controllers/stationController.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import {
  stationQuerySchema,
  createStationSchema,
  updateStationSchema,
  reviewSchema,
  statusSchema,
  crowdReportSchema,
} from "../validators/stationValidators.js";

export function stationsRoutes(container) {
  const router = Router();
  const controller = createStationController(container.services.stationService);
  const { authenticate, requireAdmin, optionalAuthenticate } =
    container.middlewares;

  router.get("/", validateQuery(stationQuerySchema), controller.list);
  router.get(
    "/crowd-reports/summary",
    authenticate,
    requireAdmin,
    controller.getAllCrowdStats,
  );
  router.get("/:id", controller.getById);
  router.post(
    "/",
    authenticate,
    requireAdmin,
    validateBody(createStationSchema),
    controller.create,
  );
  router.patch(
    "/:id",
    authenticate,
    requireAdmin,
    validateBody(updateStationSchema),
    controller.update,
  );
  router.delete("/:id", authenticate, requireAdmin, controller.remove);
  router.post(
    "/:id/reviews",
    authenticate,
    validateBody(reviewSchema),
    controller.addReview,
  );
  router.patch(
    "/:id/status",
    authenticate,
    requireAdmin,
    validateBody(statusSchema),
    controller.updateStatus,
  );
  router.post(
    "/:id/crowd-report",
    optionalAuthenticate,
    validateBody(crowdReportSchema),
    controller.submitCrowdReport,
  );
  router.get("/:id/crowd-reports", authenticate, controller.getCrowdStats);

  return router;
}
