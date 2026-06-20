import type { Request, Response } from "express";
import { getTask } from "../../services/taskService";
import { toTaskResponse } from "../../utils/task-response";

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ message: "无效的任务 ID" });
      return;
    }

    const task = await getTask(id);
    if (!task || task.userId !== userId) {
      res.status(404).json({ message: "任务不存在" });
      return;
    }

    res.json(toTaskResponse(task));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取任务失败",
    });
  }
}
