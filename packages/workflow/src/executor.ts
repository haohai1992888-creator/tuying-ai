import { prisma } from "@acs/database";
import { createNode } from "./nodes";
import type { ExecutorOptions, Workflow, WorkflowContext, WorkflowNodeDefinition } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;

export class WorkflowExecutor {
  constructor(private readonly options: ExecutorOptions = {}) {}

  async execute(
    workflow: Workflow,
    context: WorkflowContext,
    workflowRunId: string
  ): Promise<WorkflowContext> {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status: "RUNNING" },
    });

    const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]));
    let currentId: string | undefined = workflow.nodes[0]?.id;
    let ctx = context;

    try {
      while (currentId) {
        const nodeDef = nodeMap.get(currentId);
        if (!nodeDef) throw new Error(`Node not found: ${currentId}`);

        ctx = await this.executeNode(nodeDef, ctx, workflowRunId);

        if (ctx.variables.__skipRemaining === true) break;
        currentId = nodeDef.next ?? undefined;
      }

      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: { status: "SUCCESS", endedAt: new Date() },
      });

      return ctx;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow failed";
      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: { status: "FAILED", error: message, endedAt: new Date() },
      });
      throw error;
    }
  }

  private async executeNode(
    nodeDef: WorkflowNodeDefinition,
    context: WorkflowContext,
    workflowRunId: string
  ): Promise<WorkflowContext> {
    const nodeRun = await prisma.workflowNodeRun.create({
      data: {
        workflowRunId,
        nodeId: nodeDef.id,
        nodeType: nodeDef.type,
        status: "RUNNING",
      },
    });

    const timeoutMs = nodeDef.timeoutMs ?? this.options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxRetries = nodeDef.maxRetries ?? this.options.defaultMaxRetries ?? DEFAULT_MAX_RETRIES;
    const node = createNode(nodeDef);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await withTimeout(node.execute(context), timeoutMs);
        await prisma.workflowNodeRun.update({
          where: { id: nodeRun.id },
          data: { status: "SUCCESS", endedAt: new Date() },
        });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) continue;
      }
    }

    if (nodeDef.skipOnError) {
      await prisma.workflowNodeRun.update({
        where: { id: nodeRun.id },
        data: {
          status: "SKIPPED",
          error: lastError?.message,
          endedAt: new Date(),
        },
      });
      return {
        ...context,
        variables: {
          ...context.variables,
          [`skipped:${nodeDef.id}`]: true,
        },
      };
    }

    await prisma.workflowNodeRun.update({
      where: { id: nodeRun.id },
      data: {
        status: "FAILED",
        error: lastError?.message,
        endedAt: new Date(),
      },
    });

    throw lastError ?? new Error(`Node ${nodeDef.id} failed`);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Node timeout after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const workflowExecutor = new WorkflowExecutor();
