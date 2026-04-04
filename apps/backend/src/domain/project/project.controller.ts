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
}
