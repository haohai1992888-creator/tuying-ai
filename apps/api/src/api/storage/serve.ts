import type { Request, Response } from "express";
import { getStorageProvider, isLocalStorage, LocalStorageProvider } from "@acs/storage";

export async function serveStorage(req: Request, res: Response): Promise<void> {
  const storage = getStorageProvider();
  if (!isLocalStorage(storage)) {
    res.status(404).json({ message: "Not Found" });
    return;
  }

  const storagePath = req.path
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");

  if (!storagePath) {
    res.status(404).json({ message: "Not Found" });
    return;
  }

  const local = storage as LocalStorageProvider;

  try {
    if (!(await local.exists(storagePath))) {
      res.status(404).json({ message: "文件不存在" });
      return;
    }

    const buffer = await local.read(storagePath);
    const ext = storagePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch {
    res.status(500).json({ message: "读取失败" });
  }
}
