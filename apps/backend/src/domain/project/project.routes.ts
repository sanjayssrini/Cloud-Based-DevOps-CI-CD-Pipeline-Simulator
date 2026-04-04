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

// GitHub import endpoints
router.post("/validate-github", (req, res, next) => controller.validateGithubRepository(req, res).catch(next));
router.post("/github-info", (req, res, next) => controller.getGithubRepositoryInfo(req, res).catch(next));

// Memory endpoints - Build Scripts
router.get("/memory/build-scripts", (req, res, next) => controller.getUserBuildScriptMemory(req, res).catch(next));
router.get("/memory/frequently-used-scripts", (req, res, next) => controller.getFrequentlyUsedScripts(req, res).catch(next));

// Memory endpoints - Test Cases
router.get("/memory/test-cases", (req, res, next) => controller.getUserTestCaseMemory(req, res).catch(next));
router.get("/memory/frequently-used-tests", (req, res, next) => controller.getFrequentlyUsedTestCases(req, res).catch(next));
router.get("/memory/test-templates", (req, res, next) => controller.getTestTemplates(req, res).catch(next));

router.get("/:projectId/workspace", (req, res, next) => controller.workspace(req, res).catch(next));
router.post("/:projectId/upload", upload.single("file"), (req, res, next) => controller.upload(req, res).catch(next));
router.post("/:projectId/import-github", (req, res, next) => controller.importFromGithub(req, res).catch(next));
router.delete("/:projectId", (req, res, next) => controller.delete(req, res).catch(next));

// Memory endpoints - Project specific
router.get("/:projectId/memory/build-scripts", (req, res, next) => controller.getProjectBuildScriptMemory(req, res).catch(next));
router.post("/:projectId/memory/build-scripts/favorite", (req, res, next) => controller.toggleFavoriteBuildScript(req, res).catch(next));

router.get("/:projectId/memory/test-cases", (req, res, next) => controller.getProjectTestCaseMemory(req, res).catch(next));
router.post("/:projectId/memory/test-cases/favorite", (req, res, next) => controller.toggleFavoriteTestCase(req, res).catch(next));
router.get("/:projectId/memory/test-cases/history", (req, res, next) => controller.getTestCaseExecutionHistory(req, res).catch(next));

router.post("/:projectId/scripts", (req, res, next) => controller.saveBuildScript(req, res).catch(next));
router.post("/:projectId/build", (req, res, next) => controller.runBuild(req, res).catch(next));
router.post("/:projectId/tests/run", (req, res, next) => controller.runTests(req, res).catch(next));

export default router;
