import { Router } from "express";
import { GamificationService } from "../gamification/gamification.service.js";

const router = Router();
const gamification = new GamificationService();

router.get("/", async (_req, res, next) => {
  try {
    const data = await gamification.leaderboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
