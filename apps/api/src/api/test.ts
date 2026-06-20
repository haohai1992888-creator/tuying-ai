import type { Request, Response } from "express";
import { hashPassword } from "@acs/auth/crypto";
import { prisma } from "../db";

export async function createUser(_req: Request, res: Response): Promise<void> {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "test@test.com" },
    });

    if (existing) {
      res.json({ message: "User created in DB", user: existing, created: false });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: await hashPassword("123456"),
        nickname: "Phase1 Test",
      },
    });

    res.json({ message: "User created in DB", user, created: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Database error",
    });
  }
}
