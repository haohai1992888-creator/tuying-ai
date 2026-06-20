import type { Request, Response } from "express";
import { authService } from "@acs/auth";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { account, password } = req.body as { account?: string; password?: string };
  if (!account || !password) {
    jsonFail(res, "请填写账号和密码");
    return;
  }

  try {
    const result = await authService.login({ account, password });
    if (result.user.role !== "ADMIN") {
      jsonFail(res, "非管理员账号", undefined, 403);
      return;
    }
    jsonSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    jsonFail(res, message, undefined, 401);
  }
}
