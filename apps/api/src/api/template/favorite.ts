import type { Request, Response } from "express";
import { prisma } from "../../db";
import { favoriteTemplate, unfavoriteTemplate } from "../../services/templateService";

export async function addFavorite(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const templateId =
      (req.body as { templateId?: string }).templateId ??
      (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

    if (!templateId) {
      res.status(400).json({ message: "请提供 templateId" });
      return;
    }

    const exists = await prisma.template.findUnique({ where: { id: templateId } });
    if (!exists) {
      res.status(404).json({ message: "模板不存在" });
      return;
    }

    await favoriteTemplate(userId, templateId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "收藏失败",
    });
  }
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const templateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!templateId) {
      res.status(400).json({ message: "无效的模板 ID" });
      return;
    }

    await unfavoriteTemplate(userId, templateId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "取消收藏失败",
    });
  }
}
