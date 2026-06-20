import { getAIProvider } from "@acs/ai-providers";
import { trackModelCall } from "@acs/analytics";
import { getFailoverChain, modelUsageService } from "@acs/router";
import { pointService } from "@acs/points";
import { AIProviderId, getPointCost, TaskType } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

/** GenerateNode — 智能路由 + 故障转移 + 模型监控 */
export class GenerateNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const taskType = String(context.input.taskType ?? "scene_image") as TaskType;
    const cost =
      Number(context.input.cost ?? 0) ||
      Number(this.config.cost ?? 0) ||
      getPointCost(taskType);

    const balance = await pointService.getBalance(context.userId);
    if (balance < cost) {
      throw new Error("积分不足");
    }

    const route = context.variables.route as {
      provider?: string;
      fallbackChain?: string[];
    } | undefined;

    const primary = (route?.provider ?? AIProviderId.GPT) as AIProviderId;
    const chain = (route?.fallbackChain as AIProviderId[] | undefined) ?? getFailoverChain(primary);

    const promptBuilt = context.variables.promptBuilt as { prompt?: string } | undefined;
    const prompt = promptBuilt?.prompt ?? String(context.input.prompt ?? "generate image");

    const referenceUrls: string[] = [];
    const inputUrl = context.input.inputUrl ? String(context.input.inputUrl) : undefined;
    const modelRef = context.input.modelReferenceUrl ?? context.input.referenceUrl;
    if (inputUrl) referenceUrls.push(inputUrl);
    if (modelRef && String(modelRef) !== inputUrl) referenceUrls.push(String(modelRef));

    const generateInput = {
      prompt,
      referenceUrls: referenceUrls.length ? referenceUrls : undefined,
    };

    let lastError: Error | null = null;

    for (const providerId of chain) {
      const started = Date.now();
      try {
        const provider = getAIProvider(providerId);
        const result = await provider.generate(generateInput);
        const duration = Date.now() - started;

        void modelUsageService.record({
          provider: providerId,
          taskType,
          success: true,
          duration,
          taskId: context.taskId,
          userId: context.userId,
          cost,
        });

        trackModelCall({
          userId: context.userId,
          provider: providerId,
          success: true,
          duration,
          module: String(taskType),
          taskType,
          fallback: providerId !== primary,
        });

        return this.setVariable(context, "generate", {
          ...result,
          provider: providerId,
          model: result.model ?? providerId,
          failoverFrom: providerId !== primary ? primary : undefined,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const duration = Date.now() - started;

        void modelUsageService.record({
          provider: providerId,
          taskType,
          success: false,
          duration,
          taskId: context.taskId,
          userId: context.userId,
          cost: 0,
        });

        trackModelCall({
          userId: context.userId,
          provider: providerId,
          success: false,
          duration,
          module: String(taskType),
          taskType,
        });

        console.error(`[GenerateNode] ${providerId} failed, trying failover:`, lastError.message);
      }
    }

    throw lastError ?? new Error("所有模型均调用失败");
  }
}
