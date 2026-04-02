"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type UploadResult = {
  id: string;
  analysisJson?: {
    dependencies?: string[];
    buildSteps?: string[];
    projectRoot?: string;
  };
  autoPipeline?: {
    id: string;
  };
};

export const UploadPanel = ({
  projectId,
  onUploaded
}: {
  projectId: string | null;
  onUploaded?: (result: UploadResult) => void;
}) => {
  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!projectId) {
        throw new Error("Create a project first");
      }
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post(`/projects/${projectId}/upload`, form);
      return data;
    },
    onSuccess: (data) => {
      onUploaded?.(data as UploadResult);
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Project Upload & Analysis</h3>
      <p className="mt-1 text-sm text-slate-500">Upload a ZIP to detect project type and generate suggested build steps.</p>
      <input
        type="file"
        accept=".zip"
        className="mt-4 block w-full rounded-lg border border-slate-300 p-2"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            upload.mutate(file);
          }
        }}
      />
      {upload.isPending && <p className="mt-3 text-sm text-brand-ocean">Analyzing project...</p>}
      {upload.isError && <p className="mt-3 text-sm text-red-600">{(upload.error as Error).message}</p>}
      {upload.data?.autoPipeline?.id && <p className="mt-3 text-sm text-green-700">Pipeline auto-generated: {upload.data.autoPipeline.id}</p>}
      {upload.data && <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(upload.data.analysisJson, null, 2)}</pre>}
    </section>
  );
}
