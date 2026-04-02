"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Stage {
  name: string;
  type: "BUILD" | "TEST" | "DEPLOY" | "CUSTOM";
  order: number;
  status: "idle" | "running" | "success" | "failed";
  tasks: Array<{ name: string; command: string; status: string }>;
  retryCount: number;
  timeoutSeconds: number;
}

export function PipelineSimulator({
  projectId,
  onPipelineReady,
  pipelineId
}: {
  projectId: string;
  onPipelineReady: (id: string) => void;
  pipelineId: string | null;
}) {
  const [stages, setStages] = useState<Stage[]>([
    {
      name: "Build",
      type: "BUILD",
      order: 1,
      status: "idle",
      tasks: [
        { name: "Compile", command: "npm run build", status: "pending" },
        { name: "Bundle", command: "webpack", status: "pending" }
      ],
      retryCount: 1,
      timeoutSeconds: 60
    },
    {
      name: "Test",
      type: "TEST",
      order: 2,
      status: "idle",
      tasks: [
        { name: "Unit Tests", command: "npm test", status: "pending" },
        { name: "Integration Tests", command: "npm run test:integration", status: "pending" }
      ],
      retryCount: 2,
      timeoutSeconds: 45
    },
    {
      name: "Deploy",
      type: "DEPLOY",
      order: 3,
      status: "idle",
      tasks: [
        { name: "Push Image", command: "docker push", status: "pending" },
        { name: "Update Service", command: "kubectl apply", status: "pending" }
      ],
      retryCount: 0,
      timeoutSeconds: 30
    }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<Array<{ id: string; message: string; level: "info" | "success" | "error" }>>([]);

  const savePipeline = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/pipeline", {
        projectId,
        config: { stages }
      });
      return data;
    },
    onSuccess: (data) => {
      onPipelineReady(data.id);
    }
  });

  const runPipeline = async () => {
    if (!pipelineId) return;

    setIsRunning(true);
    setExecutionLogs([]);
    const logs: typeof executionLogs = [];

    // Simulate pipeline execution
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setStages((prev) =>
        prev.map((s) => (s.order === stage.order ? { ...s, status: "running" as const } : s))
      );

      logs.push({
        id: `${i}-start`,
        message: `▶ Starting stage: ${stage.name}`,
        level: "info"
      });
      setExecutionLogs([...logs]);

      // Simulate tasks
      for (const task of stage.tasks) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        logs.push({
          id: `${stage.order}-${task.name}`,
          message: `  ✓ ${task.name}: ${task.command} (completed in 823ms)`,
          level: "success"
        });
        setExecutionLogs([...logs]);
      }

      const success = Math.random() > 0.15;
      setStages((prev) =>
        prev.map((s) =>
          s.order === stage.order
            ? { ...s, status: success ? ("success" as const) : ("failed" as const) }
            : s
        )
      );

      if (!success) {
        logs.push({
          id: `${i}-fail`,
          message: `✗ Stage ${stage.name} failed`,
          level: "error"
        });
        setExecutionLogs([...logs]);
        break;
      }
    }

    logs.push({
      id: "complete",
      message: "Pipeline execution completed",
      level: "info"
    });
    setExecutionLogs([...logs]);
    setIsRunning(false);
  };

  const addStage = () => {
    const newStage: Stage = {
      name: `Custom-${stages.length + 1}`,
      type: "CUSTOM",
      order: stages.length + 1,
      status: "idle",
      tasks: [{ name: "task", command: "echo 'custom'", status: "pending" }],
      retryCount: 0,
      timeoutSeconds: 30
    };
    setStages([...stages, newStage]);
  };

  const updateStage = (order: number, updates: Partial<Stage>) => {
    setStages((prev) =>
      prev.map((s) => (s.order === order ? { ...s, ...updates } : s))
    );
  };

  const removeStage = (order: number) => {
    setStages((prev) => prev.filter((s) => s.order !== order));
  };

  const statusIcon = {
    idle: "○",
    running: "⟳",
    success: "✓",
    failed: "✗"
  };

  const statusColor = {
    idle: "text-slate-400",
    running: "text-blue-600 animate-spin",
    success: "text-green-600",
    failed: "text-red-600"
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">CI/CD Pipeline Configuration</h3>
            <p className="mt-1 text-sm text-slate-500">
              {pipelineId ? `ID: ${pipelineId.slice(0, 8)}...` : "Configure your pipeline stages"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => savePipeline.mutate()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              💾 Save Pipeline
            </button>
            <button
              onClick={runPipeline}
              disabled={isRunning || !pipelineId}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isRunning ? "▶ Running..." : "▶ Execute Pipeline"}
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-6">Pipeline Stages</h3>

        {/* Flow Diagram */}
        <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <div key={stage.order} className="flex items-center gap-4">
              {/* Stage Box */}
              <div
                className={`rounded-lg border-2 px-6 py-3 text-center flex-shrink-0 w-32 ${
                  stage.status === "success"
                    ? "border-green-400 bg-green-50"
                    : stage.status === "failed"
                    ? "border-red-400 bg-red-50"
                    : stage.status === "running"
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <div className={`text-2xl ${statusColor[stage.status]}`}>
                  {statusIcon[stage.status]}
                </div>
                <p className="mt-1 font-semibold text-sm text-slate-900">{stage.name}</p>
                <p className="text-xs text-slate-500">{stage.type}</p>
              </div>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <div className="text-2xl text-slate-400">→</div>
              )}
            </div>
          ))}
        </div>

        {/* Stages Details */}
        <div className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.order}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${statusColor[stage.status]}`}>
                    {statusIcon[stage.status]}
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900">{stage.name}</h4>
                    <p className="text-xs text-slate-500">{stage.type} • Retry: {stage.retryCount} • Timeout: {stage.timeoutSeconds}s</p>
                  </div>
                </div>
                <button
                  onClick={() => removeStage(stage.order)}
                  className="text-slate-400 hover:text-red-600 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Tasks */}
              <div className="ml-8 space-y-2">
                {stage.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs">{task.command}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Stage */}
        <button
          onClick={addStage}
          className="mt-4 w-full rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          + Add Custom Stage
        </button>
      </div>

      {/* Execution Logs */}
      {executionLogs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-[#0b1220] text-slate-100 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3 bg-slate-900">
            <h3 className="font-semibold">Pipeline Execution Logs</h3>
          </div>
          <div className="p-4 font-mono text-sm leading-6 max-h-64 overflow-y-auto bg-[#020817]">
            {executionLogs.map((log) => (
              <div
                key={log.id}
                className={
                  log.level === "success"
                    ? "text-green-400"
                    : log.level === "error"
                    ? "text-red-400"
                    : "text-slate-300"
                }
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Configuration Editor */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Advanced Configuration</h3>
        <div className="rounded-lg bg-slate-50 p-4 font-mono text-xs leading-6 border border-slate-200 overflow-x-auto">
          <pre>{JSON.stringify(
            stages.map(({ name, type, order, tasks, retryCount, timeoutSeconds }) => ({
              name,
              type,
              order,
              retryCount,
              timeoutSeconds,
              tasks: tasks.map((t) => ({ name: t.name, command: t.command }))
            })),
            null,
            2
          )}</pre>
        </div>
      </div>
    </div>
  );
}
