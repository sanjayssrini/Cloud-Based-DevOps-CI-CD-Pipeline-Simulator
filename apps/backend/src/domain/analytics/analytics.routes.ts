import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { AnalyticsService } from "./analytics.service.js";

const router = Router();
const analytics = new AnalyticsService();

router.use(requireAuth);
router.get("/pipeline", async (req, res, next) => {
  try {
    const stats = await analytics.pipelineStats(req.user!.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
