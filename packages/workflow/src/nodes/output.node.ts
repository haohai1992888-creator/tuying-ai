import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class OutputNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const output = {
      taskId: context.taskId,
      url: context.output.url ?? context.variables.outputUrl ?? context.input.inputUrl,
      provider: (context.variables.route as { provider?: string } | undefined)?.provider,
      prompt: (context.variables.promptBuilt as { prompt?: string } | undefined)?.prompt,
      mock: true,
      completedAt: new Date().toISOString(),
    };

    return {
      ...context,
      output,
      variables: { ...context.variables, finalOutput: output },
    };
  }
}
