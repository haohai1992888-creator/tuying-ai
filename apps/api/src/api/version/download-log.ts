import type { Request, Response } from "express";
import { versionService } from "@acs/update";

export async function downloadLog(req: Request, res: Response): Promise<void> {
  try {
    const { version, platform, channel } = req.body as {
      version?: string;
      platform?: string;
      channel?: string;
    };

    if (!version) {
      res.status(400).json({ message: "缺少 version" });
      return;
    }

    await versionService.logDownload({
      version,
      userId: req.userId,
      platform,
      channel,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "记录下载失败",
    });
  }
}
