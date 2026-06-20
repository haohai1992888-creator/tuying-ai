import type { Request, Response } from "express";
import { versionService } from "@acs/update";

export async function tauriUpdate(req: Request, res: Response): Promise<void> {
  try {
    const target = Array.isArray(req.params.target) ? req.params.target[0] : req.params.target;
    const currentVersion = Array.isArray(req.params.currentVersion)
      ? req.params.currentVersion[0]
      : req.params.currentVersion;

    if (!target || !currentVersion) {
      res.status(400).json({ message: "缺少 target 或 current_version" });
      return;
    }

    const channel = typeof req.query.channel === "string" ? req.query.channel : "STABLE";
    const deviceId = typeof req.query.deviceId === "string" ? req.query.deviceId : undefined;

    const manifest = await versionService.getTauriManifest({
      target,
      currentVersion,
      channel,
      deviceId,
    });

    if (!manifest) {
      res.status(204).send();
      return;
    }

    res.json(manifest);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取 Tauri 更新失败",
    });
  }
}
