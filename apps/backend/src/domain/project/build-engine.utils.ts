/**
 * Build Engine Utilities - Helper functions and extensions
 * 
 * This file provides utility functions for working with the Build Engine,
 * including progress tracking, result analysis, and custom configurations.
 */

import { BuildResult, BuildLog, BuildPlan, BuildStep } from "./build-engine.service.js";

/**
 * Progress Tracker - Monitors build progress
 */
export class BuildProgressTracker {
  private startTime: number = 0;
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private logs: BuildLog[] = [];

  constructor(totalSteps: number) {
    this.totalSteps = totalSteps;
    this.startTime = Date.now();
  }

  recordStep(log: BuildLog) {
    this.logs.push(log);
    if (log.message.includes("completed successfully")) {
      this.currentStep++;
    }
  }

  getProgress(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  getEstimatedTimeRemaining(estimatedTotal: number): number {
    const elapsed = this.getElapsedTime();
    const progress = this.getProgress();
    if (progress === 0) return estimatedTotal;
    return (estimatedTotal * 100) / progress - elapsed;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  reset() {
    this.currentStep = 0;
    this.logs = [];
    this.startTime = Date.now();
  }
}

/**
 * Build Result Analyzer - Extracts insights from build results
 */
export class BuildResultAnalyzer {
  static getSummary(result: BuildResult): {
    status: string;
    totalDuration: string;
    successRate: string;
    errorCount: number;
    warningCount: number;
  } {
    const errors = result.logs.filter((l) => l.level === "error").length;
    const warnings = result.logs.filter((l) => l.level === "warning").length;
    const successRate = ((result.stepsExecuted / result.totalSteps) * 100).toFixed(1);

    return {
      status: result.status.toUpperCase(),
      totalDuration: `${(result.duration / 1000).toFixed(2)}s`,
      successRate: `${successRate}%`,
      errorCount: errors,
      warningCount: warnings
    };
  }

  static getErrorLogs(result: BuildResult): BuildLog[] {
    return result.logs.filter((l) => l.level === "error");
  }

  static getWarningLogs(result: BuildResult): BuildLog[] {
    return result.logs.filter((l) => l.level === "warning");
  }

  static getLogsBySource(result: BuildResult, source: string): BuildLog[] {
    return result.logs.filter((l) => l.source === source);
  }

  static getLogsByStage(result: BuildResult, stage: string): BuildLog[] {
    return result.logs.filter((l) => l.stage === stage);
  }

  static calculateSuccessRate(results: BuildResult[]): number {
    const successCount = results.filter((r) => r.status === "success").length;
    return (successCount / results.length) * 100;
  }

  static getAverageDuration(results: BuildResult[]): number {
    const total = results.reduce((sum, r) => sum + r.duration, 0);
    return total / results.length;
  }

  static formatAsMarkdown(result: BuildResult): string {
    const summary = this.getSummary(result);

    let markdown = `# Build Report\n\n`;
    markdown += `**Status:** ${summary.status}\n`;
    markdown += `**Duration:** ${summary.totalDuration}\n`;
    markdown += `**Success Rate:** ${summary.successRate}\n`;
    markdown += `**Errors:** ${summary.errorCount} | **Warnings:** ${summary.warningCount}\n\n`;

    markdown += `## Build Steps\n`;
    markdown += `- Executed: ${result.stepsExecuted} / ${result.totalSteps}\n`;
    if (result.artifactPath) {
      markdown += `- Artifacts: \`${result.artifactPath}\`\n`;
    }

    markdown += `\n## Logs\n\`\`\`\n`;
    result.logs.forEach((log) => {
      markdown += `[${log.level.toUpperCase()}] ${log.message}\n`;
    });
    markdown += `\`\`\`\n`;

    return markdown;
  }
}

/**
 * Custom Build Plan Builder - Create custom build plans
 */
export class CustomBuildPlanBuilder {
  private steps: BuildStep[] = [];
  private projectType: string = "custom";

  setProjectType(type: string): this {
    this.projectType = type;
    return this;
  }

  addStep(step: BuildStep): this {
    this.steps.push(step);
    return this;
  }

  addSteps(steps: BuildStep[]): this {
    this.steps.push(...steps);
    return this;
  }

  insertStep(index: number, step: BuildStep): this {
    this.steps.splice(index, 0, step);
    return this;
  }

  removeStep(index: number): this {
    this.steps.splice(index, 1);
    return this;
  }

  build(): BuildPlan {
    return {
      projectType: this.projectType,
      steps: this.steps,
      estimatedDuration: this.calculateEstimatedDuration()
    };
  }

  private calculateEstimatedDuration(): number {
    // Average 10 seconds per step + 5 seconds overhead
    return this.steps.length * 10000 + 5000;
  }

  clear(): this {
    this.steps = [];
    return this;
  }

  getSteps(): BuildStep[] {
    return [...this.steps];
  }
}

/**
 * Build Configuration Presets - Pre-built configurations for common scenarios
 */
export const BUILD_PRESETS = {
  // Fast builds - minimal steps
  FAST: {
    Node: [
      { name: "Install Dependencies", command: "npm install", successRate: 0.95 },
      { name: "Build", command: "npm run build", successRate: 0.92 }
    ],
    Python: [
      { name: "Install", command: "pip install -r requirements.txt", successRate: 0.94 },
      { name: "Build", command: "python -m build", successRate: 0.93 }
    ]
  },

  // Complete builds - all steps
  COMPLETE: {
    Node: [
      { name: "Install Dependencies", command: "npm install", successRate: 0.95 },
      { name: "Lint Code", command: "npm run lint", successRate: 0.90 },
      { name: "Test", command: "npm test", successRate: 0.88 },
      { name: "Build", command: "npm run build", successRate: 0.92 }
    ],
    Python: [
      { name: "Install", command: "pip install -r requirements.txt", successRate: 0.94 },
      { name: "Lint", command: "pylint src/", successRate: 0.88 },
      { name: "Test", command: "pytest", successRate: 0.87 },
      { name: "Build", command: "python -m build", successRate: 0.93 }
    ]
  },

  // Strict builds - high failure rates
  STRICT: {
    Node: [
      { name: "Install Dependencies", command: "npm ci", successRate: 0.93 },
      { name: "Lint Code", command: "npm run lint", successRate: 0.80 },
      { name: "Type Check", command: "npm run type-check", successRate: 0.85 },
      { name: "Test", command: "npm test", successRate: 0.78 },
      { name: "Build", command: "npm run build", successRate: 0.85 }
    ]
  }
};

/**
 * Failure Scenarios - Pre-configured failure scenarios for testing
 */
export const FAILURE_SCENARIOS = {
  // No failures
  ALWAYS_SUCCEED: { failureChance: 0 },

  // Occasional failures (realistic)
  REALISTIC: { failureChance: 0.08 },

  // Common testing scenario
  COMMON_FAILURE: { failureChance: 0.15 },

  // Frequent failures
  UNRELIABLE: { failureChance: 0.30 },

  // Always fails
  ALWAYS_FAIL: { failureChance: 1.0 }
};

/**
 * Seed Generators - Various seed generation strategies
 */
export const SeedGenerators = {
  // Deterministic seed from project ID
  fromProjectId: (projectId: string): number => {
    return Math.abs(projectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0));
  },

  // Deterministic seed from timestamp
  fromTimestamp: (timestamp: number): number => {
    return Math.floor(timestamp / 1000) % 10000;
  },

  // Deterministic seed from name + timestamp
  fromNameAndTime: (name: string, timestamp: number): number => {
    const nameHash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const timeHash = Math.floor(timestamp / 1000);
    return (nameHash + timeHash) % 100000;
  },

  // Random seed
  random: (): number => {
    return Math.floor(Math.random() * 100000);
  },

  // Sequence seed generator
  sequence: (() => {
    let counter = 1000;
    return (): number => {
      return counter++;
    };
  })()
};

/**
 * Log Formatter - Format logs for different outputs
 */
export class LogFormatter {
  static toJSON(logs: BuildLog[]): string {
    return JSON.stringify(logs, null, 2);
  }

