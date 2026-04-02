import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./domain/auth/auth.routes.js";
import projectRoutes from "./domain/project/project.routes.js";
import repositoryRoutes from "./domain/repository/repository.routes.js";
import pipelineRoutes from "./domain/pipeline/pipeline.routes.js";
import executionRoutes from "./domain/execution/execution.routes.js";
import labRoutes from "./domain/lab/lab.routes.js";
import progressRoutes from "./domain/progress/progress.routes.js";
import leaderboardRoutes from "./domain/leaderboard/leaderboard.routes.js";
import analyticsRoutes from "./domain/analytics/analytics.routes.js";
import deploymentRoutes from "./domain/deployment/deployment.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", name: "Cloud-Based DevOps CI/CD Pipeline Simulator API" });
});

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/repository", repositoryRoutes);
app.use("/pipeline", pipelineRoutes);
app.use("/execution", executionRoutes);
app.use("/labs", labRoutes);
app.use("/progress", progressRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/deployment", deploymentRoutes);

app.use(errorHandler);
