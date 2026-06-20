import type { Request, Response } from "express";
import { FileCategory } from "@acs/shared";
import { getStorageProvider } from "@acs/storage";
import { prisma } from "../../db";
import { toFileRecord } from "../../utils/file-response";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "请选择文件" });
      return;
    }

    const objectName = `images/${userId}/${Date.now()}-${file.originalname}`;
    const storage = getStorageProvider();
    const url = await storage.upload(file.buffer, objectName, file.mimetype || "application/octet-stream");

    const record = await prisma.file.create({
      data: {
        userId,
        fileName: file.originalname,
        fileType: file.mimetype || "application/octet-stream",
        fileSize: file.size,
        category: FileCategory.ORIGINAL,
        storagePath: objectName,
        publicUrl: url,
      },
    });

    res.json(toFileRecord(record));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "上传失败",
    });
  }
}
