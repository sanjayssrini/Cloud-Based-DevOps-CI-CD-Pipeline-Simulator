import { StageType } from "@prisma/client";

export interface StageTask {
  name: string;
  command: string;
  timeoutMs?: number;
  failChance?: number;
}

export interface StageConfig {
  name: string;
  type: StageType;
  order: number;
  conditionExpr?: string;
  retryCount?: number;
  timeoutSeconds?: number;
  tasks: StageTask[];
}

export interface PipelineConfig {
  stages: StageConfig[];
}
