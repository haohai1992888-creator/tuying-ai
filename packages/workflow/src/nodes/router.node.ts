import { prisma } from "@acs/database";
import { ruleBasedRouter } from "@acs/router";
import { getPointCost, resolveEffectivePlan, TaskComplexity, TaskType, UserLevel, UserRole } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class RouterNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const taskType = String(context.input.taskType ?? "prompt");
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { points: true, role: true, plan: true, vipExpireAt: true },
    });

    const userRole = user?.role ?? UserRole.USER;
    const effectivePlan = resolveEffectivePlan(user ?? {});
    const userLevel =
      effectivePlan === "ENTERPRISE"
        ? UserLevel.ENTERPRISE
        : effectivePlan === "VIP"
          ? UserLevel.VIP
          : UserLevel.FREE;

    const taskCost =
      Number(context.input.cost ?? 0) ||
      getPointCost(taskType as TaskType);

    const route = ruleBasedRouter.route({
      taskType,
      category: String(context.input.category ?? ""),
      complexity: (this.config.complexity as string) ?? TaskComplexity.MEDIUM,
      userLevel,
      userRole,
      userPlan: effectivePlan,
      userBalance: user?.points ?? 0,
      taskCost,
      preferredProvider: String(context.input.preferredProvider ?? "auto"),
    });

    return this.setVariable(context, "route", route);
  }
}
