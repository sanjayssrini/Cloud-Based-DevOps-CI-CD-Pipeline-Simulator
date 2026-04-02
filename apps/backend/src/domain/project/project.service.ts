import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { Prisma, ProjectType, StageType } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";
import { ProjectAnalysisService } from "./project-analysis.service.js";
import { BuildExecutorService } from "./build-executor.service.js";

const analysis = new ProjectAnalysisService();
const buildExecutor = new BuildExecutorService();

export class ProjectService {
  async createProject(userId: string, payload: { name: string; description?: string }) {
    return prisma.project.create({
      data: {
        name: payload.name,
        description: payload.description,
        userId
      }
    });
  }

  async uploadAndAnalyze(projectId: string, zipPath: string) {
    const extractDir = path.join(process.cwd(), "uploads", projectId, "extracted");
    fs.mkdirSync(extractDir, { recursive: true });

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractDir, true);

    const projectRoot = analysis.findProjectRoot(extractDir);
    const type = analysis.detectProjectType(projectRoot);
    const dependencies = analysis.analyzeDependencies(projectRoot, type);
    const buildSteps = analysis.generateBuildSteps(type);
    const autoConfig = analysis.generatePipelineConfig(type, buildSteps);

    await prisma.repository.upsert({
      where: { projectId },
      create: {
        projectId,
        currentBranch: "main",
        branches: {
          create: {
            name: "main"
          }
        }
      },
      update: {}
    });

    const mappedStages = autoConfig.stages.map((stage) => ({
      name: stage.name,
      type: stage.type as StageType,
      order: stage.order,
      conditionExpr: stage.conditionExpr,
      retryCount: stage.retryCount,
      timeoutSeconds: stage.timeoutSeconds,
      tasksJson: stage.tasks as unknown as Prisma.InputJsonValue
    }));

    const pipeline = await prisma.pipeline.upsert({
      where: { projectId },
      create: {
        projectId,
        configJson: autoConfig as unknown as Prisma.InputJsonValue,
        stages: {
          create: mappedStages
        }
      },
      update: {
        configJson: autoConfig as unknown as Prisma.InputJsonValue,
        stages: {
          deleteMany: {},
          create: mappedStages
        }
      },
      include: { stages: { orderBy: { order: "asc" } } }
    });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        uploadPath: zipPath,
        type: type as ProjectType,
        analysisJson: {
          projectRoot,
          dependencies,
          buildSteps
        }
      },
      include: {
        repository: true,
        pipeline: true
      }
    });

    return {
      ...project,
      autoPipeline: pipeline
    };
  }

  async listProjects(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: {
        pipeline: true,
        repository: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async getWorkspace(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        pipeline: {
          include: {
            stages: { orderBy: { order: "asc" } },
            runs: { orderBy: { startedAt: "desc" }, take: 5 }
          }
        },
        repository: {
          include: {
            branches: true,
            commits: { orderBy: { createdAt: "desc" }, take: 10 }
          }
        }
      }
    });

    // Extract structure from analyzed project
    const extractDir = path.join(process.cwd(), "uploads", projectId, "extracted");
    const structure = this.buildFileTree(extractDir);
    const files = this.detectKeyFiles(extractDir);

    return {
      ...project,
      structure,
      files
    };
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Delete uploads folder
    const uploadDir = path.join(process.cwd(), "uploads", projectId);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    // Delete from database
    await prisma.project.delete({
      where: { id: projectId }
    });

    return { success: true };
  }

  async saveBuildScript(projectId: string, userId: string, payload: { name: string; language: string; script: string }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Store build script in file system for this session
    const scriptDir = path.join(process.cwd(), "uploads", projectId, "scripts");
    fs.mkdirSync(scriptDir, { recursive: true });

    const scriptId = `script_${Date.now()}`;
    const scriptFile = path.join(scriptDir, `${scriptId}.json`);

    const scriptData = {
      id: scriptId,
      ...payload,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(scriptFile, JSON.stringify(scriptData, null, 2));

    return scriptData;
  }

  async runBuild(projectId: string, userId: string, scriptId?: string | null) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Get the project root from the uploaded files
    const extractDir = path.join(process.cwd(), "uploads", projectId, "extracted");
    const projectRoot = analysis.findProjectRoot(extractDir);

    if (!fs.existsSync(projectRoot)) {
      throw new Error("Project root not found");
    }

    // Load build script if provided
    let customCommand: string | undefined;
    if (scriptId) {
      const scriptFile = path.join(process.cwd(), "uploads", projectId, "scripts", `${scriptId}.json`);
      if (fs.existsSync(scriptFile)) {
        const scriptData = JSON.parse(fs.readFileSync(scriptFile, "utf-8"));
        if (scriptData.language === "dockerfile") {
          customCommand = "docker build -t project:latest .";
        } else if (scriptData.language === "bash") {
          // For bash script, extract commands and join them
          // Remove shebang and common bash boilerplate
          let script = scriptData.script
            .split("\n")
            .filter((line: string) => {
              const trimmed = line.trim();
              return trimmed && !trimmed.startsWith("#!") && !trimmed.startsWith("#");
            })
            .map((line: string) => line.trim())
            .filter((line: string) => line)
            .join(" && ");
          
          customCommand = script;
        } else if (scriptData.language === "yaml") {
          // For YAML, extract commands from script blocks
          const lines = scriptData.script.split("\n");
          const commands: string[] = [];
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("- ")) {
              commands.push(trimmed.substring(2));
            }
          }
          
          if (commands.length > 0) {
            customCommand = commands.join(" && ");
          }
        }
      }
    }

    // Execute the build
    const result = await buildExecutor.executeBuild(projectRoot, customCommand);

    // Return build result with logs
    const buildLog = {
      id: `build_${Date.now()}`,
      projectId,
      scriptId: scriptId || null,
      status: result.success ? ("success" as const) : ("failed" as const),
      startedAt: new Date(),
      completedAt: new Date(),
      duration: result.duration,
      output: result.output,
      logs: result.logs,
      exitCode: result.exitCode
    };

    return buildLog;
  }

  private buildFileTree(dirPath: string, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth || !fs.existsSync(dirPath)) {
      return null;
    }

    const tree: any = {};
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip node_modules, dist, build, .git, etc.
      if ([".git", "node_modules", "dist", ".next", "build", ".vscode"].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        const subTree = this.buildFileTree(path.join(dirPath, entry.name), maxDepth, currentDepth + 1);
        if (subTree !== null) {
          tree[entry.name] = subTree;
        }
      } else {
        tree[entry.name] = true;
      }
    }

    return Object.keys(tree).length > 0 ? tree : null;
  }

  private detectKeyFiles(dirPath: string): { [key: string]: boolean } {
    const keyFiles = [
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "tsconfig.json",
      "Dockerfile",
      ".dockerignore",
      "docker-compose.yml",
      ".github/workflows/main.yml",
      "Jenkinsfile",
      ".gitlab-ci.yml",
      "README.md",
      "pom.xml",
      "build.gradle",
      "Makefile",
      "requirements.txt",
      "setup.py"
    ];

    const files: { [key: string]: boolean } = {};

    for (const file of keyFiles) {
      const filePath = path.join(dirPath, file);
      files[file] = fs.existsSync(filePath);
    }

    return files;
  }
}
