import type { Request, Response } from "express";
import { prisma } from "../../db";
import { canAccessTemplate, resolveEffectivePlan, UserPlan } from "@acs/shared";
import { toMarketplaceTemplate } from "../../utils/template-response";

async function attachFavoriteCounts(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.favoriteTemplate.groupBy({
    by: ["templateId"],
    where: { templateId: { in: ids } },
    _count: { templateId: true },
  });
  return new Map(rows.map((r) => [r.templateId, r._count.templateId]));
}

function mapRow(row: {
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
  prompt?: { variables: unknown; content: string } | null;
}) {
  const vars = row.prompt?.variables as string[] | null;
  const promptVariables =
    vars ??
    (row.prompt?.content.match(/\{\{\s*(\w+)\s*\}\}/g)?.map((m) => m.replace(/\{\{|\}\}/g, "").trim()) ??
      []);

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
    promptVariables,
  };
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const favoritesOnly = req.query.favorites === "1";

    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true, vipExpireAt: true, role: true },
        })
      : null;
    const effectivePlan = user ? resolveEffectivePlan(user) : UserPlan.FREE;

    const favoriteIds = userId
      ? new Set(
          (
            await prisma.favoriteTemplate.findMany({
              where: { userId },
              select: { templateId: true },
            })
          ).map((f) => f.templateId)
        )
      : new Set<string>();

    if (favoritesOnly && favoriteIds.size === 0) {
      res.json([]);
      return;
    }

    const rows = await prisma.template.findMany({
      where: {
        enabled: true,
        ...(category ? { category } : {}),
        ...(favoritesOnly && userId ? { id: { in: [...favoriteIds] } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { prompt: { select: { variables: true, content: true } } },
      orderBy: [{ sortOrder: "asc" }, { usageCount: "desc" }],
      take: 100,
    });

    const filtered = rows.filter((row) => canAccessTemplate(effectivePlan, row));
    const counts = await attachFavoriteCounts(filtered.map((t) => t.id));

    res.json(
      filtered.map((row) =>
        toMarketplaceTemplate({
          ...mapRow(row),
          favorited: favoriteIds.has(row.id),
          favoriteCount: counts.get(row.id) ?? 0,
        })
      )
    );
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取模板列表失败",
    });
  }
}
