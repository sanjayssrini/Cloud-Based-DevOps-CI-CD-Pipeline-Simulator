"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

interface DeploymentEnv {
  id: string;
  name: string;
  type: "development" | "staging" | "production";
  status: "idle" | "deploying" | "success" | "failed" | "rolling-back";
  lastDeployed?: string;
  version?: string;
  deploymentUrl?: string;
  duration?: number;
}

interface DeploymentStage {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "success" | "failed";
  duration?: number;
  logs: string[];
}

interface DeploymentMetrics {
  successRate: number;
  averageDeployTime: number;
  totalDeployments: number;
  failedDeployments: number;
}

interface DeploymentHistory {
  id: string;
  environmentType: string;
  version: string;
  timestamp: string;
  status: "success" | "failed";
  duration: number;
}

const DEPLOYMENT_STAGES = [
  { id: "checkout", name: "🔄 Checkout Repository", icon: "📦" },
  { id: "build", name: "🔨 Build Application", icon: "⚙️" },
  { id: "test", name: "✅ Run Deploy Tests", icon: "🧪" },
  { id: "push", name: "📤 Push to Registry", icon: "🐳" },
  { id: "rollout", name: "🚀 Kubernetes Rollout", icon: "☸️" },
  { id: "health", name: "❤️ Health Checks", icon: "🏥" },
  { id: "smoke", name: "🔥 Smoke Tests", icon: "🧪" },
  { id: "monitor", name: "👁️ Start Monitoring", icon: "📊" }
];

