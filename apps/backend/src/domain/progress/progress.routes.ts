import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ProgressController } from "./progress.controller.js";

const router = Router();
const controller = new ProgressController();

router.use(requireAuth);
router.get("/mine", (req, res, next) => controller.mine(req, res).catch(next));

export default router;
