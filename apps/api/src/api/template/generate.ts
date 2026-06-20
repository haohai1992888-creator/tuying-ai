import type { Request, Response } from "express";
import { generateFromTemplate } from "../../services/templateGenerateService";

export async function generate(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const templateId =
      (req.body as { templateId?: string }).templateId ??
      (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    const { inputUrl, variables, autoRun } = req.body as {
      inputUrl?: string;
      variables?: Record<string, string>;
      autoRun?: boolean;
    };

    if (!templateId) {
      res.status(400).json({ message: "请提供 templateId" });
      return;
    }

    const result = await generateFromTemplate({
      userId,
      templateId,
      inputUrl,
      variables,
      autoRun: autoRun ?? Boolean(inputUrl),
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "模板生成失败",
    });
  }
}
