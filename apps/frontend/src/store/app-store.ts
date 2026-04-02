import { create } from "zustand";

interface AppState {
  accessToken: string | null;
  user: { id: string; name: string; role: string } | null;
  activeRunId: string | null;
  logs: Array<{ id: string; ansiMessage: string; message: string; sequence: number }>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AppState["user"]) => void;
  setActiveRunId: (id: string | null) => void;
  pushLog: (log: AppState["logs"][number]) => void;
  resetLogs: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  accessToken: null,
  user: null,
  activeRunId: null,
  logs: [],
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setActiveRunId: (activeRunId) => set({ activeRunId }),
  pushLog: (log) => set((state) => ({ logs: [...state.logs, log].sort((a, b) => a.sequence - b.sequence) })),
  resetLogs: () => set({ logs: [] })
}));
