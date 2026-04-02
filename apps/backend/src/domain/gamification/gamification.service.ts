import { prisma } from "../../infrastructure/prisma.js";

export class GamificationService {
  async applyProgressScore(userId: string, labId: string, points: number) {
    const progress = await prisma.progress.upsert({
      where: { userId_labId: { userId, labId } },
      create: {
        userId,
        labId,
        score: points,
        streak: 1
      },
      update: {
        score: { increment: points },
        streak: { increment: 1 }
      }
    });

    const badges = await prisma.badge.findMany({ where: { threshold: { lte: progress.score } } });

    for (const badge of badges) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        create: { userId, badgeId: badge.id },
        update: {}
      });
    }

    return progress;
  }

  async leaderboard() {
    const rows = await prisma.progress.groupBy({
      by: ["userId"],
      _sum: { score: true, streak: true },
      orderBy: { _sum: { score: "desc" } }
    });

    const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } } });

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: users.find((u) => u.id === row.userId)?.name ?? "Unknown",
      score: row._sum.score ?? 0,
      streak: row._sum.streak ?? 0
    }));
  }
}
