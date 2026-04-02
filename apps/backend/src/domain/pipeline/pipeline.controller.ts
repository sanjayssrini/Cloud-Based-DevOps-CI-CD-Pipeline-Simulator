import { Request, Response } from "express";
import { PipelineService } from "./pipeline.service.js";
import { ExecutionEngineService } from "./execution-engine.service.js";

const pipelineService = new PipelineService();
const executionEngine = new ExecutionEngineService();

export class PipelineController {
  async upsert(req: Request, res: Response) {
    const pipeline = await pipelineService.createOrUpdate(req.body.projectId, req.body.config);
    res.json(pipeline);
  }

  async get(req: Request, res: Response) {
    const pipeline = await pipelineService.get(String(req.params.projectId));
    if (!pipeline) {
      res.status(404).json({ error: "Pipeline not found" });
      return;
    }
    res.json(pipeline);
  }

  async execute(req: Request, res: Response) {
    const run = await executionEngine.executePipeline(req.body.pipelineId, req.user!.userId, req.body.seed ?? 42);
    res.status(202).json(run);
  }
}
