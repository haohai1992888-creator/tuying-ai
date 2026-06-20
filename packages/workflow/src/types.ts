import type { WorkflowContext as SharedWorkflowContext } from "@acs/shared";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNodeDefinition[];
}

export interface WorkflowNodeDefinition {
  id: string;
  type: string;
  name: string;
  config?: Record<string, unknown>;
  next?: string | null;
  skipOnError?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface WorkflowContext {
  taskId: string;
  userId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  variables: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  execute(context: WorkflowContext): Promise<WorkflowContext>;
}

export interface WorkflowQueuePayload {
  taskId: string;
  userId: string;
  workflowId: string;
  input: Record<string, unknown>;
}

export interface ExecutorOptions {
  defaultTimeoutMs?: number;
  defaultMaxRetries?: number;
}

export function normalizeContext(ctx: SharedWorkflowContext | WorkflowContext): WorkflowContext {
  const raw = ctx as SharedWorkflowContext & { input?: Record<string, unknown>; output?: Record<string, unknown>; variables?: Record<string, unknown> };
  return {
    taskId: raw.taskId,
    userId: raw.userId,
    input: raw.input ?? raw.payload ?? {},
    output: raw.output ?? {},
    variables: raw.variables ?? raw.vars ?? {},
  };
}

export function mergeContext(
  ctx: WorkflowContext,
  patch: Partial<WorkflowContext>
): WorkflowContext {
  return {
    taskId: ctx.taskId,
    userId: ctx.userId,
    input: { ...ctx.input, ...patch.input },
    output: { ...ctx.output, ...patch.output },
    variables: { ...ctx.variables, ...patch.variables },
  };
}
