import type { Request, Response } from "express";
import { versionService } from "@acs/update";

export async function latest(req: Request, res: Response): Promise<void> {
  try {
    const currentVersion =
      typeof req.query.currentVersion === "string" ? req.query.currentVersion : undefined;
    const channel = typeof req.query.channel === "string" ? req.query.channel : "STABLE";
    const platform = typeof req.query.platform === "string" ? req.query.platform : undefined;
    const deviceId = typeof req.query.deviceId === "string" ? req.query.deviceId : undefined;

    const latestVersion = await versionService.getLatest({
      currentVersion,
      channel,
      platform,
      deviceId,
    });

    if (!latestVersion) {
      res.json({
        version: currentVersion ?? "1.0.0",
        title: "当前已是最新版本",
        description: "",
        forceUpdate: false,
        downloadUrl: "",
        hasUpdate: false,
      });
      return;
    }

    res.json(latestVersion);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "检查更新失败",
    });
  }
}
