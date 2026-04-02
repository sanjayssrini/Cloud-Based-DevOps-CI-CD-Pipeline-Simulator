import { EnvironmentType } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { DeploymentService } from "./deployment.service.js";

const router = Router();
const deploymentService = new DeploymentService();

router.use(requireAuth);

router.post("/switch", async (req, res, next) => {
  try {
    const { runId, projectId, environmentType } = req.body;
    const deployment = await deploymentService.deploy(
      runId,
      req.user!.userId,
      projectId,
      environmentType as EnvironmentType
    );
    res.json(deployment);
  } catch (error) {
    next(error);
  }
});

export default router;
