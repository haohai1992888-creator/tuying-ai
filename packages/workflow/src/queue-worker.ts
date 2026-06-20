import { prisma } from "@acs/database";
import { REDIS_QUEUES, TaskStatus } from "@acs/shared";
import { queueService } from "@acs/shared/redis";
import { workflowExecutor } from "./executor";
import { workflowRegistry } from "./registry";
import type { WorkflowContext, WorkflowQueuePayload } from "./types";
import { normalizeContext } from "./types";

export class WorkflowQueueWorker {
  async enqueue(payload: WorkflowQueuePayload): Promise<void> {
    await queueService.enqueue(REDIS_QUEUES.WORKFLOW, payload);
  }

  async processNext(): Promise<boolean> {
    const payload = await queueService.dequeue<WorkflowQueuePayload>(REDIS_QUEUES.WORKFLOW);
    if (!payload) return false;

    await this.runPayload(payload);
    return true;
  }

  async processAll(): Promise<number> {
    let count = 0;
    while (await this.processNext()) count += 1;
    return count;
  }

  async runPayload(payload: WorkflowQueuePayload): Promise<void> {
    const workflow = workflowRegistry.get(payload.workflowId);
    if (!workflow) {
      await this.failTask(payload.taskId, `Workflow not found: ${payload.workflowId}`);
      return;
    }

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: payload.workflowId,
        taskId: payload.taskId,
        status: "PENDING",
      },
    });

    await prisma.task.update({
      where: { id: payload.taskId },
      data: { status: TaskStatus.PROCESSING },
    });

    const context: WorkflowContext = normalizeContext({
      taskId: payload.taskId,
      userId: payload.userId,
      input: payload.input,
      output: {},
      variables: { taskType: payload.input.taskType },
    });

    try {
      const result = await workflowExecutor.execute(workflow, context, run.id);

      await prisma.task.update({
        where: { id: payload.taskId },
        data: {
          status: TaskStatus.SUCCESS,
          outputUrl: String(result.output.url ?? result.variables.outputUrl ?? ""),
          modelName: String(
            (result.variables.generate as { model?: string } | undefined)?.model ??
              (result.variables.route as { provider?: string } | undefined)?.provider ??
              "gpt"
          ),
        },
      });

      await this.notifyBatchComplete(payload.taskId, true, String(result.output.url ?? result.variables.outputUrl ?? ""));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow execution failed";
      await this.failTask(payload.taskId, message);
      await this.notifyBatchComplete(payload.taskId, false, null, message);
    }
  }

  private async notifyBatchComplete(
    taskId: string,
    success: boolean,
    outputUrl?: string | null,
    error?: string
  ): Promise<void> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { batchTaskId: true },
      });
      if (!task?.batchTaskId) return;
      const { batchEngine } = await import("@acs/batch");
      await batchEngine.handleTaskComplete({ taskId, success, outputUrl, error });
    } catch (err) {
      console.error("[workflow] batch notify failed:", err);
    }
  }

  async retryRun(workflowRunId: string): Promise<void> {
    const run = await prisma.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: { task: true },
    });
    if (!run) throw new Error("WorkflowRun not found");

    await this.enqueue({
      taskId: run.taskId,
      userId: run.task.userId,
      workflowId: run.workflowId,
      input: {
        taskType: run.task.taskType,
        inputUrl: run.task.inputUrl,
        cost: run.task.cost,
      },
    });

    await this.processNext();
  }

  private async failTask(taskId: string, error: string): Promise<void> {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.FAILED },
    });
    console.error(`[workflow] task ${taskId} failed:`, error);
  }
}

export const workflowQueueWorker = new WorkflowQueueWorker();
