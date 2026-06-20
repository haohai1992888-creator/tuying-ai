import type { Request, Response } from "express";
import { prisma } from "../../db";
import { canAccessTemplate, resolveEffectivePlan } from "@acs/shared";
import { toMarketplaceTemplate } from "../../utils/template-response";

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ message: "无效的模板 ID" });
      return;
    }

    const row = await prisma.template.findUnique({
      where: { id },
      include: { prompt: true },
    });

    if (!row || !row.enabled) {
      res.status(404).json({ message: "模板不存在" });
      return;
    }

    const user = req.userId
      ? await prisma.user.findUnique({
          where: { id: req.userId },
          select: { plan: true, vipExpireAt: true, role: true },
        })
      : null;

    if (user && !canAccessTemplate(resolveEffectivePlan(user), row)) {
      res.status(403).json({ message: "当前会员等级无法使用该模板" });
      return;
    }

    const [favoriteCount, favorited] = await Promise.all([
      prisma.favoriteTemplate.count({ where: { templateId: id } }),
      req.userId
        ? prisma.favoriteTemplate.findUnique({
            where: { userId_templateId: { userId: req.userId, templateId: id } },
          })
        : null,
    ]);

    const vars = row.prompt.variables as string[] | null;

    res.json(
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
        prompt: row.prompt.content,
        favorited: Boolean(favorited),
        favoriteCount,
        promptVariables:
          vars ??
          (row.prompt.content.match(/\{\{\s*(\w+)\s*\}\}/g)?.map((m) =>
            m.replace(/\{\{|\}\}/g, "").trim()
          ) ??
            []),
      })
    );
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取模板详情失败",
    });
  }
}
