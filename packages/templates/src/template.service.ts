import { prisma } from "@acs/database";
import { AnalyticsTracker } from "@acs/analytics";
import { taskService } from "@acs/tasks";
import {
  ANALYTICS_EVENT_TYPES,
  ANALYTICS_MODULES,
  canAccessTemplate,
  resolveEffectivePlan,
  TEMPLATE_CATEGORIES,
  UserPlan,
} from "@acs/shared";
import { renderPromptTemplate } from "./prompt-renderer";

export interface TemplateDto {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  workflowId: string;
  taskType: string;
  enabled: boolean;
  isVip: boolean;
  usageCount: number;
  sortOrder: number;
  createdAt: string;
  favorited?: boolean;
  accessible?: boolean;
  promptVariables?: string[];
}

export interface TemplateStats {
  hotTemplates: Array<{ id: string; name: string; usageCount: number; category: string }>;
  totalUsages: number;
  topCategories: Array<{ category: string; count: number }>;
}

export class TemplateService {
  async listTemplates(input: {
    userId?: string;
    category?: string;
    search?: string;
    favoritesOnly?: boolean;
    limit?: number;
  }): Promise<TemplateDto[]> {
    const user = input.userId
      ? await prisma.user.findUnique({
          where: { id: input.userId },
          select: { plan: true, vipExpireAt: true, role: true },
        })
      : null;
    const effectivePlan = user ? resolveEffectivePlan(user) : UserPlan.FREE;

    const favoriteIds = input.userId
      ? new Set(
          (
            await prisma.favoriteTemplate.findMany({
              where: { userId: input.userId },
              select: { templateId: true },
            })
          ).map((f) => f.templateId)
        )
      : new Set<string>();

    if (input.favoritesOnly && input.userId) {
      if (favoriteIds.size === 0) return [];
    }

    const rows = await prisma.template.findMany({
      where: {
        enabled: true,
        ...(input.category ? { category: input.category } : {}),
        ...(input.favoritesOnly && input.userId
          ? { id: { in: [...favoriteIds] } }
          : {}),
        ...(input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" } },
                { description: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { prompt: { select: { variables: true, content: true } } },
      orderBy: [{ sortOrder: "asc" }, { usageCount: "desc" }],
      take: input.limit ?? 50,
    });

    return rows
      .map((row) => {
        const accessible = canAccessTemplate(effectivePlan, row);
        const vars = row.prompt.variables as string[] | null;
        return {
          ...mapTemplate(row),
          favorited: favoriteIds.has(row.id),
          accessible,
          promptVariables:
            vars ??
            (row.prompt.content.match(/\{\{\s*(\w+)\s*\}\}/g)?.map((m) =>
              m.replace(/\{\{|\}\}/g, "").trim()
            ) ??
              []),
        };
      })
      .filter((t) => t.accessible);
  }

  async getTemplate(userId: string | undefined, templateId: string): Promise<TemplateDto | null> {
    const row = await prisma.template.findUnique({
      where: { id: templateId },
      include: { prompt: true },
    });
    if (!row || !row.enabled) return null;

    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true, vipExpireAt: true, role: true },
        })
      : null;
    const effectivePlan = user ? resolveEffectivePlan(user) : UserPlan.FREE;
    if (!canAccessTemplate(effectivePlan, row)) return null;

    const favorited = userId
      ? !!(await prisma.favoriteTemplate.findUnique({
          where: { userId_templateId: { userId, templateId } },
        }))
      : false;

    return {
      ...mapTemplate(row),
      favorited,
      accessible: true,
      promptVariables: (row.prompt.variables as string[] | null) ?? undefined,
    };
  }

  async getHot(limit = 10): Promise<TemplateDto[]> {
    const rows = await prisma.template.findMany({
      where: { enabled: true },
      orderBy: { usageCount: "desc" },
      take: limit,
    });
    return rows.map(mapTemplate);
  }

  async getRecent(userId: string, limit = 8): Promise<TemplateDto[]> {
    const recents = await prisma.recentTemplate.findMany({
      where: { userId },
      orderBy: { usedAt: "desc" },
      take: limit,
      include: { template: { include: { prompt: true } } },
    });
    return recents.filter((r) => r.template.enabled).map((r) => mapTemplate(r.template));
  }

  async favorite(userId: string, templateId: string): Promise<void> {
    await prisma.favoriteTemplate.upsert({
      where: { userId_templateId: { userId, templateId } },
      create: { userId, templateId },
      update: {},
    });
  }

  async unfavorite(userId: string, templateId: string): Promise<void> {
    await prisma.favoriteTemplate.deleteMany({ where: { userId, templateId } });
  }

