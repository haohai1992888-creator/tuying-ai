import { pointService } from "@acs/points";
import { getPointCost, TaskType } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class DeductPointsNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const taskType = String(context.input.taskType ?? "prompt") as TaskType;
    const cost =
      Number(this.config.cost ?? 0) ||
      Number(context.input.cost ?? 0) ||
      getPointCost(taskType);

    if (cost <= 0) {
      return this.setVariable(context, "billing", { cost: 0, skipped: true });
    }

    const result = await pointService.deductPoints(
      context.userId,
      cost,
      `工作流消费: ${taskType}`
    );

    return this.setVariable(context, "billing", {
      cost,
      balance: result.balance,
      logId: result.log.id,
    });
  }
}
