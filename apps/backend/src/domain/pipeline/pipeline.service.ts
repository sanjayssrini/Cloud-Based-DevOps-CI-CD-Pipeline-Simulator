import { Prisma, StageType } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";
import { PipelineConfig, StageConfig } from "./types.js";

export class PipelineService {
  async createOrUpdate(projectId: string, config: PipelineConfig) {
    const mappedStages = config.stages.map((stage: StageConfig) => ({
      name: stage.name,
      type: stage.type as StageType,
      order: stage.order,
      conditionExpr: stage.conditionExpr,
      retryCount: stage.retryCount ?? 0,
      timeoutSeconds: stage.timeoutSeconds ?? 30,
      tasksJson: stage.tasks as unknown as Prisma.InputJsonValue
    }));

    return prisma.pipeline.upsert({
      where: { projectId },
      update: {
        configJson: config as unknown as Prisma.InputJsonValue,
        stages: {
          deleteMany: {},
          create: mappedStages
        }
      },
      create: {
        projectId,
        configJson: config as unknown as Prisma.InputJsonValue,
        stages: {
          create: mappedStages
        }
      },
      include: { stages: { orderBy: { order: "asc" } } }
    });
  }

  async get(projectId: string) {
    return prisma.pipeline.findUnique({
      where: { projectId },
      include: { stages: { orderBy: { order: "asc" } } }
    });
  }
}
