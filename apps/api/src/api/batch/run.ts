import type { Request, Response } from "express";
import { BatchEngine } from "../../jobs/batchEngine";
import { getBatchForUser } from "../../services/batchService";
import { toBatchResponse } from "../../utils/batch-response";

export async function run(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ message: "无效的 Batch ID" });
      return;
    }

    const batch = await getBatchForUser(id, userId);
    if (!batch) {
      res.status(404).json({ message: "批量任务不存在" });
      return;
    }

    if (batch.tasks.length === 0) {
      res.status(400).json({ message: "没有可执行的子任务" });
      return;
    }

    const engine = new BatchEngine();
    await engine.execute(batch.id, batch.tasks);

    const updated = await getBatchForUser(id, userId);
    res.json({
      success: true,
      batch: updated ? toBatchResponse(updated) : null,
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "批量执行失败",
    });
  }
}
