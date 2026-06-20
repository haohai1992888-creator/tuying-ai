import type { Task } from "@prisma/client";
import { TaskStatus } from "@acs/shared";
import { prisma } from "../db";
import { decodeTaskMeta } from "../types/task";
import { updateTask, getTask } from "./taskService";
import { generateImage } from "../workflows/generateImageWorkflow";
import { buildScenePrompt } from "../prompts/scene";
import { modelRouter } from "../router/modelRouter";
import { getPointCostForModel } from "../config/price";
import { deductPoints, refundPoints } from "../billing/pointService";
import { logger, withTimeout, isCircuitOpen, recordFailure, recordSuccess } from "@acs/ops";

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 60_000);

export async function executeTask(taskId: string): Promise<string> {
  const task = await getTask(taskId);
  if (!task) throw new Error("任务不存在");
  return new WorkflowRunner().execute(task);
}

export class WorkflowRunner {
  async execute(task: Task): Promise<string> {
    let chargedPoints = 0;

    try {
      await updateTask(task.id, { status: TaskStatus.PROCESSING, error: null });

      const user = await prisma.user.findUnique({ where: { id: task.userId } });
      if (!user) throw new Error("用户不存在");

      const meta = decodeTaskMeta(task.modelName);
      let model = meta.model;

      if (!model || model === "auto") {
        const decision = modelRouter.route(task, user);
        model = decision.model;

        if (isCircuitOpen(model)) {
          const fallback = decision.fallbackChain.find((m) => !isCircuitOpen(m));
          if (fallback) {
            logger.warn("Circuit open — using fallback", { from: model, to: fallback });
            model = fallback;
          }
        }

        await updateTask(task.id, { model });
      }

      const prompt =
        task.taskType === "scene_image" && meta.prompt.length < 120
          ? buildScenePrompt(meta.prompt)
          : meta.prompt;

      if (!prompt.trim()) throw new Error("缺少 Prompt");

      const points = getPointCostForModel(model);
      chargedPoints = points;
      await deductPoints(task.userId, points, `任务 ${task.id} · ${model}`);

      const { result, model: usedModel } = await withTimeout(
        generateImage(prompt, model, task.userId, task.inputUrl, {
          taskId: task.id,
          taskType: task.taskType,
        }),
        AI_TIMEOUT_MS,
        "generateImage"
      );

      recordSuccess(usedModel);

      await updateTask(task.id, {
        status: TaskStatus.SUCCESS,
        outputUrl: result,
        model: usedModel,
        error: null,
      });

      logger.info("Task success", { taskId: task.id, model: usedModel });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Task failed", { taskId: task.id, error: message });

      const meta = decodeTaskMeta(task.modelName);
      if (meta.model && meta.model !== "auto") {
        recordFailure(meta.model);
      }

      if (chargedPoints > 0) {
        try {
          await refundPoints(task.userId, chargedPoints, `任务失败退款 ${task.id}`);
        } catch (refundError) {
          logger.error("Refund failed", { taskId: task.id, error: refundError });
        }
      }

      await updateTask(task.id, {
        status: TaskStatus.FAILED,
        outputUrl: null,
        error: message,
      });
      throw error;
    }
  }
}

/** @deprecated use WorkflowRunner or executeTask */
export class WorkflowEngine {
  async execute(task: Task): Promise<string> {
    return new WorkflowRunner().execute(task);
  }
}
