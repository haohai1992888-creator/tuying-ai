import type { Request, Response } from "express";
import { hashPassword } from "@acs/auth/crypto";
import { betaService } from "@acs/beta";
import { prisma } from "../../db";
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, inviteCode } = req.body as {
      email?: string;
      password?: string;
      inviteCode?: string;
    };

    if (!email || !password) {
      res.status(400).json({ success: false, message: "请提供邮箱和密码" });
      return;
    }

    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      res.status(400).json({ success: false, message: "用户已存在" });
      return;
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        points: true,
        createdAt: true,
      },
    });

    if (inviteCode?.trim()) {
      try {
        await betaService.redeemInviteCode(user.id, inviteCode);
      } catch {
        // invite optional — registration still succeeds
      }
    }

    res.json({
      success: true,
      user: {
        ...user,
        balance: user.points,
      },
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "注册失败";
    const isDbDown =
      raw.includes("Can't reach database server") ||
      raw.includes("ECONNREFUSED") ||
      raw.includes("P1001");

    res.status(isDbDown ? 503 : 500).json({
      success: false,
      message: isDbDown
        ? "数据库未启动。请先打开 Docker Desktop，然后运行：npm run docker:up && npm run db:push && npm run db:seed"
        : "注册失败，请稍后重试",
    });
  }
}
