import type { WorkflowContext, WorkflowNode } from "../types";
import { mergeContext } from "../types";

export abstract class BaseNode implements WorkflowNode {
  constructor(
    readonly id: string,
    readonly type: string,
    readonly name: string,
    readonly config: Record<string, unknown> = {}
  ) {}

  abstract execute(context: WorkflowContext): Promise<WorkflowContext>;

  protected setVariable(context: WorkflowContext, key: string, value: unknown): WorkflowContext {
    return mergeContext(context, {
      variables: { ...context.variables, [key]: value, [`node:${this.id}`]: value },
    });
  }
}
