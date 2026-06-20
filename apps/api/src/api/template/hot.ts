import type { Request, Response } from "express";
import { prisma } from "../../db";
import { toMarketplaceTemplate } from "../../utils/template-response";

export async function hot(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? 10);
    const rows = await prisma.template.findMany({
      where: { enabled: true },
      orderBy: { usageCount: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
    });

    const counts = await prisma.favoriteTemplate.groupBy({
      by: ["templateId"],
      where: { templateId: { in: rows.map((t) => t.id) } },
      _count: { templateId: true },
    });
    const countMap = new Map(counts.map((r) => [r.templateId, r._count.templateId]));

    res.json(
      rows.map((row) =>
        toMarketplaceTemplate({
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
          favoriteCount: countMap.get(row.id) ?? 0,
        })
      )
    );
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取热门模板失败",
    });
  }
}
