import { Role } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { LabController } from "./lab.controller.js";

const router = Router();
const controller = new LabController();

router.use(requireAuth);

router.post("/sample", (req, res, next) => controller.createSample(req, res).catch(next));
router.post("/", requireRoles(Role.INSTRUCTOR, Role.ADMIN), (req, res, next) => controller.create(req, res).catch(next));
router.get("/:labId", (req, res, next) => controller.get(req, res).catch(next));
router.post("/:labId/start", (req, res, next) => controller.start(req, res).catch(next));
router.post("/:labId/steps", (req, res, next) => controller.submitStep(req, res).catch(next));

export default router;
