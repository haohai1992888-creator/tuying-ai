import type { Request, Response } from "express";
import { WorkflowEngine } from "../../workflows/workflowEngine";
import { getTask } from "../../services/taskService";
import { toTaskResponse } from "../../utils/task-response";
import { taskQueue } from "../../queue/taskQueue";
import { isQueueEnabled } from "@acs/queue";
import { logger } from "@acs/ops";

export async function run(req: Request, res: Response): Promise<void> {
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

    if (isQueueEnabled()) {
      const queued = await taskQueue.enqueue(task.id, userId);
      if (queued) {
        logger.info("Task queued", { taskId: task.id });
        res.json({
          queued: true,
          message: "任务已加入队列",
          task: toTaskResponse({ ...task, status: "PROCESSING" }),
        });
        return;
      }
    }

    const workflow = new WorkflowEngine();
    const result = await workflow.execute(task);

    const updated = await getTask(id);
    res.json({
      result,
      task: updated ? toTaskResponse(updated) : null,
    });
  } catch (error) {
    const id = req.params.id;
    const taskId = Array.isArray(id) ? id[0] : id;
    const updated = taskId ? await getTask(taskId) : null;

    res.status(500).json({
      message: error instanceof Error ? error.message : "执行任务失败",
      task: updated ? toTaskResponse(updated) : null,
    });
  }
}
