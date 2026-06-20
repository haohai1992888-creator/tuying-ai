import type { Request, Response } from "express";
import { membershipService } from "@acs/membership";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function listMemberships(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "50");
    const members = await membershipService.listMembers(limit);
    jsonSuccess(res, members);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取会员列表失败", undefined, 500);
  }
}

export async function extendMembership(req: Request, res: Response): Promise<void> {
  const userId = paramString(req, "userId");
  const body = req.body as { days?: number };
  if (!body?.days) {
    jsonFail(res, "请指定 days");
    return;
  }

  try {
    const membership = await membershipService.adminExtendMembership(userId, body.days);
    jsonSuccess(res, membership);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "操作失败");
  }
}

export async function grantMembership(req: Request, res: Response): Promise<void> {
  const userId = paramString(req, "userId");
  const body = req.body as { plan?: string; days?: number; grantPoints?: boolean };
  if (!body?.plan || !body.days) {
    jsonFail(res, "请指定 plan 与 days");
    return;
  }

  try {
    const membership = await membershipService.adminGrantMembership({
      userId,
      plan: body.plan as import("@acs/shared").UserPlan,
      days: body.days,
      grantPoints: body.grantPoints,
    });
    jsonSuccess(res, membership);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "操作失败");
  }
}

export async function cancelMembership(req: Request, res: Response): Promise<void> {
  const userId = paramString(req, "userId");

  try {
    const membership = await membershipService.adminCancelMembership(userId);
    jsonSuccess(res, membership);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "操作失败");
  }
}

export async function membershipStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await membershipService.getStats();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取会员统计失败", undefined, 500);
  }
}
