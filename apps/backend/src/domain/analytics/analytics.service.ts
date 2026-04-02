import { RunStatus } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";

export class AnalyticsService {
  async pipelineStats(userId: string) {
    const runs = await prisma.pipelineRun.findMany({ where: { userId }, include: { logs: true } });
    const total = runs.length;
    const success = runs.filter((r) => r.status === RunStatus.SUCCESS).length;
    const failure = runs.filter((r) => r.status === RunStatus.FAILED || r.status === RunStatus.TIMED_OUT).length;

    const failurePatterns: Record<string, number> = {};
    for (const run of runs) {
      for (const log of run.logs) {
        if (log.level === "ERROR") {
          failurePatterns[log.message] = (failurePatterns[log.message] ?? 0) + 1;
        }
      }
    }

    return {
      totalRuns: total,
      successRate: total ? Number(((success / total) * 100).toFixed(2)) : 0,
      failureRate: total ? Number(((failure / total) * 100).toFixed(2)) : 0,
      topFailurePatterns: Object.entries(failurePatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }))
    };
  }
}