export default function DeploymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [environments, setEnvironments] = useState<DeploymentEnv[]>([
    {
      id: "dev",
      name: "Development",
      type: "development",
      status: "idle",
      version: "v1.0.0"
    },
    {
      id: "staging",
      name: "Staging",
      type: "staging",
      status: "idle",
      version: "v0.9.5"
    },
    {
      id: "prod",
      name: "Production",
      type: "production",
      status: "idle",
      version: "v0.9.0"
    }
  ]);

  const [activeEnv, setActiveEnv] = useState<string | null>(null);
  const [deploymentStages, setDeploymentStages] = useState<DeploymentStage[]>([]);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DeploymentMetrics>({
    successRate: 85,
    averageDeployTime: 180,
    totalDeployments: 42,
    failedDeployments: 6
  });
  const [history, setHistory] = useState<DeploymentHistory[]>([
    {
      id: "1",
      environmentType: "production",
      version: "v0.9.0",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: "success",
      duration: 245
    },
    {
      id: "2",
      environmentType: "staging",
      version: "v0.9.5",
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      status: "success",
      duration: 189
    },
    {
      id: "3",
      environmentType: "development",
      version: "v1.0.0",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: "success",
      duration: 156
    }
  ]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [deploymentLogs]);

  const addLog = (message: string, color: "info" | "warn" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const colorCode =
      color === "info"
        ? "\x1b[36m"
        : color === "warn"
        ? "\x1b[33m"
        : color === "error"
        ? "\x1b[31m"
        : "\x1b[32m";
    const resetCode = "\x1b[0m";
    setDeploymentLogs((prev) => [
      ...prev,
      `${colorCode}[${timestamp}]${resetCode} ${message}`
    ]);
  };

  const updateStageStatus = (
    stageId: string,
    status: "pending" | "in-progress" | "success" | "failed",
    log?: string
  ) => {
    setDeploymentStages((prev) =>
      prev.map((stage) => {
        if (stage.id === stageId) {
          const updated = { ...stage, status };
          if (log) {
            updated.logs = [...stage.logs, log];
          }
          return updated;
        }
        return stage;
      })
    );
    if (log) addLog(log, status === "failed" ? "error" : status === "success" ? "success" : "info");
  };

  const simulateDeployment = useCallback(async (envId: string) => {
    if (!projectId) {
      alert("Project ID is required");
      return;
    }

    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    setActiveEnv(envId);
    setDeploymentLogs([]);
    setDeploymentStages(
      DEPLOYMENT_STAGES.map((stage) => ({ ...stage, status: "pending", logs: [] }))
    );

    setEnvironments((prev) =>
      prev.map((e) => (e.id === envId ? { ...e, status: "deploying" } : e))
    );

    addLog(`Starting deployment to ${env.name} environment...`, "info");
    addLog(`Project: ${projectId}`, "info");
    addLog(`Target Version: v1.1.0`, "info");
    addLog("");

    let currentStageIndex = 0;
    const startTime = Date.now();

    const executeStage = async (stageIndex: number) => {
      if (stageIndex >= DEPLOYMENT_STAGES.length) {
        // All stages complete
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const success = Math.random() > 0.15; // 85% success rate

        if (success) {
          addLog("");
          addLog("✅ Deployment completed successfully!", "success");
          addLog(`Total time: ${duration}s`, "success");

          // Update environment
          setEnvironments((prev) =>
            prev.map((e) =>
              e.id === envId
                ? {
                    ...e,
                    status: "success",
                    lastDeployed: new Date().toLocaleString(),
                    version: "v1.1.0",
                    duration,
                    deploymentUrl: `https://deploy.sim/${envId}/project/${projectId}`
                  }
                : e
            )
          );

          // Add to history
          setHistory((prev) => [
            {
              id: Date.now().toString(),
              environmentType: env.type,
              version: "v1.1.0",
              timestamp: new Date().toISOString(),
              status: "success",
              duration
            },
            ...prev
          ]);

          // Update metrics
          setMetrics((prev) => ({
            ...prev,
            totalDeployments: prev.totalDeployments + 1,
            successRate: Math.round(
              (prev.totalDeployments * prev.successRate + 100) / (prev.totalDeployments + 1)
            ),
            averageDeployTime: Math.round(
              (prev.averageDeployTime * prev.totalDeployments + duration) / (prev.totalDeployments + 1)
            )
          }));
        } else {
          addLog("");
          addLog("❌ Deployment failed at final rollout stage", "error");
          setEnvironments((prev) =>
            prev.map((e) =>
              e.id === envId
                ? { ...e, status: "failed", duration }
                : e
            )
          );

          setHistory((prev) => [
            {
              id: Date.now().toString(),
              environmentType: env.type,
              version: "v1.1.0",
              timestamp: new Date().toISOString(),
              status: "failed",
              duration
            },
            ...prev
          ]);

          setMetrics((prev) => ({
            ...prev,
            totalDeployments: prev.totalDeployments + 1,
            failedDeployments: prev.failedDeployments + 1
          }));
        }
        return;
      }

      const stage = DEPLOYMENT_STAGES[stageIndex];
      updateStageStatus(stage.id, "in-progress");
      addLog(`► ${stage.name}...`, "info");

      // Simulate stage work
      const stageDuration = Math.random() * 3000 + 1500; // 1.5 - 4.5 seconds
      await new Promise((resolve) => setTimeout(resolve, stageDuration));

      // Random failure simulation (10% chance)
      const stageFailed = Math.random() < 0.1;

      if (stageFailed && stageIndex > 4) {
        updateStageStatus(
          stage.id,
          "failed",
          `✗ Stage failed: Connection timeout to ${env.type} cluster`
        );
        addLog(`✗ Deployment aborted`, "error");

        setEnvironments((prev) =>
          prev.map((e) =>
            e.id === envId ? { ...e, status: "failed" } : e
          )
        );
        return;
      }

      // Add stage-specific logs
      const stageLogs = getStageSpecificLogs(stage.id, env.name);
      stageLogs.forEach((log, idx) => {
        setTimeout(() => {
          updateStageStatus(stage.id, "in-progress", log);
        }, (idx * stageDuration) / stageLogs.length);
      });

      // Mark stage as success
      setTimeout(() => {
        updateStageStatus(stage.id, "success", `✓ ${stage.name} completed`);
        executeStage(stageIndex + 1);
      }, stageDuration);
    };

    executeStage(0);
  }, [projectId, environments]);

  const handleRollback = async () => {
    if (!selectedVersion || !activeEnv) {
      alert("Please select a version to rollback to");
      return;
    }

    setIsRollingBack(true);
    const env = environments.find((e) => e.id === activeEnv);
    if (!env) return;

    setEnvironments((prev) =>
      prev.map((e) => (e.id === activeEnv ? { ...e, status: "rolling-back" } : e))
    );

    setDeploymentLogs([]);
    setDeploymentStages([
      DEPLOYMENT_STAGES[4], // Start from rollout stage
      DEPLOYMENT_STAGES[5],
      DEPLOYMENT_STAGES[6]
    ].map((stage) => ({ ...stage, status: "pending", logs: [] })));

    addLog(`Starting rollback to ${selectedVersion}...`, "warn");
    addLog(`Environment: ${env.name}`, "warn");
    addLog("");

    const startTime = Date.now();

    // Simulate rollback steps
    const rollbackSteps = [
      "Stopping current deployment...",
      "Scaling down pods...",
      "Loading previous version image...",
      "Updating load balancer routing...",
      "Running health checks...",
      "Verifying connectivity..."
    ];

    for (let i = 0; i < rollbackSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addLog(`► ${rollbackSteps[i]}`, "info");
      addLog(`✓ Step ${i + 1}/${rollbackSteps.length} completed`, "success");
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    addLog("");
    addLog(`✅ Rollback completed in ${duration}s`, "success");
    addLog(`Current version: ${selectedVersion}`, "success");

    setEnvironments((prev) =>
      prev.map((e) =>
        e.id === activeEnv
          ? {
              ...e,
              status: "success",
              version: selectedVersion,
              lastDeployed: new Date().toLocaleString(),
              duration
            }
          : e
      )
    );

    setIsRollingBack(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900 text-2xl"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">🚀 Deployment Center</h1>
                <p className="text-slate-600 mt-1">Multi-environment deployment simulator</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Project: {projectId || "Unknown"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600 uppercase">Success Rate</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{metrics.successRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.totalDeployments} total deployments
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600 uppercase">Avg Deploy Time</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{metrics.averageDeployTime}s</p>
            <p className="text-xs text-slate-500 mt-1">Average across all deployments</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600 uppercase">Total Deployments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.totalDeployments}</p>
            <p className="text-xs text-red-500 mt-1">
              {metrics.failedDeployments} failed deployments
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600 uppercase">Last Deployment</p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {history.length > 0
                ? new Date(history[0].timestamp).toLocaleDateString()
                : "Never"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {history.length > 0 ? (history[0].status === "success" ? "✓ Success" : "✗ Failed") : "—"}
            </p>
          </div>
        </div>

        {/* Environments Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {environments.map((env) => (
            <div
              key={env.id}
              className={`rounded-xl border-2 transition-all ${
                activeEnv === env.id
                  ? "border-brand-ocean bg-blue-50"
                  : "border-slate-200 bg-white"
              } shadow-sm overflow-hidden`}
            >
              <div
                className={`px-4 py-3 ${
                  env.type === "production"
                    ? "bg-red-50"
                    : env.type === "staging"
                    ? "bg-yellow-50"
                    : "bg-blue-50"
                }`}
              >
                <h3 className="font-semibold text-slate-900">{env.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {env.type.charAt(0).toUpperCase() + env.type.slice(1)} Environment
                </p>
              </div>

              <div className="p-4 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      env.status === "success"
                        ? "bg-green-100 text-green-700"
                        : env.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : env.status === "deploying"
                        ? "bg-blue-100 text-blue-700 animate-pulse"
                        : env.status === "rolling-back"
                        ? "bg-orange-100 text-orange-700 animate-pulse"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {env.status === "success"
                      ? "✓ Ready"
                      : env.status === "failed"
                      ? "✗ Failed"
                      : env.status === "deploying"
                      ? "⏳ Deploying"
                      : env.status === "rolling-back"
                      ? "↩️ Rolling Back"
                      : "○ Idle"}
                  </span>
                </div>

                {/* Version */}
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Current Version</p>
                  <p className="mt-1 font-mono font-bold text-slate-900 text-lg">{env.version}</p>
                  {env.duration && (
                    <p className="text-xs text-slate-500 mt-1">Deploy time: {env.duration}s</p>
                  )}
                </div>

                {/* Deployment URL */}
                {env.deploymentUrl && (
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">URL</p>
                    <p className="mt-1 font-mono text-xs text-blue-600 break-all truncate">
                      {env.deploymentUrl}
                    </p>
                  </div>
                )}

                {/* Last Deployed */}
                {env.lastDeployed && (
                  <div className="text-xs text-slate-500">
                    📅 Last deployed: {env.lastDeployed}
                  </div>
                )}

                {/* Deploy Button */}
                <button
                  onClick={() => simulateDeployment(env.id)}
                  disabled={env.status === "deploying" || env.status === "rolling-back"}
                  className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    env.status === "deploying" || env.status === "rolling-back"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-brand-ocean text-white hover:bg-brand-ocean/90"
                  }`}
                >
                  {env.status === "deploying"
                    ? "⏳ Deploying..."
                    : env.status === "rolling-back"
                    ? "↩️ Rolling Back..."
                    : "🚀 Deploy Now"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Deployment Stages */}
        {activeEnv && deploymentStages.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">📊 Deployment Progress</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {deploymentStages.map((stage, idx) => (
                  <div key={stage.id} className="last:mb-0">
                    <div className="flex items-center gap-4">
                      <div>
                        {stage.status === "pending" && (
                          <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-500">
                            {idx + 1}
                          </div>
                        )}
                        {stage.status === "in-progress" && (
                          <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center text-xs text-blue-500 animate-spin">
                            ⚙
                          </div>
                        )}
                        {stage.status === "success" && (
                          <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center text-xs text-green-600 font-bold">
                            ✓
                          </div>
                        )}
                        {stage.status === "failed" && (
                          <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-xs text-red-600 font-bold">
                            ✗
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            stage.status === "failed"
                              ? "text-red-600"
                              : stage.status === "success"
                              ? "text-green-600"
                              : stage.status === "in-progress"
                              ? "text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {stage.name}
                        </p>
                        {stage.logs.length > 0 && (
                          <div className="mt-2 bg-slate-50 rounded p-2 border border-slate-200">
                            {stage.logs.map((log, i) => (
                              <p key={i} className="text-xs text-slate-600 font-mono">
                                {log}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {idx < deploymentStages.length - 1 && (
                      <div
                        className={`ml-4 h-6 border-l-2 ${
                          stage.status === "success"
                            ? "border-green-500"
                            : stage.status === "failed"
                            ? "border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deployment Logs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">📋 Deployment Logs</h3>
          </div>
          <div className="p-6">
            {deploymentLogs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No deployments yet. Click "Deploy Now" on an environment to start.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-[#0b1220] p-4 font-mono text-xs leading-6 max-h-96 overflow-y-auto whitespace-pre-wrap break-words text-slate-100">
                {deploymentLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-300">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Rollback Section */}
        {activeEnv && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-900">↩️ Deployment Rollback</h3>
              <p className="text-sm text-slate-600 mt-1">
                Rollback to a previous version
              </p>
            </div>
            <div className="p-6 space-y-4">
              <select
                value={selectedVersion || ""}
                onChange={(e) => setSelectedVersion(e.target.value)}
                disabled={isRollingBack}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                <option value="">Select a version to rollback to...</option>
                {history
                  .filter((h) => h.environmentType === environments.find((e) => e.id === activeEnv)?.type)
                  .map((h) => (
                    <option key={h.id} value={h.version}>
                      {h.version} ({h.environmentType.toUpperCase()}) - {new Date(h.timestamp).toLocaleString()}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleRollback}
                disabled={!selectedVersion || isRollingBack}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  !selectedVersion || isRollingBack
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                {isRollingBack ? "↩️ Rolling Back..." : "↩️ Execute Rollback"}
              </button>
            </div>
          </div>
        )}

        {/* Deployment History */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">📜 Deployment History</h3>
          </div>
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                No deployment history yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-slate-900">Environment</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-900">Version</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-900">Timestamp</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-900">Status</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-900">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              h.environmentType === "production"
                                ? "bg-red-100 text-red-700"
                                : h.environmentType === "staging"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {h.environmentType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">{h.version}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(h.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {h.status === "success" ? (
                            <span className="text-green-600 font-semibold">✓ Success</span>
                          ) : (
                            <span className="text-red-600 font-semibold">✗ Failed</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{h.duration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStageSpecificLogs(stageId: string, envName: string): string[] {
  const logs: { [key: string]: string[] } = {
    checkout: [
      `Cloning repository from GitHub...`,
      `✓ Repository cloned to /tmp/workspace`,
      `✓ Switched to branch: main`
    ],
    build: [
      `Running TypeScript compilation...`,
      `✓ No type errors found`,
      `Building Docker image: app:v1.1.0`,
      `✓ Docker image built successfully`
    ],
    test: [
      `Running deployment validation tests...`,
      `✓ Configuration checks passed`,
      `✓ Environment variables verified`,
      `✓ Health endpoint responding`
    ],
    push: [
      `Authenticating to Docker Registry...`,
      `✓ Successfully authenticated`,
      `Pushing image to registry.example.com/app:v1.1.0...`,
      `✓ Image pushed successfully`
    ],
    rollout: [
      `Connecting to Kubernetes cluster (${envName})...`,
      `✓ Connected to cluster`,
      `Updating deployment configuration...`,
      `Rolling out new pods...`,
      `✓ 3/3 replicas ready`
    ],
    health: [
      `Polling health endpoints...`,
      `✓ /health: OK`,
      `✓ /metrics: OK`,
      `✓ /api/status: OK`,
      `✓ All health checks passed`
    ],
    smoke: [
      `Running smoke test suite...`,
      `✓ Load balancer responding`,
      `✓ Database connectivity verified`,
      `✓ API endpoints functional`,
      `✓ All smoke tests passed`
    ],
    monitor: [
      `Enabling monitoring and observability...`,
      `✓ Prometheus metrics enabled`,
      `✓ Distributed tracing active`,
      `✓ Log aggregation running`,
      `✓ Alerts configured`
    ]
  };

  return logs[stageId] || [];
}
