import type { Request, Response } from "express";
import { prisma } from "../../db";
import { toMarketplaceTemplate } from "../../utils/template-response";

export async function recent(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const recents = await prisma.recentTemplate.findMany({
      where: { userId },
      orderBy: { usedAt: "desc" },
      take: 8,
      include: { template: true },
    });

    const rows = recents.filter((r) => r.template.enabled).map((r) => r.template);
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
      message: error instanceof Error ? error.message : "获取最近使用失败",
    });
  }
}
