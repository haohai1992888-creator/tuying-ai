import type { Request, Response } from "express";
import { versionService } from "@acs/update";
import { ReleaseChannel } from "@acs/shared";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function listVersions(_req: Request, res: Response): Promise<void> {
  try {
    const versions = await versionService.listVersions();
    jsonSuccess(res, versions);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取版本列表失败", undefined, 500);
  }
}

export async function createVersion(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    version?: string;
    title?: string;
    description?: string;
    downloadUrl?: string;
    downloadUrlWin?: string;
    downloadUrlMac?: string;
    forceUpdate?: boolean;
    channel?: ReleaseChannel;
    releaseNote?: string;
  };

  if (!body?.version || !body.title || !body.downloadUrl) {
    jsonFail(res, "请填写 version、title、downloadUrl");
    return;
  }

  try {
    const row = await versionService.createVersion({
      version: body.version,
      title: body.title,
      description: body.description ?? "",
      downloadUrl: body.downloadUrl,
      downloadUrlWin: body.downloadUrlWin,
      downloadUrlMac: body.downloadUrlMac,
      forceUpdate: body.forceUpdate,
      channel: body.channel,
      releaseNote: body.releaseNote,
    });
    jsonSuccess(res, row);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "创建失败");
  }
}

export async function versionStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await versionService.getStats();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取版本统计失败", undefined, 500);
  }
}

export async function publishVersion(req: Request, res: Response): Promise<void> {
  const id = paramString(req, "id");

  try {
    const row = await versionService.publishVersion(id);
    jsonSuccess(res, row);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "发布失败");
  }
}
