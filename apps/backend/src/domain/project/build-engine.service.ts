import path from "node:path";
import fs from "node:fs";

export interface BuildStep {
  name: string;
  command: string;
  description?: string;
  successRate?: number;
}

export interface BuildPlan {
  projectType: string;
  steps: BuildStep[];
  estimatedDuration: number;
  source?: "auto" | "script" | "file";
  scriptLanguage?: "dockerfile" | "bash" | "yaml";
}

export interface BuildLog {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  source?: string;
  stage?: string;
}

export interface BuildResult {
  status: "success" | "failed";
  startTime: number;
  endTime: number;
  duration: number;
  logs: BuildLog[];
  exitCode: number;
  artifactPath?: string;
  stepsExecuted: number;
  totalSteps: number;
}

export interface DeterministicRandom {
  seed: number;
  next(): number;
}

export interface ScriptBuildInput {
  language: "dockerfile" | "bash" | "yaml";
  content: string;
  name?: string;
}

/**
 * Seeded Random Number Generator for Deterministic Builds
 * Ensures reproducible results for demo purposes
 */
class SeededRandom implements DeterministicRandom {
  seed: number;
  private m = 2147483647; // 2^31 - 1
  private a = 1664525;
  private c = 1013904223;

  constructor(seed: number) {
    this.seed = seed % this.m;
  }

  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }
}

/**
 * Log Stream for Building Timestamped, Stage-Based Terminal Output
 */
class LogStream {
  private logs: BuildLog[] = [];
  private startTime: number = Date.now();

  append(message: string, level: BuildLog["level"] = "info", source?: string, stage?: string) {
    const log: BuildLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      stage
    };
    this.logs.push(log);
  }

  getLogs(): BuildLog[] {
    return [...this.logs];
  }

  getFormattedLogs(): string {
    return this.logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const prefix = log.source ? `[${time}] [${log.source}]` : `[${time}]`;
        return `${prefix} ${log.message}`;
      })
      .join("\n");
  }

  clear() {
    this.logs = [];
  }
}

/**
 * Build Engine Service - Core Simulation Engine
 * 
 * Handles:
 * - Project type detection
 * - Build plan generation
 * - Step-by-step execution with simulated delays
 * - Realistic log generation
 * - Failure simulation
 * - Deterministic (seeded) execution mode
 * - Artifact generation
 */
export class BuildEngineService {
  private logStream = new LogStream();
  private isDeterministic = false;
  private random: DeterministicRandom | null = null;

  /**
   * Detect project type from files
   */
  detectProjectType(projectRoot: string): string {
    const files = fs.readdirSync(projectRoot);
    const lowerFiles = new Set(files.map((file) => file.toLowerCase()));

    if (lowerFiles.has("pom.xml") || lowerFiles.has("build.gradle")) {
      return "java";
    }
    if (lowerFiles.has("package.json")) {
      return "nodejs";
    }
    if (lowerFiles.has("requirements.txt") || lowerFiles.has("pyproject.toml")) {
      return "python";
    }
    if (lowerFiles.has("dockerfile")) {
      return "docker";
    }
    if (lowerFiles.has("index.html")) {
      return "static";
    }

    return "unknown";
  }

  /**
   * Generate build plan based on project type
   */
  generateBuildPlan(projectType: string, projectRoot: string): BuildPlan {
    const steps: BuildStep[] = [];
    let estimatedDuration = 0;

    switch (projectType.toLowerCase()) {
      case "nodejs":
        steps.push(
          { name: "Install Dependencies", command: "npm install", description: "Installing npm packages", successRate: 0.95 },
          { name: "Lint Code", command: "npm run lint", description: "Running linter checks", successRate: 0.90 },
          { name: "Build Project", command: "npm run build", description: "Compiling TypeScript/JavaScript", successRate: 0.92 }
        );
        estimatedDuration = 45000; // 45 seconds
        break;

      case "python":
        steps.push(
          { name: "Install Dependencies", command: "pip install -r requirements.txt", description: "Installing Python packages", successRate: 0.94 },
          { name: "Lint Code", command: "pylint src/ || true", description: "Running Python linter", successRate: 0.88 },
          { name: "Build Package", command: "python setup.py build || echo 'No setup.py'", description: "Building Python package", successRate: 0.93 }
        );
        estimatedDuration = 50000; // 50 seconds
        break;

      case "java":
        steps.push(
          { name: "Clean Build", command: "mvn clean || gradle clean", description: "Cleaning previous builds", successRate: 0.98 },
          { name: "Compile Code", command: "mvn compile || gradle build", description: "Compiling Java source", successRate: 0.90 },
          { name: "Run Tests", command: "mvn test || gradle test", description: "Executing unit tests", successRate: 0.88 }
        );
        estimatedDuration = 60000; // 60 seconds
        break;

      case "docker":
        steps.push(
          { name: "Build Docker Image", command: "docker build -t project:latest .", description: "Building Docker container", successRate: 0.91 },
          { name: "Tag Image", command: "docker tag project:latest project:v1.0", description: "Tagging Docker image", successRate: 0.99 }
        );
        estimatedDuration = 40000; // 40 seconds
        break;

      case "static":
        steps.push(
          { name: "Validate HTML", command: "htmlhint . || echo 'HTML validated'", description: "Validating HTML files", successRate: 0.96 },
          { name: "Minify Assets", command: "echo 'Assets minified'", description: "Minifying CSS and JavaScript", successRate: 0.98 }
        );
        estimatedDuration = 15000; // 15 seconds
        break;

      default:
        steps.push({ name: "Manual Build", command: "echo 'Unknown project type'", description: "Please configure build manually", successRate: 1.0 });
        estimatedDuration = 5000;
    }

    return {
      projectType,
      steps,
      estimatedDuration,
      source: "auto"
    };
  }

