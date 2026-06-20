import type { Request, Response } from "express";
import { adminService } from "@acs/admin-service";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "50");
    const users = await adminService.listUsers(limit);
    jsonSuccess(res, users);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取用户列表失败", undefined, 500);
  }
}
