"use client";

import { useState } from "react";

interface DeploymentEnv {
  id: string;
  name: string;
  type: "development" | "staging" | "production";
  status: "idle" | "deploying" | "success" | "failed";
  lastDeployed?: string;
  version?: string;
}

export function DeploymentSimulator({
  projectId,
  pipelineId
}: {
  projectId: string;
  pipelineId: string | null;
}) {
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
  const [deploymentLogs, setDeploymentLogs] = useState<Array<{ id: string; message: string; time: string }>>([]);

  const handleDeploy = (envId: string) => {
    setEnvironments((prevs) =>
      prevs.map((env) =>
        env.id === envId ? { ...env, status: "deploying" as const } : env
      )
    );

    // Simulate deployment
    const logs: typeof deploymentLogs = [];
    logs.push({ id: "1", message: `[${new Date().toLocaleTimeString()}] Starting deployment to ${envId}...`, time: new Date().toISOString() });
    logs.push({ id: "2", message: `[${new Date().toLocaleTimeString()}] Building application artifacts...`, time: new Date().toISOString() });
    logs.push({ id: "3", message: `[${new Date().toLocaleTimeString()}] Running health checks...`, time: new Date().toISOString() });

    setTimeout(() => {
      const success = Math.random() > 0.2;
      logs.push({
        id: "4",
        message: success
          ? `[${new Date().toLocaleTimeString()}] ✓ Deployment successful! Version: v1.1.0`
          : `[${new Date().toLocaleTimeString()}] ✗ Deployment failed: Database connection timeout`,
        time: new Date().toISOString()
      });
      setDeploymentLogs(logs);

      setEnvironments((prevs) =>
        prevs.map((env) =>
          env.id === envId
            ? {
                ...env,
                status: success ? ("success" as const) : ("failed" as const),
                lastDeployed: new Date().toLocaleTimeString(),
                version: success ? "v1.1.0" : env.version
              }
            : env
        )
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Environments Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {environments.map((env) => (
          <div
            key={env.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div
              className={`px-4 py-3 ${
                env.type === "production"
                  ? "bg-red-50 border-b border-red-200"
                  : env.type === "staging"
                  ? "bg-yellow-50 border-b border-yellow-200"
                  : "bg-blue-50 border-b border-blue-200"
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
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    env.status === "success"
                      ? "bg-green-100 text-green-700"
                      : env.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : env.status === "deploying"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {env.status === "success"
                    ? "✓ Ready"
                    : env.status === "failed"
                    ? "✗ Failed"
                    : env.status === "deploying"
                    ? "⏳ Deploying"
                    : "○ Idle"}
                </span>
              </div>

              {/* Version */}
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 uppercase font-semibold">Current Version</p>
                <p className="mt-1 font-mono font-bold text-slate-900">{env.version}</p>
              </div>

              {/* Last Deployed */}
              {env.lastDeployed && (
                <div className="text-xs text-slate-500">
                  Last deployed: {env.lastDeployed}
                </div>
              )}

              {/* Deploy Button */}
              <button
                onClick={() => handleDeploy(env.id)}
                disabled={env.status === "deploying" || !pipelineId}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  env.status === "deploying" || !pipelineId
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-brand-ocean text-white hover:bg-brand-ocean/90"
                }`}
              >
                {env.status === "deploying" ? "⏳ Deploying..." : "🚀 Deploy Now"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Logs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="font-semibold text-slate-900">📋 Deployment Logs</h3>
        </div>
        <div className="p-4">
          {deploymentLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">No deployments yet. Click "Deploy Now" on an environment.</p>
            </div>
          ) : (
            <div className="rounded-lg bg-[#0b1220] p-4 font-mono text-xs leading-6 text-slate-100 max-h-64 overflow-y-auto">
              {deploymentLogs.map((log) => (
                <div key={log.id} className="text-slate-300">
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deployment Checklist */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Pre-Deployment Checks</h3>
          <div className="space-y-2">
            {[
              "Unit tests passing",
              "Integration tests passing",
              "Code review approved",
              "Security scan complete"
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <label className="text-sm text-slate-700">{check}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Deployment Rollback</h3>
          <p className="text-sm text-slate-600 mb-3">Rollback to previous version:</p>
          <select className="w-full rounded border border-slate-200 px-3 py-2 text-sm mb-3">
            <option>v1.0.0 (3 days ago)</option>
            <option>v0.9.5 (1 week ago)</option>
            <option>v0.9.0 (2 weeks ago)</option>
          </select>
          <button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ↩ Rollback Version
          </button>
        </div>
      </div>
    </div>
  );
}
