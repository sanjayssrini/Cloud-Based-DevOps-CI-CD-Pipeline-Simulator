import { prisma } from "../../infrastructure/prisma.js";
import { LogService } from "../pipeline/log.service.js";

interface DeploymentStage {
  id: string;
  name: string;
  tasks: DeploymentTask[];
}

interface DeploymentTask {
  name: string;
  duration: number; // milliseconds
}

interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number; // seconds
  successRate: number; // percentage
}

const DEPLOYMENT_STAGES: DeploymentStage[] = [
  {
    id: "checkout",
    name: "🔄 Checkout Repository",
    tasks: [
      { name: "Cloning repository from remote...", duration: 1500 },
      { name: "Checking out main branch...", duration: 800 },
      { name: "Installing dependencies...", duration: 2000 }
    ]
  },
  {
    id: "build",
    name: "🔨 Build Application",
    tasks: [
      { name: "Running TypeScript compilation...", duration: 2500 },
      { name: "Building Docker image...", duration: 3000 },
      { name: "Running pre-flight checks...", duration: 1000 }
    ]
  },
  {
    id: "test",
    name: "✅ Run Deploy Tests",
    tasks: [
      { name: "Validating configuration...", duration: 1000 },
      { name: "Checking environment variables...", duration: 800 },
      { name: "Testing health endpoints...", duration: 1500 }
    ]
  },
  {
    id: "push",
    name: "📤 Push to Registry",
    tasks: [
      { name: "Authenticating to registry...", duration: 800 },
      { name: "Pushing image to container registry...", duration: 2500 },
      { name: "Verifying image integrity...", duration: 1000 }
    ]
  },
  {
    id: "rollout",
    name: "🚀 Kubernetes Rollout",
    tasks: [
      { name: "Connecting to cluster...", duration: 1000 },
      { name: "Creating deployment objects...", duration: 1500 },
      { name: "Waiting for replicas to be ready...", duration: 2000 },
      { name: "Updating service routing...", duration: 800 }
    ]
  },
  {
    id: "health",
    name: "❤️ Health Checks",
    tasks: [
      { name: "Polling health endpoints...", duration: 1000 },
      { name: "Checking database connectivity...", duration: 1200 },
      { name: "Verifying API responsiveness...", duration: 1000 },
      { name: "Confirming all services online...", duration: 800 }
    ]
  },
  {
    id: "smoke",
    name: "🔥 Smoke Tests",
    tasks: [
      { name: "Testing critical user flows...", duration: 2000 },
      { name: "Validating API responses...", duration: 1500 },
      { name: "Confirming core functionality...", duration: 1200 }
    ]
  },
  {
    id: "monitor",
    name: "👁️ Start Monitoring",
    tasks: [
      { name: "Enabling metrics collection...", duration: 800 },
      { name: "Activating distributed tracing...", duration: 600 },
      { name: "Starting log aggregation...", duration: 500 },
      { name: "Configuring alert rules...", duration: 800 }
    ]
  }
];

