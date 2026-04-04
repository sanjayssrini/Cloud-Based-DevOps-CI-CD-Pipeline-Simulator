import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ProjectController } from "./project.controller.js";

const router = Router();
const controller = new ProjectController();

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.includes("zip") || file.originalname.endsWith(".zip")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only ZIP files are allowed"));
  }
});

router.use(requireAuth);
router.get("/", (req, res, next) => controller.list(req, res).catch(next));
router.post("/", (req, res, next) => controller.create(req, res).catch(next));

router.get("/:projectId/workspace", (req, res, next) => controller.workspace(req, res).catch(next));
router.post("/:projectId/upload", upload.single("file"), (req, res, next) => controller.upload(req, res).catch(next));
router.delete("/:projectId", (req, res, next) => controller.delete(req, res).catch(next));

router.post("/:projectId/scripts", (req, res, next) => controller.saveBuildScript(req, res).catch(next));
router.post("/:projectId/build", (req, res, next) => controller.runBuild(req, res).catch(next));
router.post("/:projectId/tests/run", (req, res, next) => controller.runTests(req, res).catch(next));

export default router;
