"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CLIWindow } from "./cli-window";

interface BuildRunnerProps {
  projectId: string;
  scriptId?: string;
}

interface BuildLog {
  timestamp: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
  source?: string;
  stage?: string;
}

interface BuildStep {
  name: string;
  description?: string;
}

interface BuildResult {
  id: string;
  projectId: string;
  status: "success" | "failed";
  startedAt: string;
  completedAt: string;
  duration: number;
  logs: BuildLog[];
  exitCode: number;
  artifactPath?: string;
  stepsExecuted: number;
  totalSteps: number;
  projectType: string;
  buildSource?: "auto" | "script" | "file";
  scriptLanguage?: "dockerfile" | "bash" | "yaml" | null;
  scriptName?: string | null;
  buildPlan?: {
    steps: BuildStep[];
  };
}

export function BuildRunner({ projectId, scriptId }: BuildRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [showCLI, setShowCLI] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [progress, setProgress] = useState(0); // 0-100
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const runBuildMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/build`, {
        scriptId: scriptId || null,
        deterministicSeed: Math.abs(projectId.split("").reduce((a, b) => a + b.charCodeAt(0), 0))
      });
      return data as BuildResult;
    },
    onSuccess: (data) => {
      setBuildResult(data);
      // Simulate progressive log updates for real-time feel
      if (data.logs && Array.isArray(data.logs)) {
        setBuildLogs(data.logs);
      }

      const stepProgress = Math.min(100, Math.round((data.stepsExecuted / data.totalSteps) * 100));
      setProgress(stepProgress);

      setBuildSuccess(data.status === "success");
      setIsRunning(false);
      setShowCLI(data.status === "success");
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Build failed";
      setBuildLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: "error",
          message: errorMsg,
          source: "ERROR"
        }
      ]);
      setBuildSuccess(false);
      setIsRunning(false);
      setProgress(100);
    }
  });

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [buildLogs]);

  const handleBuild = async () => {
    setIsRunning(true);
    setBuildLogs([
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "🚀 Initializing build process...",
        source: "SYSTEM"
      }
    ]);
    setBuildSuccess(false);
    setBuildResult(null);
    setProgress(0);
    runBuildMutation.mutate();
  };

  const getLevelColor = (level: BuildLog["level"]) => {
    switch (level) {
      case "success":
        return "text-green-700 bg-green-50 border-l-4 border-green-500";
      case "error":
        return "text-red-700 bg-red-50 border-l-4 border-red-500";
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-l-4 border-yellow-500";
      default:
        return "text-blue-700 bg-blue-50 border-l-4 border-blue-500";
    }
  };

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case "STDERR":
        return "bg-red-100 text-red-800";
      case "STDOUT":
        return "bg-green-100 text-green-800";
      case "BUILD":
        return "bg-blue-100 text-blue-800";
      case "SYSTEM":
        return "bg-purple-100 text-purple-800";
      case "EXEC":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIndicator = () => {
    if (isRunning) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-blue-700 font-semibold">Running</span>
        </div>
      );
    }
    if (buildResult) {
      if (buildSuccess) {
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-semibold">Success</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-700 font-semibold">Failed</span>
          </div>
        );
      }
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span className="text-gray-700 font-semibold">Pending</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Build Controls and Status */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Build Execution Engine</h3>
            <p className="text-sm text-slate-600">
              Execute a real script-based build simulation from Dockerfile, Bash, or YAML
            </p>
          </div>
          <button
            onClick={handleBuild}
            disabled={isRunning || runBuildMutation.isPending}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
              isRunning || runBuildMutation.isPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:scale-95"
            }`}
          >
            <span>{isRunning ? "⏳" : "▶️"}</span>
            {isRunning ? "Building..." : "Start Build"}
          </button>
        </div>

        {/* Status Indicator and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Status:</span>
            {getStatusIndicator()}
          </div>

          {/* Progress Bar */}
          {(isRunning || buildResult) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Progress</span>
                <span className="text-xs font-medium text-slate-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    buildSuccess ? "bg-green-500" : buildResult && !buildSuccess ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Information */}
          {buildResult && (
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                📦 Project Type: <span className="font-semibold text-slate-900">{buildResult.projectType}</span>
              </p>
              <p>
                🧭 Build Source:{" "}
                <span className="font-semibold text-slate-900">
                  {buildResult.buildSource === "script"
                    ? "Saved custom script"
                    : buildResult.buildSource === "file"
                      ? "Detected file from project"
                      : "Auto-detected defaults"}
                </span>
              </p>
              {buildResult.scriptLanguage && (
                <p>
                  📝 Script Language:{" "}
                  <span className="font-semibold text-slate-900">{buildResult.scriptLanguage}</span>
                  {buildResult.scriptName ? (
                    <span className="text-slate-600"> ({buildResult.scriptName})</span>
                  ) : null}
                </p>
              )}
              <p>
                ⚙️ Steps Executed:{" "}
                <span className="font-semibold text-slate-900">
                  {buildResult.stepsExecuted} / {buildResult.totalSteps}
                </span>
              </p>
              <p>
                ⏱️ Duration:{" "}
                <span className="font-semibold text-slate-900">{(buildResult.duration / 1000).toFixed(2)}s</span>
              </p>
              {buildResult.artifactPath && (
                <p>
                  📦 Artifacts:{" "}
                  <span className="font-mono text-green-700">{buildResult.artifactPath}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Build Plan (if available) */}
      {buildResult?.buildPlan?.steps && buildResult.buildPlan.steps.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900 mb-3 text-sm">Build Plan</h4>
          <div className="space-y-2">
            {buildResult.buildPlan.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    idx < buildResult.stepsExecuted
                      ? buildSuccess
                        ? "bg-green-500"
                        : "bg-orange-500"
                      : "bg-gray-400"
                  }`}
                >
                  {idx < buildResult.stepsExecuted ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{step.name}</p>
                  {step.description && <p className="text-xs text-slate-600">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build Logs Terminal */}
      {buildLogs.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-900 overflow-hidden shadow-lg">
          <div className="border-b border-slate-700 bg-slate-800 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 font-semibold text-slate-200">Terminal Output</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                buildSuccess ? "bg-green-900 text-green-200" : buildResult ? "bg-red-900 text-red-200" : "bg-blue-900 text-blue-200"
              }`}>
                {buildLogs.length} lines
              </span>
            </div>
          </div>
          <div
            ref={logsContainerRef}
            className="max-h-[500px] overflow-y-auto p-4 space-y-1 font-mono text-sm bg-slate-900"
          >
            {buildLogs.map((log, idx) => (
              <div
                key={idx}
                className={`rounded px-2 py-1 flex items-start gap-2 text-slate-100 ${
                  log.level === "error" ? "text-red-400" : log.level === "success" ? "text-green-400" : log.level === "warning" ? "text-yellow-400" : "text-slate-400"
                }`}
              >
                <span className="text-xs whitespace-nowrap opacity-60">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.source && (
                  <span className={`text-xs font-semibold px-1 py-0 rounded whitespace-nowrap opacity-75`}>
                    [{log.source}]
                  </span>
                )}
                <div className="flex-1 break-words">{log.message}</div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Show CLI when build completes successfully */}
      {showCLI && buildResult && (
        <div className={`rounded-lg border-2 p-6 ${buildSuccess ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`font-semibold text-lg ${buildSuccess ? "text-green-900" : "text-red-900"}`}>
                {buildSuccess ? "✅ Build Completed Successfully" : "❌ Build Failed"}
              </h4>
              <p className={`text-sm ${buildSuccess ? "text-green-700" : "text-red-700"}`}>
                {buildSuccess
                  ? `Build artifacts saved to ${buildResult.artifactPath}. You can now interact with your project.`
                  : "Build encountered errors. Check the terminal output above for details."}
              </p>
            </div>
            {buildSuccess && (
              <button
                onClick={() => setShowCLI(false)}
                className="text-green-600 hover:text-green-800 font-bold text-xl"
              >
                ✕
              </button>
            )}
          </div>

          {buildSuccess && <CLIWindow projectId={projectId} repository={null} />}
        </div>
      )}
    </div>
  );
}