export class DeploymentService {
  /**
   * Simulate a complete deployment to a specific environment
   */
  static async simulateDeployment(
    projectId: string,
    userId: string,
    environmentType: "development" | "staging" | "production"
  ) {
    const startTime = Date.now();
    const newVersion = this.generateNewVersion();

    // Ensure default environments exist
    await this.ensureDefaultEnvironments(projectId);

    // Create deployment record
    const environment = await prisma.environment.findFirst({
      where: {
        projectId,
        type: environmentType
      }
    });

    if (!environment) {
      throw new Error(`Environment ${environmentType} not found for project ${projectId}`);
    }

    const deployment = await prisma.deployment.create({
      data: {
        userId,
        environmentId: environment.id,
        version: newVersion,
        status: "IN_PROGRESS",
        startedAt: new Date()
      },
      include: {
        environment: true
      }
    });

    // Simulate stages sequentially
    let deploymentSuccess = true;

    for (let i = 0; i < DEPLOYMENT_STAGES.length; i++) {
      const stage = DEPLOYMENT_STAGES[i];
      const stageSuccess = await this.executeStage(
        projectId,
        deployment.id,
        stage,
        i,
        environmentType
      );

      if (!stageSuccess) {
        deploymentSuccess = false;
        break;
      }
    }

    // Update deployment status
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    const finalStatus = deploymentSuccess ? "SUCCESS" : "FAILED";
    const updatedDeployment = await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: finalStatus,
        version: deploymentSuccess ? newVersion : undefined,
        completedAt: new Date(),
        duration
      },
      include: {
        environment: true
      }
    });

    // Update environment if successful
    if (deploymentSuccess) {
      await prisma.environment.update({
        where: { id: environment.id },
        data: {
          isActive: true,
          currentVersion: newVersion,
          lastDeploymentAt: new Date(),
          metadata: {
            lastDeploymentDuration: duration,
            lastDeploymentBy: userId
          } as any
        }
      });
    }

    return updatedDeployment;
  }

  /**
   * Execute a single deployment stage
   */
  private static async executeStage(
    projectId: string,
    deploymentId: string,
    stage: DeploymentStage,
    stageIndex: number,
    environmentType: string
  ): Promise<boolean> {
    const stageShouldFail = Math.random() < 0.1; // 10% failure rate for stages after build

    let totalStageDuration = 0;

    for (const task of stage.tasks) {
      // Simulate task work
      await new Promise((resolve) =>
        setTimeout(resolve, task.duration)
      );
      totalStageDuration += task.duration;

      // Simulate occasional task failures (5% chance per task)
      const taskFailed = Math.random() < 0.05;
      if (taskFailed && stageIndex > 3) {
        return false; // Fail the deployment
      }
    }

    return !stageShouldFail || stageIndex < 4; // Fail stages after rollout
  }

  /**
   * Rollback to a previous version
   */
  static async rollbackDeployment(
    projectId: string,
    userId: string,
    environmentId: string,
    targetVersion: string
  ) {
    const startTime = Date.now();

    const environment = await prisma.environment.findUnique({
      where: { id: environmentId }
    });

    if (!environment) {
      throw new Error("Environment not found");
    }

    // Create rollback deployment record
    const rollback = await prisma.deployment.create({
      data: {
        userId,
        environmentId,
        version: targetVersion,
        status: "ROLLBACK_IN_PROGRESS",
        startedAt: new Date()
      },
      include: {
        environment: true
      }
    });

    // Simulate rollback stages
    const rollbackStages = DEPLOYMENT_STAGES.slice(4); // Start from rollout stage

    for (const stage of rollbackStages) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 2000 + 1000)
      );
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    const updatedRollback = await prisma.deployment.update({
      where: { id: rollback.id },
      data: {
        status: "ROLLBACK_SUCCESS",
        completedAt: new Date(),
        duration
      },
      include: {
        environment: true
      }
    });

    // Update environment to previous version
    await prisma.environment.update({
      where: { id: environmentId },
      data: {
        currentVersion: targetVersion,
        lastDeploymentAt: new Date()
      }
    });

    return updatedRollback;
  }

  /**
   * Get deployment metrics
   */
  static async getDeploymentMetrics(projectId: string): Promise<DeploymentMetrics> {
    const deployments = await prisma.deployment.findMany({
      where: {
        environment: {
          projectId
        }
      }
    });

    const successfulDeployments = deployments.filter(
      (d) => d.status === "SUCCESS" || d.status === "ROLLBACK_SUCCESS"
    ).length;

    const failedDeployments = deployments.filter((d) =>
      ["FAILED", "ROLLBACK_FAILED"].includes(d.status)
    ).length;

    const completedDeployments = deployments.filter(
      (d) => d.completedAt !== null
    );

    const averageDuration =
      completedDeployments.length > 0
        ? Math.round(
            completedDeployments
              .filter((d) => d.duration)
              .reduce((sum, d) => sum + (d.duration || 0), 0) / completedDeployments.length
          )
        : 0;

    const totalDeployments = deployments.length;
    const successRate =
      totalDeployments > 0
        ? Math.round((successfulDeployments / totalDeployments) * 100)
        : 0;

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      averageDeploymentTime: averageDuration,
      successRate
    };
  }

  /**
   * Get deployment history for an environment
   */
  static async getDeploymentHistory(projectId: string, environmentType?: string) {
    const where: any = {
      environment: {
        projectId
      }
    };

    if (environmentType) {
      where.environment.type = environmentType;
    }

    const deployments = await prisma.deployment.findMany({
      where,
      include: {
        environment: true,
        user: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return deployments;
  }

  /**
   * Ensure default environments exist for a project
   */
  static async ensureDefaultEnvironments(projectId: string) {
    const defaultEnvs: Array<{
      type: "DEVELOPMENT" | "STAGING" | "PRODUCTION";
      name: string;
      baseUrl: string;
    }> = [
      {
        type: "DEVELOPMENT",
        name: "Development",
        baseUrl: `https://deploy.sim/dev/project/${projectId}`
      },
      {
        type: "STAGING",
        name: "Staging",
        baseUrl: `https://deploy.sim/staging/project/${projectId}`
      },
      {
        type: "PRODUCTION",
        name: "Production",
        baseUrl: `https://deploy.sim/prod/project/${projectId}`
      }
    ];

    for (const env of defaultEnvs) {
      await prisma.environment.upsert({
        where: {
          projectId_type: {
            projectId,
            type: env.type
          }
        },
        create: {
          projectId,
          type: env.type,
          name: env.name,
          baseUrl: env.baseUrl,
          isActive: false,
          currentVersion: "v1.0.0"
        },
        update: {}
      });
    }
  }

  /**
   * Generate a new semantic version
   */
  private static generateNewVersion(): string {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    const patch = Math.floor(Math.random() * 10);
    return `v1.${now.getMonth() + 1}.${patch}`;
  }

  /**
   * Get deployment by ID
   */
  static async getDeployment(deploymentId: string) {
    return prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        environment: true,
        user: true
      }
    });
  }

  /**
   * Cancel an in-progress deployment
   */
  static async cancelDeployment(deploymentId: string) {
    return prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "CANCELLED",
        completedAt: new Date()
      },
      include: {
        environment: true
      }
    });
  }
}
