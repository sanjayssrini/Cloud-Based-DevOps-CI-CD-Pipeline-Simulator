"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, loadSession } from "@/lib/session";
import { useAppStore } from "@/store/app-store";
import { ProjectsList } from "@/components/dashboard/projects-list";
import { ProjectWorkspace } from "@/components/dashboard/project-workspace";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    const session = loadSession();
    if (!session.accessToken || !session.user) {
      router.replace("/login");
      return;
    }

    setAccessToken(session.accessToken);
    setUser(session.user);
    setReady(true);
  }, [router, setAccessToken, setUser]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">CI/CD Pipeline Simulator</h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedProjectId
                  ? "Build, test, and deploy your pipelines"
                  : "Create and manage your CI/CD projects"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedProjectId && (
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ← Back to Projects
                </button>
              )}
              <button
                onClick={() => {
                  clearSession();
                  router.replace("/login");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {!selectedProjectId ? (
          <ProjectsList onProjectSelect={setSelectedProjectId} />
        ) : (
          <ProjectWorkspace
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
          />
        )}
      </main>
    </div>
  );
}
