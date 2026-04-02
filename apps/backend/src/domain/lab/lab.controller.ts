import { Request, Response } from "express";
import { LabService } from "./lab.service.js";

const service = new LabService();

export class LabController {
  async createSample(req: Request, res: Response) {
    const lab = await service.createSampleLab(req.user!.userId);
    res.status(201).json(lab);
  }

  async create(req: Request, res: Response) {
    const lab = await service.createLab(req.user!.userId, req.body);
    res.status(201).json(lab);
  }

  async get(req: Request, res: Response) {
    const lab = await service.getLab(String(req.params.labId));
    if (!lab) {
      res.status(404).json({ error: "Lab not found" });
      return;
    }
    res.json(lab);
  }

  async start(req: Request, res: Response) {
    const result = await service.startLab(req.user!.userId, String(req.params.labId));
    res.json(result);
  }

  async submitStep(req: Request, res: Response) {
    const result = await service.submitStep(req.user!.userId, String(req.params.labId), req.body.stepOrder, req.body.state ?? {});
    res.json(result);
  }
}
