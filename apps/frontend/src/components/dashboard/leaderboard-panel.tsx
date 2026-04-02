"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const LeaderboardPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await api.get("/leaderboard");
      return data as Array<{ rank: number; name: string; score: number; streak: number }>;
    }
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold">Leaderboard</h3>
      {isLoading && <p className="mt-2 text-sm text-slate-500">Loading rankings...</p>}
      <div className="mt-3 space-y-2">
        {(data ?? []).map((row) => (
          <div key={`${row.rank}-${row.name}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
            <span>#{row.rank} {row.name}</span>
            <span className="font-semibold">{row.score} pts • streak {row.streak}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
