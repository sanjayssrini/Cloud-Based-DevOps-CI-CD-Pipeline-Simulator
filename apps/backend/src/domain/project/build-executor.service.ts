import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { platform } from "node:os";

export interface BuildLog {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  source?: string;
}

export interface BuildExecutionResult {
  success: boolean;
  duration: number;
  logs: BuildLog[];
  output: string;
  exitCode: number;
}

export class BuildExecutorService {
  private isWindows = platform() === "win32";

  async executeBuild(
    projectPath: string,
    buildCommand?: string,
    buildScript?: string
  ): Promise<BuildExecutionResult> {
    const logs: BuildLog[] = [];
    const output: string[] = [];
    const startTime = Date.now();

    try {
      // Detect project type if no explicit command given
      const projectType = this.detectProjectType(projectPath);
      const cmd = buildCommand || this.getDefaultCommand(projectType, projectPath);

      if (!cmd) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Could not determine build command for project",
          source: "BUILD"
        });
        return {
          success: false,
          duration: Date.now() - startTime,
          logs,
          output: output.join("\n"),
          exitCode: 1
        };
      }

      logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `🚀 Starting build in ${projectPath}...`,
        source: "BUILD"
      });

      logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Executing: ${cmd}`,
        source: "BUILD"
      });

      const result = await this.executeCommand(cmd, projectPath, logs, output);

      if (result.success) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: "success",
          message: `✅ Build completed successfully in ${Date.now() - startTime}ms`,
          source: "BUILD"
        });
      } else {
        logs.push({
          timestamp: new Date().toISOString(),
          level: "error",
          message: `❌ Build failed with exit code ${result.exitCode}`,
          source: "BUILD"
        });
      }

      return {
        success: result.success,
        duration: Date.now() - startTime,
        logs,
        output: output.join("\n"),
        exitCode: result.exitCode
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logs.push({
        timestamp: new Date().toISOString(),
        level: "error",
        message: `Build error: ${errorMsg}`,
        source: "BUILD"
      });

      return {
        success: false,
        duration: Date.now() - startTime,
        logs,
        output: output.join("\n"),
        exitCode: 1
      };
    }
  }

  private detectProjectType(projectPath: string): "node" | "python" | "docker" | "static" {
    if (fs.existsSync(path.join(projectPath, "Dockerfile"))) {
      return "docker";
    }
    if (fs.existsSync(path.join(projectPath, "package.json"))) {
      return "node";
    }
    if (fs.existsSync(path.join(projectPath, "requirements.txt")) || 
        fs.existsSync(path.join(projectPath, "pyproject.toml"))) {
      return "python";
    }
    return "static";
  }

  private getDefaultCommand(type: string, projectPath: string): string {
    switch (type) {
      case "node":
        // Check if it's a monorepo or has build script
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, "package.json"), "utf-8"));
          if (pkg.scripts?.build) {
            return "npm install && npm run build";
          }
        } catch {}
        return "npm install";

      case "python":
        if (fs.existsSync(path.join(projectPath, "pyproject.toml"))) {
          return "pip install -e . && python -m build";
        }
        return "pip install -r requirements.txt";

      case "docker":
        return "docker build -t project:latest .";

      default:
        return "";
    }
  }

  private executeCommand(
    command: string,
    cwd: string,
    logs: BuildLog[],
    output: string[]
  ): Promise<{ success: boolean; exitCode: number }> {
    return new Promise((resolve) => {
      try {
        // On Windows, use cmd.exe with /c flag; on Unix, use sh
        const shell = this.isWindows ? "cmd.exe" : "/bin/sh";
        const shellArgs = this.isWindows ? ["/c", command] : ["-c", command];

        const child = spawn(shell, shellArgs, {
          cwd,
          stdio: ["pipe", "pipe", "pipe"],
          shell: false
        });

        let hasError = false;

        child.stdout?.on("data", (data) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            if (line.trim()) {
              output.push(line);
              logs.push({
                timestamp: new Date().toISOString(),
                level: "info",
                message: line,
                source: "STDOUT"
              });
            }
          }
        });

        child.stderr?.on("data", (data) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            if (line.trim()) {
              output.push(line);
              hasError = true;
              logs.push({
                timestamp: new Date().toISOString(),
                level: "error",
                message: line,
                source: "STDERR"
              });
            }
          }
        });

        child.on("close", (code) => {
          const exitCode = code || 0;
          const success = exitCode === 0 && !hasError;

          resolve({
            success,
            exitCode
          });
        });

        child.on("error", (err) => {
          hasError = true;
          logs.push({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Command error: ${err.message}`,
            source: "SPAWN"
          });
          resolve({
            success: false,
            exitCode: 1
          });
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        logs.push({
          timestamp: new Date().toISOString(),
          level: "error",
          message: `Execution error: ${errorMsg}`,
          source: "EXECUTOR"
        });
        resolve({
          success: false,
          exitCode: 1
        });
      }
    });
  }
}
