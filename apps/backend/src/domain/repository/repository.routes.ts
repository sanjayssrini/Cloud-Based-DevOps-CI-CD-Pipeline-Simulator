import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { RepositoryController } from "./repository.controller.js";

const router = Router();
const controller = new RepositoryController();

router.use(requireAuth);
router.post("/init", (req, res, next) => controller.init(req, res).catch(next));
router.post("/commit", (req, res, next) => controller.commit(req, res).catch(next));
router.post("/branch", (req, res, next) => controller.branch(req, res).catch(next));
router.post("/checkout", (req, res, next) => controller.checkout(req, res).catch(next));
router.post("/merge", (req, res, next) => controller.merge(req, res).catch(next));

export default router;
