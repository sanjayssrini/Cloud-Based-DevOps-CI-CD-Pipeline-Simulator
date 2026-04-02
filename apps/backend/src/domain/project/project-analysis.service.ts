import path from "node:path";
import fs from "node:fs";

export type DetectedProjectType = "NODE" | "PYTHON" | "STATIC" | "UNKNOWN";

export class ProjectAnalysisService {
  private readonly markers = ["package.json", "requirements.txt", "pyproject.toml", "index.html"];

  findProjectRoot(extractedPath: string): string {
    const queue: Array<{ dir: string; depth: number }> = [{ dir: extractedPath, depth: 0 }];
    const maxDepth = 4;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      if (this.markers.some((marker) => fs.existsSync(path.join(current.dir, marker)))) {
        return current.dir;
      }

      if (current.depth >= maxDepth) {
        continue;
      }

      const children = fs
        .readdirSync(current.dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith("."));

      for (const child of children) {
        queue.push({ dir: path.join(current.dir, child.name), depth: current.depth + 1 });
      }
    }

    return extractedPath;
  }

  detectProjectType(extractedPath: string): DetectedProjectType {
    if (fs.existsSync(path.join(extractedPath, "package.json"))) {
      return "NODE";
    }
    if (fs.existsSync(path.join(extractedPath, "requirements.txt")) || fs.existsSync(path.join(extractedPath, "pyproject.toml"))) {
      return "PYTHON";
    }
    if (fs.existsSync(path.join(extractedPath, "index.html"))) {
      return "STATIC";
    }
    return "UNKNOWN";
  }

  analyzeDependencies(extractedPath: string, type: DetectedProjectType): string[] {
    try {
      if (type === "NODE") {
        const pkgPath = path.join(extractedPath, "package.json");
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        return Object.keys(pkg.dependencies ?? {});
      }

      if (type === "PYTHON") {
        const reqPath = path.join(extractedPath, "requirements.txt");
        if (fs.existsSync(reqPath)) {
          return fs
            .readFileSync(reqPath, "utf-8")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        }
      }
    } catch {
      return [];
    }

    return [];
  }

  generateBuildSteps(type: DetectedProjectType): string[] {
    switch (type) {
      case "NODE":
        return ["npm ci", "npm run build", "npm test"];
      case "PYTHON":
        return ["pip install -r requirements.txt", "pytest"];
      case "STATIC":
        return ["htmlhint .", "serve ."];
      default:
        return ["echo 'Manual pipeline configuration required'"];
    }
  }

  generatePipelineConfig(type: DetectedProjectType, buildSteps: string[]) {
    const buildTasks = buildSteps.slice(0, 2).map((step, index) => ({
      name: `build-${index + 1}`,
      command: step,
      failChance: 0.06
    }));

    const testCommand = type === "PYTHON" ? "pytest -q" : type === "STATIC" ? "echo static smoke test" : "npm test";

    return {
      stages: [
        {
          name: "Build",
          type: "BUILD",
          order: 1,
          conditionExpr: "always",
          retryCount: 1,
          timeoutSeconds: 40,
          tasks: buildTasks.length > 0 ? buildTasks : [{ name: "build", command: "echo build", failChance: 0.08 }]
        },
        {
          name: "Test",
          type: "TEST",
          order: 2,
          conditionExpr: "onSuccess",
          retryCount: 1,
          timeoutSeconds: 30,
          tasks: [{ name: "test", command: testCommand, failChance: 0.1 }]
        },
        {
          name: "Deploy",
          type: "DEPLOY",
          order: 3,
          conditionExpr: "onSuccess",
          retryCount: 0,
          timeoutSeconds: 20,
          tasks: [{ name: "deploy", command: "simulated deploy", failChance: 0.04 }]
        }
      ]
    };
  }
}
