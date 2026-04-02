import { Request, Response } from "express";
import { RepositoryService } from "./repository.service.js";

const repositoryService = new RepositoryService();

export class RepositoryController {
  async init(req: Request, res: Response) {
    const repo = await repositoryService.init(req.body.projectId);
    res.status(201).json(repo);
  }

  async commit(req: Request, res: Response) {
    const commit = await repositoryService.commit(req.body.projectId, req.body.message, req.body.diff);
    res.json(commit);
  }

  async branch(req: Request, res: Response) {
    const branch = await repositoryService.branch(req.body.projectId, req.body.name);
    res.json(branch);
  }

  async checkout(req: Request, res: Response) {
    const repo = await repositoryService.checkout(req.body.projectId, req.body.branchName);
    res.json(repo);
  }

  async merge(req: Request, res: Response) {
    const result = await repositoryService.merge(req.body.projectId, req.body.sourceBranch, req.body.targetBranch);
    res.json(result);
  }
}
