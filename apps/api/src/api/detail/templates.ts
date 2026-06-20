import type { Request, Response } from "express";
import { detailService } from "@acs/detail";
import { loadJsonDetailTemplates } from "../../utils/detail-templates";

export async function templates(req: Request, res: Response): Promise<void> {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const dbTemplates = await detailService.listTemplates(category);
    const jsonTemplates = loadJsonDetailTemplates()
      .filter((t) => !category || t.category === category)
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: `${t.name} · ${t.style ?? "详情页"}`,
        category: t.category,
        coverUrl: `https://picsum.photos/seed/detail-${t.id}/400/600`,
        blockTypes: t.blocks,
        source: "json",
      }));

    res.json({
      templates: [
        ...jsonTemplates,
        ...dbTemplates.map((t) => ({ ...t, source: "database" })),
      ],
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取模板失败",
    });
  }
}
