import type { Request, Response } from "express";
import { distributionService } from "@acs/distribution";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function downloadInfo(req: Request, res: Response): Promise<void> {
  try {
    const ua = req.headers["user-agent"];
    const info = await distributionService.getDownloadPageInfo(typeof ua === "string" ? ua : undefined);
    jsonSuccess(res, info);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取下载信息失败", undefined, 500);
  }
}

export async function updateJson(_req: Request, res: Response): Promise<void> {
  try {
    const data = await distributionService.loadUpdateJson();
    if (!data) {
      jsonFail(res, "update.json 尚未生成", undefined, 404);
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "读取 update.json 失败", undefined, 500);
  }
}
