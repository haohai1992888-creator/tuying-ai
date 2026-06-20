import type { Request, Response } from "express";
import { prisma } from "../../db";

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        points: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "用户不存在" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      balance: user.points,
      points: user.points,
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取用户信息失败",
    });
  }
}