  async generateFromTemplate(input: {
    userId: string;
    templateId: string;
    inputUrl: string;
    variables?: Record<string, string>;
    preferredProvider?: string;
  }) {
    const template = await prisma.template.findUnique({
      where: { id: input.templateId },
      include: { prompt: true },
    });
    if (!template || !template.enabled) throw new Error("模板不存在或已下架");

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { plan: true, vipExpireAt: true, role: true },
    });
    if (!user) throw new Error("用户不存在");
    if (!canAccessTemplate(resolveEffectivePlan(user), template)) {
      throw new Error("当前会员等级无法使用该模板");
    }

    const vars = input.variables ?? {};
    const renderedPrompt = renderPromptTemplate(template.prompt.content, {
      product: vars.product ?? vars.category ?? "商品",
      style: vars.style ?? "商业广告",
      scene: vars.scene ?? "现代场景",
      color: vars.color ?? "",
      festival: vars.festival ?? "",
      ...vars,
    });

    const task = await taskService.createTask({
      userId: input.userId,
      taskType: template.taskType,
      inputUrl: input.inputUrl,
      prompt: renderedPrompt,
      category: vars.product ?? vars.category ?? "商品",
      style: vars.style ?? vars.scene,
      sceneStyle: vars.scene ?? vars.style,
      preferredProvider: input.preferredProvider ?? "auto",
      templateKey: template.id,
      useTemplatePrompt: true,
    });

    await this.recordUsage(input.userId, template.id);

    return { task, renderedPrompt };
  }

  async recordUsage(userId: string, templateId: string): Promise<void> {
    await prisma.$transaction([
      prisma.templateUsage.create({ data: { userId, templateId } }),
      prisma.template.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      }),
      prisma.recentTemplate.upsert({
        where: { userId_templateId: { userId, templateId } },
        create: { userId, templateId },
        update: { usedAt: new Date() },
      }),
    ]);

    AnalyticsTracker.track({
      userId,
      eventType: ANALYTICS_EVENT_TYPES.TEMPLATE_USED,
      module: ANALYTICS_MODULES.TEMPLATE,
      action: "use",
      metadata: { templateId },
    });
  }

  async createTemplate(input: {
    name: string;
    description: string;
    category: string;
    coverUrl: string;
    workflowId: string;
    taskType: string;
    promptName: string;
    promptContent: string;
    promptVariables?: string[];
    isVip?: boolean;
    enabled?: boolean;
    sortOrder?: number;
  }): Promise<TemplateDto> {
    const prompt = await prisma.promptTemplate.create({
      data: {
        name: input.promptName,
        content: input.promptContent,
        variables: (input.promptVariables ?? []) as object,
      },
    });

    const row = await prisma.template.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        coverUrl: input.coverUrl,
        workflowId: input.workflowId,
        taskType: input.taskType,
        promptId: prompt.id,
        isVip: input.isVip ?? false,
        enabled: input.enabled ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    return mapTemplate(row);
  }

  async updateTemplate(
    id: string,
    input: Partial<{
      name: string;
      description: string;
      category: string;
      coverUrl: string;
      enabled: boolean;
      isVip: boolean;
      sortOrder: number;
      promptContent: string;
    }>
  ): Promise<TemplateDto> {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new Error("模板不存在");

    if (input.promptContent) {
      await prisma.promptTemplate.update({
        where: { id: template.promptId },
        data: { content: input.promptContent },
      });
    }

    const row = await prisma.template.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        coverUrl: input.coverUrl,
        enabled: input.enabled,
        isVip: input.isVip,
        sortOrder: input.sortOrder,
      },
    });

    return mapTemplate(row);
  }

  async listAllAdmin(limit = 100): Promise<TemplateDto[]> {
    const rows = await prisma.template.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(mapTemplate);
  }

  async getStats(): Promise<TemplateStats> {
    const [hot, totalUsages, allTemplates] = await Promise.all([
      prisma.template.findMany({
        orderBy: { usageCount: "desc" },
        take: 10,
        select: { id: true, name: true, usageCount: true, category: true },
      }),
      prisma.templateUsage.count(),
      prisma.template.findMany({ select: { category: true, usageCount: true } }),
    ]);

    const categoryTotals = new Map<string, number>();
    for (const t of allTemplates) {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.usageCount);
    }

    return {
      hotTemplates: hot,
      totalUsages,
      topCategories: [...categoryTotals.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7),
    };
  }

  getCategories(): string[] {
    return [...TEMPLATE_CATEGORIES];
  }
}

function mapTemplate(row: {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  workflowId: string;
  taskType: string;
  enabled: boolean;
  isVip: boolean;
  usageCount: number;
  sortOrder: number;
  createdAt: Date;
}): TemplateDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    coverUrl: row.coverUrl,
    workflowId: row.workflowId,
    taskType: row.taskType,
    enabled: row.enabled,
    isVip: row.isVip,
    usageCount: row.usageCount,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export const templateService = new TemplateService();
