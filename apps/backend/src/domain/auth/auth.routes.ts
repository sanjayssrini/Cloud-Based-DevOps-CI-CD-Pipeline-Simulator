import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

const router = Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), (req, res, next) => controller.register(req, res).catch(next));
router.post("/login", validate(loginSchema), (req, res, next) => controller.login(req, res).catch(next));
router.post("/refresh", (req, res, next) => controller.refresh(req, res).catch(next));

export default router;
