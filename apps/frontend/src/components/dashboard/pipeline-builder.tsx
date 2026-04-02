"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Stage = {
  name: string;
  type: "BUILD" | "TEST" | "DEPLOY" | "CUSTOM";
  order: number;
  conditionExpr?: string;
  retryCount: number;
  timeoutSeconds: number;
  tasks: Array<{ name: string; command: string; failChance?: number }>;
};

const starter: Stage[] = [
  { name: "Build", type: "BUILD", order: 1, conditionExpr: "always", retryCount: 1, timeoutSeconds: 30, tasks: [{ name: "install", command: "npm ci", failChance: 0.05 }] },
  { name: "Test", type: "TEST", order: 2, conditionExpr: "onSuccess", retryCount: 1, timeoutSeconds: 30, tasks: [{ name: "unit-tests", command: "npm test", failChance: 0.1 }] },
  { name: "Deploy", type: "DEPLOY", order: 3, conditionExpr: "onSuccess", retryCount: 0, timeoutSeconds: 20, tasks: [{ name: "deploy", command: "simulated deploy", failChance: 0.03 }] }
];

export const PipelineBuilder = ({ projectId, onPipelineReady }: { projectId: string | null; onPipelineReady: (pipelineId: string) => void }) => {
  const [stages, setStages] = useState<Stage[]>(starter);

  const save = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Project is required");
      }
      const { data } = await api.post("/pipeline", { projectId, config: { stages } });
      return data;
    },
    onSuccess: (data) => onPipelineReady(data.id)
  });

  const addCustom = () => {
    setStages((prev) => [
      ...prev,
      {
        name: `Custom-${prev.length + 1}`,
        type: "CUSTOM",
        order: prev.length + 1,
        conditionExpr: "onSuccess",
        retryCount: 0,
        timeoutSeconds: 25,
        tasks: [{ name: "custom", command: "echo custom", failChance: 0.15 }]
      }
    ]);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Pipeline Builder</h3>
      <p className="mt-1 text-sm text-slate-500">Configure sequential and conditional stages using JSON-backed stage definitions.</p>
      <div className="mt-4 space-y-3">
        {stages.map((stage) => (
          <article key={stage.order} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{stage.order}. {stage.name} ({stage.type})</p>
              <span className="text-xs text-slate-500">retry: {stage.retryCount} • timeout: {stage.timeoutSeconds}s</span>
            </div>
            <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify(stage.tasks, null, 2)}</pre>
          </article>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={addCustom} className="rounded-lg border border-brand-ocean/30 px-4 py-2 text-sm font-semibold text-brand-ink">Add Custom Stage</button>
        <button onClick={() => save.mutate()} className="rounded-lg bg-brand-ocean px-4 py-2 text-sm font-semibold text-white">Save Pipeline</button>
      </div>
      {save.isError && <p className="mt-3 text-sm text-red-600">{(save.error as Error).message}</p>}
      {save.data && <p className="mt-3 text-sm text-green-700">Pipeline saved. ID: {save.data.id}</p>}
    </section>
  );
}
