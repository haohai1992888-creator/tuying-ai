import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class InputNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const input = {
      ...context.input,
      taskType: context.input.taskType ?? context.variables.taskType,
      inputUrl: context.input.inputUrl ?? context.variables.inputUrl,
      referenceUrl: context.input.referenceUrl ?? context.input.modelReferenceUrl ?? context.variables.referenceUrl,
      modelReferenceUrl: context.input.modelReferenceUrl ?? context.input.referenceUrl ?? context.variables.modelReferenceUrl,
      prompt: context.input.prompt ?? context.variables.prompt,
      category: context.input.category ?? context.variables.category,
      style: context.input.style ?? context.input.sceneStyle ?? context.variables.style,
      sceneStyle: context.input.sceneStyle ?? context.input.style,
      templateKey: context.input.templateKey ?? context.input.posterTemplate ?? context.variables.templateKey,
      posterTemplate: context.input.posterTemplate ?? context.input.templateKey,
      modelTemplateKey: context.input.modelTemplateKey ?? context.input.modelStyle ?? context.variables.modelTemplateKey,
      modelStyle: context.input.modelStyle ?? context.input.modelTemplateKey,
      sellingPoints: context.input.sellingPoints ?? context.variables.sellingPoints,
      preferredProvider: context.input.preferredProvider ?? context.variables.preferredProvider ?? "auto",
      cost: context.input.cost ?? context.variables.cost ?? 0,
    };
    return this.setVariable({ ...context, input }, "input", input);
  }
}
