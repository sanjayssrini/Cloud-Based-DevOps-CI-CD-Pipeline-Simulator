import { EnvironmentType } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";

export class DeploymentService {
  async ensureDefaultEnvironments(projectId: string) {
    const envs = [EnvironmentType.DEV, EnvironmentType.STAGING, EnvironmentType.PROD];
    for (const env of envs) {
      await prisma.environment.upsert({
        where: { projectId_type: { projectId, type: env } },
        create: {
          projectId,
          type: env,
          baseUrl: `https://deploy.sim/${env.toLowerCase()}/project/${projectId}`,
          isActive: env === EnvironmentType.DEV
        },
        update: {}
      });
    }
  }

  async deploy(runId: string, userId: string, projectId: string, environmentType: EnvironmentType) {
    await this.ensureDefaultEnvironments(projectId);

    const target = await prisma.environment.findUniqueOrThrow({
      where: { projectId_type: { projectId, type: environmentType } }
    });

    await prisma.environment.updateMany({ where: { projectId }, data: { isActive: false } });
    await prisma.environment.update({ where: { id: target.id }, data: { isActive: true } });

    const deploymentUrl = `${target.baseUrl}?run=${runId}`;

    return prisma.deployment.create({
      data: {
        runId,
        projectId,
        userId,
        environmentId: target.id,
        deploymentUrl,
        status: "SUCCESS"
      }
    });
  }
}
