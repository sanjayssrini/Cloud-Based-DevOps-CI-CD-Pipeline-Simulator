import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma.js";
import { HttpError } from "../../shared/httpError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/jwt.js";

export class AuthService {
  async register(payload: { email: string; password: string; name: string }) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new HttpError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        name: payload.name,
        role: Role.STUDENT
      }
    });

    const tokens = this.issueTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return { user, ...tokens };
  }

  async login(payload: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const tokens = this.issueTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      throw new HttpError(401, "Invalid refresh token");
    }

    const tokens = this.issueTokens(user.id, user.email, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
    return tokens;
  }

  private issueTokens(userId: string, email: string, role: Role) {
    return {
      accessToken: signAccessToken({ userId, email, role }),
      refreshToken: signRefreshToken({ userId, email, role })
    };
  }
}
