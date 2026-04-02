import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { prisma } from "../../infrastructure/prisma.js";

const router = Router();
router.use(requireAuth);

router.get("/:runId/logs", async (req, res, next) => {
  try {
    const logs = await prisma.log.findMany({
      where: { runId: req.params.runId },
      orderBy: { sequence: "asc" }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get("/:runId", async (req, res, next) => {
  try {
    const run = await prisma.pipelineRun.findUnique({ where: { id: req.params.runId } });
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    res.json(run);
  } catch (error) {
    next(error);
  }
});

export default router;
