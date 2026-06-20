import { prisma } from "@acs/database";
import { workflowQueueWorker, workflowRegistry } from "@acs/workflow";

export class WorkflowAdminService {
  listWorkflows() {
    return workflowRegistry.list().map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      version: w.version,
      nodeCount: w.nodes.length,
    }));
  }

  async listRuns(limit = 100, status?: string) {
    const rows = await prisma.workflowRun.findMany({
      where: status ? { status: status as import("@prisma/client").WorkflowRunStatus } : undefined,
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        task: { select: { taskType: true, userId: true, status: true } },
        nodeRuns: { orderBy: { startedAt: "asc" } },
      },
    });

    return rows.map((run) => ({
      id: run.id,
      workflowId: run.workflowId,
      taskId: run.taskId,
      status: run.status,
      error: run.error,
      startedAt: run.startedAt.toISOString(),
      endedAt: run.endedAt?.toISOString() ?? null,
      taskType: run.task.taskType,
      userId: run.task.userId,
      taskStatus: run.task.status,
      nodeRuns: run.nodeRuns.map((n) => ({
        id: n.id,
        nodeId: n.nodeId,
        nodeType: n.nodeType,
        status: n.status,
        error: n.error,
      })),
    }));
  }

  async retryRun(runId: string) {
    await workflowQueueWorker.retryRun(runId);
    return { retried: true };
  }
}

export const workflowAdminService = new WorkflowAdminService();
