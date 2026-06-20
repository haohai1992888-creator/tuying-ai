import {
  modelPromptBuilder,
  posterPromptBuilder,
  scenePromptBuilder,
} from "@acs/ai-providers";
import { buildWhiteBgPrompt } from "@acs/ai-providers";
import { TaskType } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class PromptBuilderNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const taskType = String(context.input.taskType ?? "");
    const category = String(context.input.category ?? "商品");
    const style = String(context.input.style ?? context.input.sceneStyle ?? "");
    const locale = String(context.input.locale ?? "zh");
    const templateKey = String(context.input.templateKey ?? context.input.posterTemplate ?? "");
    const modelTemplateKey = String(context.input.modelTemplateKey ?? context.input.modelStyle ?? "");
    const userPrompt = String(context.input.prompt ?? "");
    const useTemplatePrompt = Boolean(context.input.useTemplatePrompt);

    const ocr = context.variables.ocr as { sellingPoints?: string[]; text?: string } | undefined;
    const analysis = context.variables.analysis as { sellingPoints?: string[]; headline?: string } | undefined;
    const sellingPoints =
      analysis?.sellingPoints?.join("、") ??
      ocr?.sellingPoints?.join("、") ??
      String(context.input.sellingPoints ?? userPrompt);

    let built: { prompt: string; negativePrompt: string };

    if (useTemplatePrompt && userPrompt) {
      built = {
        prompt: userPrompt,
        negativePrompt: "blurry, low quality, watermark, distorted product",
      };
    } else if (taskType === TaskType.SCENE_IMAGE || this.config.builder === "scene") {
      built = scenePromptBuilder.build({ category, style: style || "现代办公", locale });
    } else if (taskType === TaskType.POSTER || this.config.builder === "poster") {
      built = posterPromptBuilder.build({
        category,
        style,
        templateKey: templateKey || undefined,
        sellingPoints,
        locale,
      });
    } else if (taskType === TaskType.MODEL_IMAGE || this.config.builder === "model") {
      built = modelPromptBuilder.build({
        category,
        style,
        templateKey: modelTemplateKey || undefined,
        locale,
      });
    } else if (taskType === TaskType.WHITE_BACKGROUND) {
      built = {
        prompt: buildWhiteBgPrompt({ category, locale }),
        negativePrompt: "colored background, shadows on white",
      };
    } else if (userPrompt) {
      built = { prompt: userPrompt, negativePrompt: "blurry, low quality, watermark" };
    } else {
      built = scenePromptBuilder.build({ category, style: style || "现代办公", locale });
    }

    if (userPrompt && taskType === TaskType.SCENE_IMAGE) {
      built.prompt = `${built.prompt} ${userPrompt}`.trim();
    }

    return this.setVariable(context, "promptBuilt", { ...built, mock: false });
  }
}