  static toCSV(logs: BuildLog[]): string {
    const header = "timestamp,level,source,message\n";
    const rows = logs
      .map((l) => `"${l.timestamp}","${l.level}","${l.source || ""}","${l.message}"`)
      .join("\n");
    return header + rows;
  }

  static toMarkdown(logs: BuildLog[]): string {
    let md = "| Time | Level | Source | Message |\n";
    md += "|------|-------|--------|----------|\n";
    logs.forEach((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      md += `| ${time} | ${l.level} | ${l.source || "-"} | ${l.message} |\n`;
    });
    return md;
  }

  static toHTML(logs: BuildLog[], title: string = "Build Log"): string {
    let html = `<!DOCTYPE html><html><head><title>${title}</title>`;
    html += `<style>
      body { font-family: monospace; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 20px auto; }
      .log { padding: 8px; margin: 4px 0; border-radius: 4px; }
      .info { background: #e3f2fd; color: #01579b; }
      .success { background: #e8f5e9; color: #1b5e20; }
      .error { background: #ffebee; color: #b71c1c; }
      .warning { background: #fff3e0; color: #e65100; }
      .time { color: #999; font-size: 0.9em; }
      .source { display: inline-block; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 2px; font-size: 0.85em; margin: 0 4px; }
    </style></head><body>`;
    html += `<div class="container"><h1>${title}</h1>`;
    logs.forEach((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      html += `<div class="log ${l.level}">
        <span class="time">[${time}]</span>
        ${l.source ? `<span class="source">${l.source}</span>` : ""}
        <span>${l.message}</span>
      </div>`;
    });
    html += `</div></body></html>`;
    return html;
  }
}

/**
 * Build Cache - Simple caching for build artifacts
 */
export class BuildCache {
  private cache = new Map<string, BuildResult>();
  private maxSize: number = 100;