  /**
   * Generate build plan from an explicit script (Dockerfile/Bash/YAML)
   */
  generateBuildPlanFromScript(input: ScriptBuildInput): BuildPlan {
    const language = input.language;
    let steps: BuildStep[] = [];

    if (language === "dockerfile") {
      steps = this.parseDockerfileSteps(input.content);
    } else if (language === "bash") {
      steps = this.parseBashSteps(input.content);
    } else {
      steps = this.parseYamlSteps(input.content);
    }

    if (steps.length === 0) {
      steps = [
        {
          name: "Validate Script",
          command: "echo 'No executable lines found in script'",
          description: "Script parsed but no runnable commands were found",
          successRate: 0.99
        }
      ];
    }

    const projectType = language === "dockerfile" ? "docker" : language;
    const estimatedDuration = Math.max(steps.length * 4500, 8000);

    return {
      projectType,
      steps,
      estimatedDuration,
      source: "script",
      scriptLanguage: language
    };
  }

  /**
   * Execute build with simulated delays and realistic output
   */
  async executeBuild(
    buildPlan: BuildPlan,
    projectRoot: string,
    options?: {
      deterministicSeed?: number;
      failureChance?: number;
    }
  ): Promise<BuildResult> {
    const startTime = Date.now();
    this.logStream = new LogStream();

    // Enable deterministic mode if seed provided
    if (options?.deterministicSeed !== undefined) {
      this.isDeterministic = true;
      this.random = new SeededRandom(options.deterministicSeed);
    } else {
      this.isDeterministic = false;
      this.random = null;
    }

    const failureChance = options?.failureChance || 0.08;

    // Log build start
    this.logStream.append(`🚀 Starting build for ${buildPlan.projectType} project...`, "info", "BUILD");
    this.logStream.append(`📦 Detected ${buildPlan.projectType} project type`, "info", "SYSTEM");
    this.logStream.append(
      `📋 ${buildPlan.steps.length} build steps will be executed`,
      "info",
      "SYSTEM"
    );
    await this.sleep(500);

    let stepsExecuted = 0;
    let failed = false;

    for (const [index, step] of buildPlan.steps.entries()) {
      if (failed) break;

      stepsExecuted++;
      const stepNumber = index + 1;

      // Log step start
      this.logStream.append(
        `\n[${stepNumber}/${buildPlan.steps.length}] ${step.name}`,
        "info",
        "SYSTEM",
        step.name
      );
      this.logStream.append(
        `→ Running: ${step.command}`,
        "info",
        "EXEC",
        step.name
      );

      // Simulate execution delay (500-1500ms)
      const delay = this.getRandomDelay(500, 1500);
      await this.sleep(delay);

      // Simulate log output based on step type
      this.generateStepLogs(step, buildPlan.projectType);

      // Check for failure
      const shouldFail = this.shouldFail(failureChance, step.successRate);
      if (shouldFail) {
        failed = true;
        this.logStream.append(
          `❌ ${step.name} failed! Exit code: 1`,
          "error",
          "ERROR",
          step.name
        );
        this.logStream.append(
          `Error output: Command '${step.command}' exited with non-zero status`,
          "error",
          "STDERR"
        );
      } else {
        this.logStream.append(
          `✅ ${step.name} completed successfully`,
          "success",
          "SUCCESS",
          step.name
        );
      }

      await this.sleep(300);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log build summary
    await this.sleep(500);
    if (!failed) {
      this.logStream.append("\n" + "═".repeat(60), "info", "SYSTEM");
      this.logStream.append(`✅ BUILD SUCCESSFUL`, "success", "BUILD");
      this.logStream.append(
        `Completed ${stepsExecuted}/${buildPlan.steps.length} steps in ${duration}ms`,
        "success",
        "BUILD"
      );
      this.logStream.append(
        `📦 Artifacts generated: /artifacts/${Date.now()}`,
        "success",
        "BUILD"
      );
      this.logStream.append("═".repeat(60), "info", "SYSTEM");
    } else {
      this.logStream.append("\n" + "═".repeat(60), "error", "SYSTEM");
      this.logStream.append(`❌ BUILD FAILED`, "error", "BUILD");
      this.logStream.append(
        `Failed at step ${stepsExecuted}/${buildPlan.steps.length}`,
        "error",
        "BUILD"
      );
      this.logStream.append("═".repeat(60), "error", "SYSTEM");
    }

    return {
      status: failed ? "failed" : "success",
      startTime,
      endTime,
      duration,
      logs: this.logStream.getLogs(),
      exitCode: failed ? 1 : 0,
      artifactPath: failed ? undefined : `/artifacts/build-${Date.now()}`,
      stepsExecuted,
      totalSteps: buildPlan.steps.length
    };
  }

  /**
   * Generate realistic logs based on step type
   */
  private generateStepLogs(step: BuildStep, projectType: string) {
    const stepLogs: string[] = [];
    const normalizedCommand = step.command.trim().toLowerCase();

    if (normalizedCommand.startsWith("from ")) {
      const image = step.command.split(/\s+/).slice(1).join(" ").trim() || "base image";
      stepLogs.push(`Pulling base image ${image}...`);
      stepLogs.push("Resolving image layers...");
      stepLogs.push("Base image ready");
    } else if (normalizedCommand.startsWith("workdir ")) {
      const targetDir = step.command.split(/\s+/).slice(1).join(" ").trim();
      stepLogs.push(`Switching working directory to ${targetDir || "/app"}`);
      stepLogs.push("Directory context updated");
    } else if (normalizedCommand.startsWith("copy ") || normalizedCommand.startsWith("add ")) {
      stepLogs.push("Collecting files from build context...");
      stepLogs.push("Validating copy rules...");
      stepLogs.push("Files copied successfully");
    } else if (normalizedCommand.startsWith("run ")) {
      const shellCommand = step.command.slice(4).trim() || "<empty>";
      stepLogs.push(`Executing shell instruction: ${shellCommand}`);
      if (shellCommand.includes("npm install")) {
        stepLogs.push(`added ${this.getRandomInt(10, 70)} packages`);
      }
      if (shellCommand.includes("npm run build")) {
        stepLogs.push(`Compiled ${this.getRandomInt(8, 65)} files`);
      }
      if (shellCommand.includes("pip install")) {
        stepLogs.push(`Installed ${this.getRandomInt(5, 35)} Python dependencies`);
      }
      stepLogs.push("RUN instruction completed");
    } else if (normalizedCommand.startsWith("cmd ") || normalizedCommand.startsWith("entrypoint ")) {
      stepLogs.push("Configuring container startup command...");
      stepLogs.push("Startup metadata updated");
    } else if (normalizedCommand.startsWith("expose ")) {
      stepLogs.push(`Registered exposed ports from instruction: ${step.command}`);
      stepLogs.push("Network metadata prepared");
    } else if (normalizedCommand.startsWith("echo ")) {
      const message = step.command.replace(/^echo\s+/i, "").trim();
      stepLogs.push(message.replace(/^['"]|['"]$/g, ""));
    } else if (normalizedCommand.includes("npm install")) {
      const packages = this.getRandomInt(15, 45);
      stepLogs.push(`Installing ${packages} packages...`);
      stepLogs.push(`added ${packages} packages from npm registry`);
      stepLogs.push(`resolved dependencies in ${this.getRandomInt(2, 8)}s`);
    } else if (normalizedCommand.includes("npm run build") || normalizedCommand.includes("python setup.py build") || normalizedCommand.includes("python -m build")) {
      const files = this.getRandomInt(10, 50);
      stepLogs.push(`Compiling ${files} source files...`);
      stepLogs.push(`Generated ${Math.floor(files * 1.5)} output files`);
      stepLogs.push(`Build completed in ${this.getRandomInt(3, 10)}s`);
    } else if (normalizedCommand.includes("npm test") || normalizedCommand.includes("mvn test") || normalizedCommand.includes("gradle test")) {
      const testsPassed = this.getRandomInt(20, 100);
      const testsFailed = this.getRandomInt(0, 3);
      stepLogs.push(`Running ${testsPassed + testsFailed} tests...`);
      stepLogs.push(`✓ ${testsPassed} tests passed`);
      if (testsFailed > 0) {
        stepLogs.push(`✗ ${testsFailed} tests failed`);
      }
    } else if (normalizedCommand.includes("docker build")) {
      stepLogs.push("Building Docker image...");
      stepLogs.push("Step 1: Pulling base image");
      stepLogs.push("Step 2: Installing dependencies");
      stepLogs.push("Step 3: Copying source files");
      stepLogs.push("Image built successfully");
    } else if (normalizedCommand.includes("htmlhint") || normalizedCommand.includes("validate")) {
      stepLogs.push("Validating HTML structure...");
      stepLogs.push("All HTML files are valid");
    } else if (normalizedCommand.includes("minify")) {
      const saved = this.getRandomInt(10, 40);
      stepLogs.push(`Minifying assets... (${saved}% reduction)`);
      stepLogs.push("CSS minified");
      stepLogs.push("JavaScript minified");
    }

    if (stepLogs.length === 0 && step.name.includes("Install")) {
      const packages = this.getRandomInt(15, 45);
      stepLogs.push(`Installing ${packages} packages...`);
      stepLogs.push(`added ${packages} packages from npm registry`);
      stepLogs.push(`resolved dependencies in ${this.getRandomInt(2, 8)}s`);
    } else if (stepLogs.length === 0 && step.name.includes("Lint")) {
      const issues = this.getRandomInt(0, 5);
      if (issues === 0) {
        stepLogs.push("No linting issues found");
      } else {
        stepLogs.push(`Found ${issues} linting warnings`);
        stepLogs.push("  ⚠ Unused variables detected");
        stepLogs.push("  ⚠ Line too long");
      }
    } else if (stepLogs.length === 0 && (step.name.includes("Build") || step.name.includes("Compile"))) {
      const files = this.getRandomInt(10, 50);
      stepLogs.push(`Compiling ${files} source files...`);
      stepLogs.push(`Generated ${Math.floor(files * 1.5)} output files`);
      stepLogs.push(`Build completed in ${this.getRandomInt(3, 10)}s`);
    } else if (stepLogs.length === 0 && step.name.includes("Test")) {
      const testsPassed = this.getRandomInt(20, 100);
      const testsFailed = this.getRandomInt(0, 3);
      stepLogs.push(`Running ${testsPassed + testsFailed} tests...`);
      stepLogs.push(`✓ ${testsPassed} tests passed`);
      if (testsFailed > 0) {
        stepLogs.push(`✗ ${testsFailed} tests failed`);
      }
    } else if (stepLogs.length === 0 && step.name.includes("Docker")) {
      stepLogs.push("Building Docker image...");
      stepLogs.push("Step 1: Pulling base image");
      stepLogs.push("Step 2: Installing dependencies");
      stepLogs.push("Step 3: Copying source files");
      stepLogs.push("Image built successfully");
    } else if (stepLogs.length === 0 && step.name.includes("Validate")) {
      stepLogs.push("Validating HTML structure...");
      stepLogs.push("All HTML files are valid");
    } else if (stepLogs.length === 0 && step.name.includes("Minify")) {
      const saved = this.getRandomInt(10, 40);
      stepLogs.push(`Minifying assets... (${saved}% reduction)`);
      stepLogs.push("CSS minified");
      stepLogs.push("JavaScript minified");
    } else if (stepLogs.length === 0) {
      stepLogs.push("Executing custom command...");
    }

    // Add logs to stream
    for (const log of stepLogs) {
      this.logStream.append(log, "info", "STDOUT");
    }
  }

  /**
   * Determine if a step should fail based on success rate and failure chance
   */
  private shouldFail(failureChance: number, successRate?: number): boolean {
    const rate = this.getRandomNumber();
    const chance = successRate ? 1 - successRate : 1 - (1 - failureChance);

    return rate < chance;
  }

  /**
   * Get random delay in ms (deterministic if seed set)
   */
  private getRandomDelay(min: number, max: number): number {
    const random = this.getRandomNumber();
    return Math.floor(random * (max - min) + min);
  }

  /**
   * Get random integer (deterministic if seed set)
   */
  private getRandomInt(min: number, max: number): number {
    const random = this.getRandomNumber();
    return Math.floor(random * (max - min + 1) + min);
  }

  /**
   * Get random number (uses seeded RNG if in deterministic mode)
   */
  private getRandomNumber(): number {
    if (this.random) {
      return this.random.next();
    }
    return Math.random();
  }

  /**
   * Sleep for given milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseDockerfileSteps(content: string): BuildStep[] {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    const steps: BuildStep[] = [];

    for (const line of lines) {
      const [instructionRaw] = line.split(/\s+/, 1);
      const instruction = (instructionRaw || "").toUpperCase();

      if (!["FROM", "WORKDIR", "COPY", "ADD", "RUN", "EXPOSE", "ENV", "CMD", "ENTRYPOINT"].includes(instruction)) {
        continue;
      }

      steps.push({
        name: this.getDockerInstructionName(instruction),
        command: line,
        description: `Docker instruction: ${instruction}`,
        successRate: instruction === "RUN" ? 0.9 : 0.98
      });
    }

    return steps;
  }

  private parseBashSteps(content: string): BuildStep[] {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("#!"));

    const commands = lines.filter((line) => line !== "set -e" && line !== "set -eux" && line !== "set -euxo pipefail");

    return commands.map((command, index) => ({
      name: this.inferStepNameFromCommand(command, index + 1),
      command,
      description: "Bash command from custom build script",
      successRate: this.inferSuccessRate(command)
    }));
  }

  private parseYamlSteps(content: string): BuildStep[] {
    const lines = content.split(/\r?\n/);
    const commands: string[] = [];
    let inScriptBlock = false;
    let scriptIndent = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      const indent = rawLine.length - rawLine.trimStart().length;

      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }

      if (/^script\s*:/i.test(trimmed)) {
        inScriptBlock = true;
        scriptIndent = indent;
        continue;
      }

      if (inScriptBlock) {
        if (indent <= scriptIndent && !trimmed.startsWith("-")) {
          inScriptBlock = false;
        } else if (trimmed.startsWith("-")) {
          const command = trimmed.slice(1).trim();
          if (command.length > 0) {
            commands.push(command);
          }
          continue;
        }
      }

      if (!inScriptBlock && /^-\s+.+/.test(trimmed) && !trimmed.startsWith("- stage")) {
        const command = trimmed.slice(1).trim();
        if (command.length > 0 && /\s/.test(command)) {
          commands.push(command);
        }
      }
    }

    return commands.map((command, index) => ({
      name: this.inferStepNameFromCommand(command, index + 1),
      command,
      description: "YAML pipeline script command",
      successRate: this.inferSuccessRate(command)
    }));
  }

  private getDockerInstructionName(instruction: string): string {
    switch (instruction) {
      case "FROM":
        return "Select Base Image";
      case "WORKDIR":
        return "Set Working Directory";
      case "COPY":
      case "ADD":
        return "Copy Application Files";
      case "RUN":
        return "Execute Build Instruction";
      case "EXPOSE":
        return "Configure Exposed Ports";
      case "ENV":
        return "Set Environment Variables";
      case "CMD":
      case "ENTRYPOINT":
        return "Configure Container Startup";
      default:
        return "Docker Instruction";
    }
  }

  private inferStepNameFromCommand(command: string, stepNumber: number): string {
    const normalized = command.toLowerCase();

    if (normalized.startsWith("echo ")) {
      return `Log Message ${stepNumber}`;
    }
    if (normalized.includes("npm install") || normalized.includes("pip install")) {
      return "Install Dependencies";
    }
    if (normalized.includes("npm run build") || normalized.includes("python -m build") || normalized.includes("setup.py build")) {
      return "Build Project";
    }
    if (normalized.includes("npm test") || normalized.includes("pytest") || normalized.includes("mvn test")) {
      return "Run Tests";
    }
    if (normalized.includes("docker build")) {
      return "Build Docker Image";
    }
    if (normalized.includes("docker tag")) {
      return "Tag Docker Image";
    }
    if (normalized.includes("lint") || normalized.includes("eslint") || normalized.includes("pylint")) {
      return "Lint Code";
    }

    return `Execute Command ${stepNumber}`;
  }

  private inferSuccessRate(command: string): number {
    const normalized = command.toLowerCase();

    if (normalized.startsWith("echo ")) {
      return 0.99;
    }
    if (normalized.includes("test") || normalized.includes("lint")) {
      return 0.88;
    }
    if (normalized.includes("build") || normalized.includes("compile")) {
      return 0.9;
    }
    if (normalized.includes("install")) {
      return 0.94;
    }

    return 0.93;
  }

  /**
   * Get current logs
   */
  getLogs(): BuildLog[] {
    return this.logStream.getLogs();
  }

  /**
   * Get formatted log output
   */
  getFormattedOutput(): string {
    return this.logStream.getFormattedLogs();
  }
}
