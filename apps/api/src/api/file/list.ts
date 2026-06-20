import type { Request, Response } from "express";
import { FileCategory } from "@acs/shared";
import { prisma } from "../../db";
import { toFileRecord } from "../../utils/file-response";

export async function getFiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const files = await prisma.file.findMany({
      where: {
        userId,
        category: { in: [FileCategory.ORIGINAL, FileCategory.GENERATED] },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(files.map((file) => toFileRecord(file)));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取文件列表失败",
    });
  }
}
