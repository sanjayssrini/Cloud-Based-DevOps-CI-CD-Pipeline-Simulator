import { EnvironmentType } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { DeploymentService } from "./deployment.service.js";
import { DeploymentService as DeploymentSimulationService } from "./deployment-simulation.service.js";

const router = Router();
const deploymentService = new DeploymentService();

router.use(requireAuth);

/**
 * Legacy endpoint: Switch deployment environment from pipeline run
 */
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

/**
 * New endpoint: Simulate a deployment to a specific environment
 * POST /deployment/simulate
 */
router.post("/simulate", async (req, res, next) => {
  try {
    const { projectId, environmentType } = req.body;

    if (!projectId || !environmentType) {
      return res.status(400).json({
        error: "Missing required fields: projectId, environmentType"
      });
    }

    const deployment = await DeploymentSimulationService.simulateDeployment(
      projectId,
      req.user!.userId,
      environmentType as "development" | "staging" | "production"
    );

    res.json({
      success: true,
      deployment
    });
  } catch (error) {
    next(error);
  }
});

/**
 * New endpoint: Get deployment metrics for a project
 * GET /deployment/metrics?projectId={projectId}
 */
router.get("/metrics", async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        error: "Missing required query parameter: projectId"
      });
    }

    const metrics = await DeploymentSimulationService.getDeploymentMetrics(
      projectId as string
    );

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * New endpoint: Get deployment history
 * GET /deployment/history?projectId={projectId}&environmentType={type}
 */
router.get("/history", async (req, res, next) => {
  try {
    const { projectId, environmentType } = req.query;

    if (!projectId) {
      return res.status(400).json({
        error: "Missing required query parameter: projectId"
      });
    }

    const history = await DeploymentSimulationService.getDeploymentHistory(
      projectId as string,
      environmentType as string | undefined
    );

    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * New endpoint: Rollback deployment to a previous version
 * POST /deployment/rollback
 */
router.post("/rollback", async (req, res, next) => {
  try {
    const { projectId, environmentId, targetVersion } = req.body;

    if (!projectId || !environmentId || !targetVersion) {
      return res.status(400).json({
        error: "Missing required fields: projectId, environmentId, targetVersion"
      });
    }

    const rollback = await DeploymentSimulationService.rollbackDeployment(
      projectId,
      req.user!.userId,
      environmentId,
      targetVersion
    );

    res.json({
      success: true,
      rollback
    });
  } catch (error) {
    next(error);
  }
});

/**
 * New endpoint: Get deployment by ID
 * GET /deployment/:deploymentId
 */
router.get("/:deploymentId", async (req, res, next) => {
  try {
    const deployment = await DeploymentSimulationService.getDeployment(
      req.params.deploymentId
    );

    if (!deployment) {
      return res.status(404).json({
        error: "Deployment not found"
      });
    }

    res.json(deployment);
  } catch (error) {
    next(error);
  }
});

/**
 * New endpoint: Cancel an in-progress deployment
 * POST /deployment/:deploymentId/cancel
 */
router.post("/:deploymentId/cancel", async (req, res, next) => {
  try {
    const deployment = await DeploymentSimulationService.cancelDeployment(
      req.params.deploymentId
    );

    res.json({
      success: true,
      deployment
    });
  } catch (error) {
    next(error);
  }
});

export default router;
