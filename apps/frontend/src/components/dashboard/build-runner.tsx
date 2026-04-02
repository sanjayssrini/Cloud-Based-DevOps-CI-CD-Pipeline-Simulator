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
}

export function BuildRunner({ projectId, scriptId }: BuildRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [showCLI, setShowCLI] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const runBuildMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/projects/${projectId}/build`, {
        scriptId: scriptId || null
      });
      return data;
    },
    onSuccess: (data) => {
      // Data contains the full build result with logs
      if (data.logs && Array.isArray(data.logs)) {
        setBuildLogs(data.logs);
      } else if (data.output) {
        // Fallback: parse output into logs
        const lines = data.output.split("\n");
        const parsedLogs = lines
          .filter((line: string) => line.trim())
          .map((line: string) => ({
            timestamp: new Date().toISOString(),
            level: line.includes("error") || line.includes("Error") ? "error" : "info" as const,
            message: line
          }));
        setBuildLogs(parsedLogs);
      }

      setBuildSuccess(data.status === "success");
      setIsRunning(false);
      setShowCLI(true);
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
    }
  });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [buildLogs]);

  const handleBuild = async () => {
    setIsRunning(true);
    setBuildLogs([
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "🚀 Starting build process...",
        source: "BUILD"
      }
    ]);
    setBuildSuccess(false);
    runBuildMutation.mutate();
  };

  const getLevelColor = (level: BuildLog["level"]) => {
    switch (level) {
      case "success":
        return "text-green-700 bg-green-50";
      case "error":
        return "text-red-700 bg-red-50";
      case "warning":
        return "text-yellow-700 bg-yellow-50";
      default:
        return "text-blue-700 bg-blue-50";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Build Controls */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Build Execution</h3>
            <p className="text-sm text-slate-600">Execute your project and see real-time output</p>
          </div>
          <button
            onClick={handleBuild}
            disabled={isRunning || runBuildMutation.isPending}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
              isRunning || runBuildMutation.isPending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isRunning ? "🔄 Building..." : "▶️ Build"}
          </button>
        </div>

        {isRunning && (
          <div className="flex items-center gap-3 text-slate-700">
            <div className="animate-spin text-xl">⚙️</div>
            <span>Build in progress...</span>
          </div>
        )}
      </div>

      {/* Build Logs */}
      {buildLogs.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Build Output</h4>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${buildSuccess ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {buildSuccess ? "✓ Success" : "Running..."}
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 space-y-1 font-mono text-sm font-light">
            {buildLogs.map((log, idx) => (
              <div
                key={idx}
                className={`rounded px-3 py-2 ${getLevelColor(log.level)} flex items-start gap-2`}
              >
                <span className="text-xs whitespace-nowrap opacity-70">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.source && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${getSourceBadgeColor(log.source)}`}>
                    {log.source}
                  </span>
                )}
                <div className="flex-1 break-words">{log.message}</div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Show CLI when build completes */}
      {showCLI && (
        <div className={`rounded-lg border-2 p-6 ${buildSuccess ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`font-semibold ${buildSuccess ? "text-green-900" : "text-red-900"}`}>
                {buildSuccess ? "Build Completed ✓" : "Build Failed ✗"}
              </h4>
              <p className={`text-sm ${buildSuccess ? "text-green-700" : "text-red-700"}`}>
                {buildSuccess ? "Your build succeeded! You can now interact with your project via CLI." : "Build encountered errors. Check the output above."}
              </p>
            </div>
            {buildSuccess && (
              <button
                onClick={() => setShowCLI(false)}
                className="text-green-600 hover:text-green-800 font-bold"
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
