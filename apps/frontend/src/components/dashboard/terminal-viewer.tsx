"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppStore } from "@/store/app-store";

export const TerminalViewer = ({ runId }: { runId: string | null }) => {
  const logs = useAppStore((s) => s.logs);
  const pushLog = useAppStore((s) => s.pushLog);

  useEffect(() => {
    if (!runId) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-run", runId);
    const handler = (log: { id: string; ansiMessage: string; message: string; sequence: number }) => pushLog(log);
    socket.on("pipeline-log", handler);

    return () => {
      socket.emit("leave-run", runId);
      socket.off("pipeline-log", handler);
    };
  }, [runId, pushLog]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-[#0b1220] p-5 text-slate-100">
      <h3 className="text-lg font-bold text-white">Terminal Viewer</h3>
      <div className="mt-4 h-64 overflow-auto rounded border border-slate-800 bg-[#020817] p-3 font-mono text-xs leading-6">
        {logs.length === 0 && <p className="text-slate-500">Run a pipeline to stream logs in real time.</p>}
        {logs.map((log) => (
          <p key={log.id}>[{log.sequence}] {log.message}</p>
        ))}
      </div>
    </section>
  );
}
