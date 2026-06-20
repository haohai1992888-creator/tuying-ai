import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function redeemInvite(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const code = (req.body as { code?: string }).code ?? "";
    const user = await betaService.redeemInviteCode(userId, code);
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "兑换失败");
  }
}

export async function submitFeedback(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const body = req.body as {
      category?: "BUG" | "SUGGESTION" | "MODEL_ISSUE" | "FEATURE_REQUEST";
      content?: string;
      taskId?: string;
      model?: string;
      error?: string;
      prompt?: string;
    };

    if (!body.category || !body.content) {
      jsonFail(res, "请提供 category 和 content");
      return;
    }

    const item = await betaService.submitFeedback({
      userId,
      category: body.category,
      content: body.content,
      taskId: body.taskId,
      model: body.model,
      error: body.error,
      prompt: body.prompt,
    });
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "提交反馈失败");
  }
}

export async function reportIssue(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const body = req.body as {
      content?: string;
      taskId?: string;
      model?: string;
      error?: string;
      prompt?: string;
    };

    const item = await betaService.submitFeedback({
      userId,
      category: "BUG",
      content: body.content?.trim() || "生成失败自动上报",
      taskId: body.taskId,
      model: body.model,
      error: body.error,
      prompt: body.prompt,
    });
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "上报失败");
  }
}

export async function trackBehavior(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const body = req.body as {
      action?: "PAGE_VIEW" | "TEMPLATE_CLICK" | "IMAGE_GENERATE" | "IMAGE_EXPORT";
      module?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.action || !body.module) {
      jsonFail(res, "请提供 action 和 module");
      return;
    }

    betaService.trackBehavior({
      userId,
      action: body.action,
      module: body.module,
      metadata: body.metadata,
    });
    jsonSuccess(res, { ok: true });
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "埋点失败");
  }
}

export async function listActiveAnnouncements(_req: Request, res: Response): Promise<void> {
  try {
    const items = await betaService.listAnnouncements(true);
    jsonSuccess(res, items);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取公告失败", undefined, 500);
  }
}
