import type { Request, Response } from "express";
import { createTask } from "../../services/taskService";
import { toTaskResponse } from "../../utils/task-response";

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const { type, prompt, inputUrl, model } = req.body as {
      type?: string;
      prompt?: string;
      inputUrl?: string;
      model?: string;
    };

    if (!type) {
      res.status(400).json({ message: "请提供任务类型" });
      return;
    }

    const task = await createTask({
      userId,
      type,
      prompt,
      inputUrl,
      model: model ?? "auto",
    });

    res.json(toTaskResponse(task));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "创建任务失败",
    });
  }
}
