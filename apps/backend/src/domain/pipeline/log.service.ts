import { prisma } from "../../infrastructure/prisma.js";
import { getSocketServer } from "../../realtime/socket.js";

const levelColor: Record<string, string> = {
  INFO: "\u001b[36m",
  WARN: "\u001b[33m",
  ERROR: "\u001b[31m",
  SUCCESS: "\u001b[32m"
};

export class LogService {
  async append(runId: string, stageName: string, sequence: number, level: string, message: string) {
    const color = levelColor[level] ?? "\u001b[37m";
    const ansiMessage = `${color}${message}\u001b[0m`;

    const log = await prisma.log.create({
      data: {
        runId,
        stageName,
        level,
        message,
        ansiMessage,
        sequence
      }
    });

    const io = getSocketServer();
    io.to(`run:${runId}`).emit("pipeline-log", log);
    return log;
  }
}
