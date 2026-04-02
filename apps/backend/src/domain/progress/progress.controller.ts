import { Request, Response } from "express";
import { prisma } from "../../infrastructure/prisma.js";

export class ProgressController {
  async mine(req: Request, res: Response) {
    const progress = await prisma.progress.findMany({
      where: { userId: req.user!.userId },
      include: { lab: true }
    });
    res.json(progress);
  }
}
