import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listBetaUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await betaService.listBetaUsers();
    jsonSuccess(res, users);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取内测用户失败", undefined, 500);
  }
}

export async function addBetaUser(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { userId?: string; email?: string; expireDays?: number };
    const user = await betaService.addBetaUser(body);
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "添加内测用户失败");
  }
}

export async function removeBetaUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const user = await betaService.removeBetaUser(userId);
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "移除内测用户失败");
  }
}

export async function extendBetaUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const days = Number((req.body as { days?: number }).days ?? 30);
    const user = await betaService.extendBeta(userId, days);
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "延长资格失败");
  }
}

export async function giftBetaPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const amount = Number((req.body as { amount?: number }).amount);
    const result = await betaService.giftPoints(userId, amount as 100 | 500 | 1000);
    jsonSuccess(res, result);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "赠送积分失败");
  }
}

export async function getBetaDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await betaService.getBetaDashboardStats();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取内测统计失败", undefined, 500);
  }
}

export async function getBetaReport(_req: Request, res: Response): Promise<void> {
  try {
    const report = await betaService.generateBetaReport();
    jsonSuccess(res, report);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "生成报告失败", undefined, 500);
  }
}