  set(key: string, result: BuildResult): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }

  get(key: string): BuildResult | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Build Statistics - Collect and analyze build statistics
 */
export class BuildStatistics {
  private results: BuildResult[] = [];

  addResult(result: BuildResult): void {
    this.results.push(result);
  }

  addResults(results: BuildResult[]): void {
    this.results.push(...results);
  }

  getSuccessRate(): number {
    if (this.results.length === 0) return 0;
    const successes = this.results.filter((r) => r.status === "success").length;
    return (successes / this.results.length) * 100;
  }

  getFailureRate(): number {
    return 100 - this.getSuccessRate();
  }

  getAverageDuration(): number {
    if (this.results.length === 0) return 0;
    const total = this.results.reduce((sum, r) => sum + r.duration, 0);
    return total / this.results.length;
  }

  getFastestBuild(): BuildResult | undefined {
    return this.results.reduce((fastest, current) =>
      current.duration < (fastest?.duration || Infinity) ? current : fastest
    );
  }

  getSlowestBuild(): BuildResult | undefined {
    return this.results.reduce((slowest, current) =>
      current.duration > (slowest?.duration || 0) ? current : slowest
    );
  }

  getMedianDuration(): number {
    if (this.results.length === 0) return 0;
    const sorted = [...this.results].sort((a, b) => a.duration - b.duration);
    const mid = Math.floor(sorted.length / 2);
    return sorted[mid].duration;
  }

  getSummary() {
    return {
      totalBuilds: this.results.length,
      successRate: `${this.getSuccessRate().toFixed(2)}%`,
      failureRate: `${this.getFailureRate().toFixed(2)}%`,
      averageDuration: `${(this.getAverageDuration() / 1000).toFixed(2)}s`,
      medianDuration: `${(this.getMedianDuration() / 1000).toFixed(2)}s`,
      fastestBuild: `${(this.getFastestBuild()?.duration || 0 / 1000).toFixed(2)}s`,
      slowestBuild: `${(this.getSlowestBuild()?.duration || 0 / 1000).toFixed(2)}s`
    };
  }

  reset(): void {
    this.results = [];
  }
}

export default {
  BuildProgressTracker,
  BuildResultAnalyzer,
  CustomBuildPlanBuilder,
  BUILD_PRESETS,
  FAILURE_SCENARIOS,
  SeedGenerators,
  LogFormatter,
  BuildCache,
  BuildStatistics
};
