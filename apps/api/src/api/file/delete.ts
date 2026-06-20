import type { Request, Response } from "express";
import { getStorageProvider } from "@acs/storage";
import { prisma } from "../../db";

export async function deleteFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ message: "无效的文件 ID" });
      return;
    }

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      res.status(404).json({ message: "文件不存在" });
      return;
    }

    const storage = getStorageProvider();
    await storage.delete(file.storagePath);
    await prisma.file.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "删除失败",
    });
  }
}
