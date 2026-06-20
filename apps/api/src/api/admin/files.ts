import type { Request, Response } from "express";
import { fileService } from "@acs/files";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listFiles(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const files = await fileService.listAllFiles(limit);
    jsonSuccess(res, files);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取文件列表失败", undefined, 500);
  }
}
