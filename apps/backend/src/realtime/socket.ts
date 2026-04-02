import { Server } from "socket.io";

let io: Server | null = null;

export const setSocketServer = (server: Server): void => {
  io = server;
};

export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
};
