import type { Task, User } from "@prisma/client";
import { TaskComplexity, UserLevel, UserPlan, UserRole } from "@acs/shared";
import { ruleBasedRouter } from "@acs/router";
import { getModelCost, MODELS } from "../config/models";
import { fromDbTaskType } from "../types/task";

export interface RouteDecision {
  model: string;
  reason: string;
  fallbackChain: string[];
}

export class ModelRouter {
  route(task: Pick<Task, "taskType">, user: Pick<User, "plan" | "role" | "points">): RouteDecision {
    const result = ruleBasedRouter.route({
      taskType: task.taskType,
      complexity: TaskComplexity.MEDIUM,
      userLevel: mapPlanToLevel(String(user.plan), String(user.role)),
      userPlan: String(user.plan) as UserPlan,
      userRole: String(user.role) as UserRole,
      userBalance: user.points,
      taskCost: getModelCost(resultProviderHint(task.taskType)),
    });

    return {
      model: String(result.provider).toLowerCase(),
      reason: result.reason ?? "规则路由",
      fallbackChain: (result.fallbackChain ?? []).map((p) => p.toLowerCase()),
    };
  }

  /** 课程式简化路由（便于对照文档） */
  routeSimple(task: Pick<Task, "taskType">, user: Pick<User, "plan" | "role">): string {
    const type = fromDbTaskType(task.taskType);
    const plan = String(user.plan);
    const role = String(user.role);

    if (plan === "VIP" || plan === "ENTERPRISE" || role === "VIP" || role === "ADMIN") {
      return MODELS.GPT.key;
    }

    if (type === "detail") {
      return MODELS.GPT.key;
    }

    if (type === "scene") {
      return MODELS.SEEDREAM.key;
    }

    return MODELS.GEMINI.key;
  }
}

function mapPlanToLevel(plan: string, role: string): UserLevel {
  if (role === UserRole.ADMIN || role === "ADMIN") return UserLevel.ENTERPRISE;
  if (role === UserRole.VIP || role === "VIP") return UserLevel.VIP;
  if (plan === UserPlan.ENTERPRISE || plan === "ENTERPRISE") return UserLevel.ENTERPRISE;
  if (plan === UserPlan.VIP || plan === "VIP") return UserLevel.VIP;
  return UserLevel.FREE;
}

function resultProviderHint(taskType: string): string {
  if (taskType.includes("detail")) return MODELS.GPT.key;
  if (taskType.includes("batch")) return MODELS.GEMINI.key;
  return MODELS.GEMINI.key;
}

export const modelRouter = new ModelRouter();
