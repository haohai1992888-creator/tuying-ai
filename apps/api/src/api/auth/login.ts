import type { Request, Response } from "express";
import { signAccessToken, verifyPassword } from "@acs/auth/crypto";
import { UserRole } from "@acs/shared";
import { prisma } from "../../db";

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(401).json({ message: "请提供邮箱和密码" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ message: "用户不存在" });
      return;
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "密码错误" });
      return;
    }

    const { token } = signAccessToken(user.id, user.role as UserRole);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        balance: user.points,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "登录失败",
    });
  }
}
