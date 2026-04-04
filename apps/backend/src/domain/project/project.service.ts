import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { Prisma, ProjectType, StageType } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";
import { ProjectAnalysisService } from "./project-analysis.service.js";
import { BuildEngineService, type BuildPlan } from "./build-engine.service.js";

const analysis = new ProjectAnalysisService();
const buildEngine = new BuildEngineService();

type SupportedScriptLanguage = "dockerfile" | "bash" | "yaml";

interface StoredBuildScript {
  id: string;
  name: string;
  language: string;
  script: string;
  createdAt: string;
}

interface RunTestCaseInput {
  id?: string;
  name: string;
  command: string;
  expected?: string;
}

interface NormalizedTestCase {
  id: string;
  name: string;
  command: string;
  expected?: string;
}

interface TestExecutionResult {
  id: string;
  name: string;
  command: string;
  passed: boolean;
  output: string;
  durationMs: number;
}

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

    await prisma.$transaction(async (tx) => {
      const pipeline = await tx.pipeline.findUnique({
        where: { projectId },
        select: { id: true }
      });

      if (pipeline) {
        const runs = await tx.pipelineRun.findMany({
          where: { pipelineId: pipeline.id },
          select: { id: true }
        });
        const runIds = runs.map((run) => run.id);

        if (runIds.length > 0) {
          await tx.log.deleteMany({ where: { runId: { in: runIds } } });
          await tx.deployment.deleteMany({ where: { runId: { in: runIds } } });
        }

        await tx.pipelineRun.deleteMany({ where: { pipelineId: pipeline.id } });
        await tx.pipelineStage.deleteMany({ where: { pipelineId: pipeline.id } });
        await tx.pipeline.delete({ where: { id: pipeline.id } });
      }

      const repository = await tx.repository.findUnique({
        where: { projectId },
        select: { id: true }
      });

      if (repository) {
        await tx.branch.updateMany({
          where: { repositoryId: repository.id },
          data: { headCommitId: null }
        });
        await tx.commit.deleteMany({ where: { repositoryId: repository.id } });
        await tx.branch.deleteMany({ where: { repositoryId: repository.id } });
        await tx.repository.delete({ where: { id: repository.id } });
      }

      await tx.deployment.deleteMany({ where: { projectId } });
      await tx.environment.deleteMany({ where: { projectId } });
      await tx.artifact.deleteMany({ where: { projectId } });
      await tx.project.delete({ where: { id: projectId } });
    });

    const uploadDir = path.join(process.cwd(), "uploads", projectId);
    if (fs.existsSync(uploadDir)) {
      try {
        fs.rmSync(uploadDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to remove upload directory for project ${projectId}`, error);
      }
    }

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

  async runBuild(projectId: string, userId: string, scriptId?: string | null, deterministicSeed?: number) {
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

    // Use deterministic seed based on project ID if not provided
    const seedForBuild = deterministicSeed ?? this.computeDeterministicSeed(projectId);

    // Detect project type first (may be overridden by script language)
    const detectedProjectType = buildEngine.detectProjectType(projectRoot);

    // Resolve script source: explicit scriptId first, then project file auto-detection
    const explicitScript = scriptId ? this.readStoredBuildScript(projectId, scriptId) : null;
    const detectedScript = explicitScript ? null : this.detectBuildScriptFromProjectFiles(projectRoot);
    const selectedScript = explicitScript || detectedScript;

    let buildPlan: BuildPlan;
    let buildSource: "auto" | "script" | "file" = "auto";
    let scriptLanguage: SupportedScriptLanguage | null = null;
    let scriptName: string | null = null;

    if (selectedScript && this.isSupportedScriptLanguage(selectedScript.language)) {
      buildPlan = buildEngine.generateBuildPlanFromScript({
        language: selectedScript.language,
        content: selectedScript.script,
        name: selectedScript.name
      });
      buildSource = explicitScript ? "script" : "file";
      scriptLanguage = selectedScript.language;
      scriptName = selectedScript.name;
      buildPlan.source = buildSource;
    } else {
      buildPlan = buildEngine.generateBuildPlan(detectedProjectType, projectRoot);
    }

    const resolvedProjectType = buildPlan.projectType || detectedProjectType;

    // Execute build with Build Engine (deterministic mode for demo)
    const result = await buildEngine.executeBuild(buildPlan, projectRoot, {
      deterministicSeed: seedForBuild,
      failureChance: 0.08
    });

    // Create artifact directory
    const artifactDir = path.join(process.cwd(), "uploads", projectId, "artifacts");
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    // Save build metadata
    const buildMetadata = {
      projectId,
      projectType: resolvedProjectType,
      scriptId: scriptId || null,
      buildSource,
      scriptLanguage,
      scriptName,
      status: result.status,
      startedAt: new Date(result.startTime),
      completedAt: new Date(result.endTime),
      duration: result.duration,
      stepsExecuted: result.stepsExecuted,
      totalSteps: result.totalSteps,
      artifactPath: result.artifactPath,
      deterministicSeed: seedForBuild,
      buildPlan
    };

    // Save to file system for persistence
    const buildFile = path.join(artifactDir, `build_${result.startTime}.json`);
    fs.writeFileSync(buildFile, JSON.stringify(buildMetadata, null, 2));

    // Return build result with logs
    const buildLog = {
      id: `build_${result.startTime}`,
      projectId,
      scriptId: scriptId || null,
      status: result.status,
      startedAt: new Date(result.startTime),
      completedAt: new Date(result.endTime),
      duration: result.duration,
      logs: result.logs,
      exitCode: result.exitCode,
      artifactPath: result.artifactPath,
      stepsExecuted: result.stepsExecuted,
      totalSteps: result.totalSteps,
      projectType: resolvedProjectType,
      buildSource,
      scriptLanguage,
      scriptName,
      buildPlan: {
        steps: buildPlan.steps.map(s => ({ name: s.name, description: s.description }))
      }
    };

    return buildLog;
  }

  async runTests(projectId: string, userId: string, tests: RunTestCaseInput[], deterministicSeed?: number) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        type: true,
        pipeline: { select: { id: true } }
      }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const normalizedTests = tests
      .filter((test) => typeof test?.name === "string" && typeof test?.command === "string")
      .map((test, index) => ({
        id: test.id && test.id.trim().length > 0 ? test.id : `test-${index + 1}`,
        name: test.name.trim(),
        command: test.command.trim(),
        expected: test.expected?.trim() || undefined
      }))
      .filter((test) => test.name.length > 0 && test.command.length > 0);

    const runSeed = deterministicSeed ?? this.computeDeterministicSeed(projectId);
    const startedAt = Date.now();

    const results = normalizedTests.map((test, index) =>
      this.executeSimulatedTest(test, project.type, runSeed + index)
    );

    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    return {
      projectId,
      pipelineId: project.pipeline?.id ?? null,
      seed: runSeed,
      total: results.length,
      passed,
      failed,
      durationMs: Date.now() - startedAt,
      results
    };
  }

  private computeDeterministicSeed(projectId: string): number {
    return Math.abs(projectId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
  }

  private executeSimulatedTest(test: NormalizedTestCase, projectType: ProjectType, seed: number): TestExecutionResult {
    const command = test.command.toLowerCase();
    const passRate = this.getCommandPassRate(command, projectType);

    let passed = this.deterministicScore(`${seed}:${test.id}:${test.command}`) <= passRate;
    const durationMs = 120 + Math.floor(this.deterministicScore(`${seed}:${test.name}:duration`) * 900);

    if (command.includes(" fail") || command.startsWith("fail") || command.includes("--fail")) {
      passed = false;
    }

    let output = passed
      ? `PASS ${test.name}\nCommand: ${test.command}\nDuration: ${durationMs}ms\nAssertions complete.`
      : `FAIL ${test.name}\nCommand: ${test.command}\nDuration: ${durationMs}ms\nAssertion failed in simulated runner.`;

    if (test.expected) {
      const expectedMatched = output.toLowerCase().includes(test.expected.toLowerCase());
      if (!expectedMatched) {
        passed = false;
        output += `\nExpected output mismatch: \"${test.expected}\" was not found.`;
      }
    }

    return {
      id: test.id,
      name: test.name,
      command: test.command,
      passed,
      output,
      durationMs
    };
  }

  private deterministicScore(input: string): number {
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) % 1000003;
    }

    return (hash % 1000) / 1000;
  }

  private getCommandPassRate(command: string, projectType: ProjectType): number {
    if (command.includes("integration")) {
      return 0.78;
    }

    if (command.includes("e2e") || command.includes("cypress") || command.includes("playwright")) {
      return 0.74;
    }

    if (command.includes("lint")) {
      return 0.84;
    }

    if (command.includes("build")) {
      return 0.9;
    }

    if (command.includes("test") || command.includes("pytest") || command.includes("mvn test")) {
      return 0.88;
    }

    if (projectType === ProjectType.STATIC) {
      return 0.92;
    }

    return 0.86;
  }

  private readStoredBuildScript(projectId: string, scriptId: string): StoredBuildScript | null {
    const scriptFile = path.join(process.cwd(), "uploads", projectId, "scripts", `${scriptId}.json`);
    if (!fs.existsSync(scriptFile)) {
      return null;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(scriptFile, "utf-8")) as StoredBuildScript;
      if (!parsed || typeof parsed.script !== "string" || typeof parsed.language !== "string") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private detectBuildScriptFromProjectFiles(projectRoot: string): StoredBuildScript | null {
    const now = new Date().toISOString();
    const rootEntries = fs.readdirSync(projectRoot);

    const dockerfileName = rootEntries.find((entry) => entry.toLowerCase() === "dockerfile");
    if (dockerfileName) {
      const scriptPath = path.join(projectRoot, dockerfileName);
      return {
        id: "detected-dockerfile",
        name: dockerfileName,
        language: "dockerfile",
        script: fs.readFileSync(scriptPath, "utf-8"),
        createdAt: now
      };
    }

    const bashCandidates = [
      "build.sh",
      "ci.sh",
      "scripts/build.sh",
      "scripts/ci.sh",
      ".ci/build.sh"
    ];
    const bashScript = this.readFirstExisting(projectRoot, bashCandidates);
    if (bashScript) {
      return {
        id: "detected-bash",
        name: bashScript.name,
        language: "bash",
        script: bashScript.content,
        createdAt: now
      };
    }

    const yamlCandidates = [
      ".gitlab-ci.yml",
      ".gitlab-ci.yaml",
      "pipeline.yml",
      "pipeline.yaml",
      "ci.yml",
      "ci.yaml"
    ];
    const yamlScript = this.readFirstExisting(projectRoot, yamlCandidates);
    if (yamlScript) {
      return {
        id: "detected-yaml",
        name: yamlScript.name,
        language: "yaml",
        script: yamlScript.content,
        createdAt: now
      };
    }

    const workflowDir = path.join(projectRoot, ".github", "workflows");
    if (fs.existsSync(workflowDir)) {
      const workflowFile = fs
        .readdirSync(workflowDir)
        .find((file) => file.endsWith(".yml") || file.endsWith(".yaml"));
      if (workflowFile) {
        const workflowPath = path.join(workflowDir, workflowFile);
        return {
          id: "detected-workflow",
          name: path.join(".github", "workflows", workflowFile),
          language: "yaml",
          script: fs.readFileSync(workflowPath, "utf-8"),
          createdAt: now
        };
      }
    }

    return null;
  }

  private readFirstExisting(projectRoot: string, relativePaths: string[]): { name: string; content: string } | null {
    for (const relativePath of relativePaths) {
      const fullPath = path.join(projectRoot, relativePath);
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      return {
        name: relativePath,
        content: fs.readFileSync(fullPath, "utf-8")
      };
    }

    return null;
  }

  private isSupportedScriptLanguage(language: string): language is SupportedScriptLanguage {
    return language === "dockerfile" || language === "bash" || language === "yaml";
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
