import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { PipelineController } from "./pipeline.controller.js";

const router = Router();
const controller = new PipelineController();

router.use(requireAuth);
router.post("/", (req, res, next) => controller.upsert(req, res).catch(next));
router.get("/:projectId", (req, res, next) => controller.get(req, res).catch(next));
router.post("/execute", (req, res, next) => controller.execute(req, res).catch(next));

export default router;
