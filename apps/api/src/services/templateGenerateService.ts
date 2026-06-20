import { prisma } from "../db";
import { renderPromptTemplate } from "../utils/prompt-renderer";
import { createTask, getTask } from "./taskService";
import { recordTemplateUsage } from "./templateService";
import { toTaskResponse } from "../utils/task-response";
import { getModelForTemplate } from "../utils/template-response";
import { WorkflowEngine } from "../workflows/workflowEngine";

export async function generateFromTemplate(input: {
  userId: string;
  templateId: string;
  inputUrl?: string;
  variables?: Record<string, string>;
  autoRun?: boolean;
}) {
  const template = await prisma.template.findUnique({
    where: { id: input.templateId },
    include: { prompt: true },
  });

  if (!template || !template.enabled) {
    throw new Error("模板不存在或已下架");
  }

  const vars = {
    product: "商品",
    style: "商业广告",
    scene: "现代场景",
    color: "",
    festival: "618",
    ...input.variables,
  };

  const renderedPrompt = renderPromptTemplate(template.prompt.content, vars);
  const model = getModelForTemplate(template);

  const task = await createTask({
    userId: input.userId,
    type: template.taskType,
    prompt: renderedPrompt,
    inputUrl: input.inputUrl,
    model,
  });

  await recordTemplateUsage(input.userId, template.id);

  if (input.autoRun !== false && input.inputUrl) {
    const workflow = new WorkflowEngine();
    await workflow.execute(task);
    const updated = await getTask(task.id);
    return {
      task: updated ? toTaskResponse(updated) : toTaskResponse(task),
      renderedPrompt,
    };
  }

  return { task: toTaskResponse(task), renderedPrompt };
}
