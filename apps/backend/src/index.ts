import "dotenv/config";
import http from "node:http";
import os from "node:os";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setSocketServer } from "./realtime/socket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.NODE_ENV === "production" ? env.FRONTEND_URL : true,
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.on("join-run", (runId: string) => {
    socket.join(`run:${runId}`);
  });

  socket.on("leave-run", (runId: string) => {
    socket.leave(`run:${runId}`);
  });
});

setSocketServer(io);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.PORT} is already in use. Stop the existing process or set a different PORT in apps/backend/.env.`);
    process.exit(1);
  }

  console.error("Backend server failed to start:", error.message);
  process.exit(1);
});

server.listen(env.PORT, env.HOST, () => {
  const networkAddress = Object.values(os.networkInterfaces())
    .flat()
    .find((iface) => iface?.family === "IPv4" && !iface.internal)?.address;

  console.log(`Backend listening on http://localhost:${env.PORT}`);
  if (networkAddress) {
    console.log(`Backend LAN URL: http://${networkAddress}:${env.PORT}`);
  }
});
