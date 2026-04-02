import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.json(result);
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.body.refreshToken as string;
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  }
}
