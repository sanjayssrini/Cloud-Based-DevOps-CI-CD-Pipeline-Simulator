import { Request, Response } from "express";
import { ProjectService } from "./project.service.js";

const projectService = new ProjectService();

export class ProjectController {
  async create(req: Request, res: Response) {
    const project = await projectService.createProject(req.user!.userId, req.body);
    res.status(201).json(project);
  }

  async upload(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    if (!req.file) {
      res.status(400).json({ error: "ZIP file is required" });
      return;
    }

    const project = await projectService.uploadAndAnalyze(projectId, req.file.path);
    res.json(project);
  }

  async list(req: Request, res: Response) {
    const projects = await projectService.listProjects(req.user!.userId);
    res.json(projects);
  }

  async workspace(req: Request, res: Response) {
    const project = await projectService.getWorkspace(String(req.params.projectId), req.user!.userId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.json(project);
  }

  async delete(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const result = await projectService.deleteProject(projectId, req.user!.userId);
    res.json(result);
  }

  async saveBuildScript(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const script = await projectService.saveBuildScript(projectId, req.user!.userId, req.body);
    res.status(201).json(script);
  }

  async runBuild(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const { scriptId, deterministicSeed } = req.body;
    const buildLog = await projectService.runBuild(projectId, req.user!.userId, scriptId, deterministicSeed);
    res.json(buildLog);
  }

  async runTests(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const tests = Array.isArray(req.body?.tests) ? req.body.tests : [];
    const result = await projectService.runTests(projectId, req.user!.userId, tests, req.body?.deterministicSeed);
    res.json(result);
  }

  async importFromGithub(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const { repository, token, branch } = req.body;

    if (!repository) {
      res.status(400).json({ error: "Repository URL is required" });
      return;
    }

    const project = await projectService.importFromGithub(projectId, req.user!.userId, {
      repository,
      token,
      branch
    });
    res.json(project);
  }

  async validateGithubRepository(req: Request, res: Response) {
    const { repository, token } = req.body;

    if (!repository) {
      res.status(400).json({ error: "Repository is required" });
      return;
    }

    const result = await projectService.validateGithubRepository(repository, token);
    res.json(result);
  }

  async getGithubRepositoryInfo(req: Request, res: Response) {
    const { repository, token } = req.body;

    if (!repository) {
      res.status(400).json({ error: "Repository is required" });
      return;
    }

    const info = await projectService.getGithubRepositoryInfo(repository, token);
    res.json(info);
  }

  // Build Script Memory Endpoints
  async getUserBuildScriptMemory(req: Request, res: Response) {
    const memory = await projectService.getUserBuildScriptMemory(req.user!.userId);
    res.json(memory);
  }

  async getProjectBuildScriptMemory(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const memory = await projectService.getProjectBuildScriptMemory(projectId, req.user!.userId);
    res.json(memory);
  }

  async getFrequentlyUsedScripts(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const scripts = await projectService.getFrequentlyUsedScripts(req.user!.userId, limit);
    res.json(scripts);
  }

  async toggleFavoriteBuildScript(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const { scriptId, isFavorite } = req.body;

    if (!scriptId) {
      res.status(400).json({ error: "Script ID is required" });
      return;
    }

    const result = await projectService.toggleFavoriteBuildScript(
      projectId,
      req.user!.userId,
      scriptId,
      isFavorite
    );
    res.json(result);
  }

  // Test Case Memory Endpoints
  async getUserTestCaseMemory(req: Request, res: Response) {
    const memory = await projectService.getUserTestCaseMemory(req.user!.userId);
    res.json(memory);
  }

  async getProjectTestCaseMemory(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const memory = await projectService.getProjectTestCaseMemory(projectId, req.user!.userId);
    res.json(memory);
  }

  async getFrequentlyUsedTestCases(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const testCases = await projectService.getFrequentlyUsedTestCases(req.user!.userId, limit);
    res.json(testCases);
  }

  async toggleFavoriteTestCase(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const { testCaseId, isFavorite } = req.body;

    if (!testCaseId) {
      res.status(400).json({ error: "Test Case ID is required" });
      return;
    }

    const result = await projectService.toggleFavoriteTestCase(projectId, req.user!.userId, testCaseId, isFavorite);
    res.json(result);
  }

  async getTestCaseExecutionHistory(req: Request, res: Response) {
    const projectId = String(req.params.projectId);
    const { testCaseId } = req.query;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;

    if (!testCaseId) {
      res.status(400).json({ error: "Test Case ID is required" });
      return;
    }

    const history = await projectService.getTestCaseExecutionHistory(String(testCaseId), limit);
    res.json(history);
  }

  async getTestTemplates(req: Request, res: Response) {
    const { projectType } = req.query;

    if (!projectType) {
      res.status(400).json({ error: "Project type is required" });
      return;
    }

    const templates = await projectService.getTestTemplates(String(projectType));
    res.json(templates);
  }
}

