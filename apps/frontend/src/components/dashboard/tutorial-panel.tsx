"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export const TutorialPanel = ({ labId }: { labId: string | null }) => {
  const [stateJson, setStateJson] = useState('{"pipelineStatus":"SUCCESS"}');
  const [stepOrder, setStepOrder] = useState(1);

  const labQuery = useQuery({
    queryKey: ["lab", labId],
    queryFn: async () => {
      const { data } = await api.get(`/labs/${labId}`);
      return data;
    },
    enabled: !!labId
  });

  const submitStep = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/labs/${labId}/steps`, {
        stepOrder,
        state: JSON.parse(stateJson)
      });
      return data;
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Guided Tutorial Engine</h3>
      {!labId && <p className="mt-2 text-sm text-slate-500">Create/select a lab to start interactive guidance.</p>}
      {labQuery.data && (
        <>
          <p className="mt-2 text-sm text-slate-600">Step-locking enabled. Current lab: {labQuery.data.title}</p>
          <div className="mt-3 grid gap-2">
            {labQuery.data.steps.map((step: { id: string; order: number; title: string; stepType: string }) => (
              <div key={step.id} className="rounded border border-slate-200 p-2 text-sm">
                #{step.order} {step.title} • {step.stepType}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 grid gap-2">
        <input value={stepOrder} onChange={(e) => setStepOrder(Number(e.target.value))} type="number" className="rounded border border-slate-300 p-2" />
        <textarea value={stateJson} onChange={(e) => setStateJson(e.target.value)} className="h-24 rounded border border-slate-300 p-2 font-mono text-xs" />
      </div>
      <button onClick={() => submitStep.mutate()} disabled={!labId} className="mt-3 rounded bg-brand-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        Validate Step
      </button>
      {submitStep.data && <pre className="mt-3 rounded bg-slate-50 p-3 text-xs">{JSON.stringify(submitStep.data, null, 2)}</pre>}
    </section>
  );
}
