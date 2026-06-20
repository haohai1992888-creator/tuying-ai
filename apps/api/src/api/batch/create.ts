import type { Request, Response } from "express";
import { createBatch, getBatchForUser } from "../../services/batchService";
import { toBatchResponse } from "../../utils/batch-response";

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const { prompts, type, model } = req.body as {
      prompts?: string[];
      type?: string;
      model?: string;
    };

    if (!Array.isArray(prompts) || prompts.length === 0) {
      res.status(400).json({ message: "请提供 prompts 数组" });
      return;
    }

    const batch = await createBatch({ userId, prompts, type, model });
    const detail = await getBatchForUser(batch.id, userId);
    res.json(detail ? toBatchResponse(detail) : toBatchResponse(batch));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "创建批量任务失败",
    });
  }
}
