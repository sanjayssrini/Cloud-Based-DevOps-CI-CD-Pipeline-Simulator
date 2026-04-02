import { EnvironmentType, RunStatus } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";
import { DeploymentService } from "../deployment/deployment.service.js";
import { HttpError } from "../../shared/httpError.js";
import { LogService } from "./log.service.js";

type TaskConfig = {
  name: string;
  command: string;
  timeoutMs?: number;
  failChance?: number;
};

const deploymentService = new DeploymentService();
const logService = new LogService();

export class ExecutionEngineService {
  private sequence = 1;

  private deterministicValue(seed: number, key: string): number {
    let hash = seed;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % 100000;
    }
    return (hash % 1000) / 1000;
  }

  private evaluateCondition(conditionExpr: string | null, context: Record<string, unknown>): boolean {
    if (!conditionExpr) {
      return true;
    }

    if (conditionExpr === "always") {
      return true;
    }

    if (conditionExpr === "onSuccess") {
      return context.previousStageFailed !== true;
    }

    return false;
  }

  async executePipeline(pipelineId: string, userId: string, seed = 42) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: {
        project: true,
        stages: { orderBy: { order: "asc" } }
      }
    });

    if (!pipeline) {
      throw new HttpError(404, "Pipeline not found");
    }

    const run = await prisma.pipelineRun.create({
      data: {
        pipelineId,
        userId,
        status: RunStatus.RUNNING,
        deterministicSeed: seed,
        startedAt: new Date()
      }
    });

    this.sequence = 1;
    let failed = false;
    let timedOut = false;
    let previousStageFailed = false;

    await logService.append(run.id, "SYSTEM", this.sequence++, "INFO", `Run ${run.id} started with seed ${seed}`);

    for (const stage of pipeline.stages) {
      const canRun = this.evaluateCondition(stage.conditionExpr, { previousStageFailed });
      if (!canRun) {
        await logService.append(run.id, stage.name, this.sequence++, "WARN", `Stage skipped by condition: ${stage.conditionExpr}`);
        continue;
      }

      await logService.append(run.id, stage.name, this.sequence++, "INFO", `Entering stage ${stage.name}`);
      const tasks = stage.tasksJson as TaskConfig[];
      let stageFailed = false;

      for (const task of tasks) {
        let succeeded = false;
        const maxAttempts = (stage.retryCount ?? 0) + 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          await logService.append(
            run.id,
            stage.name,
            this.sequence++,
            "INFO",
            `Task ${task.name} executing (attempt ${attempt}/${maxAttempts})`
          );

          const timeoutMs = task.timeoutMs ?? stage.timeoutSeconds * 1000;
          const deterministic = this.deterministicValue(seed + attempt, `${stage.name}:${task.name}`);
          const failureThreshold = task.failChance ?? 0.1;

          if (timeoutMs < 50) {
            timedOut = true;
            await logService.append(run.id, stage.name, this.sequence++, "ERROR", `Task ${task.name} timed out`);
            break;
          }

          if (deterministic < failureThreshold) {
            await logService.append(run.id, stage.name, this.sequence++, "ERROR", `Task failed: ${task.command}`);
          } else {
            await logService.append(run.id, stage.name, this.sequence++, "SUCCESS", `Task succeeded: ${task.command}`);
            succeeded = true;
            break;
          }
        }

        if (timedOut) {
          stageFailed = true;
          break;
        }

        if (!succeeded) {
          stageFailed = true;
          await logService.append(run.id, stage.name, this.sequence++, "ERROR", `Stage failed at task ${task.name}`);
          break;
        }
      }

      await logService.append(run.id, stage.name, this.sequence++, "INFO", `Exiting stage ${stage.name}`);
      previousStageFailed = stageFailed;
      if (stageFailed) {
        failed = true;
        break;
      }
    }

    let status: RunStatus = RunStatus.SUCCESS;
    if (timedOut) {
      status = RunStatus.TIMED_OUT;
    } else if (failed) {
      status = RunStatus.FAILED;
    }

    let deployment = null;
    if (status === RunStatus.SUCCESS) {
      deployment = await deploymentService.deploy(run.id, userId, pipeline.projectId, EnvironmentType.DEV);
      await logService.append(run.id, "DEPLOY", this.sequence++, "SUCCESS", `Deployment URL: ${deployment.deploymentUrl}`);
    }

    const finalized = await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        resultJson: {
          failed,
          timedOut,
          deployed: !!deployment,
          deploymentUrl: deployment?.deploymentUrl ?? null
        }
      }
    });

    await logService.append(run.id, "SYSTEM", this.sequence++, "INFO", `Run completed with status ${status}`);
    return finalized;
  }
}
