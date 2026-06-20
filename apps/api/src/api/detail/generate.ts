import type { Request, Response } from "express";
import { DetailBlockType } from "@acs/shared";
import { detailService } from "@acs/detail";
import { DETAIL_PRICING, FIVE_IMAGE_BLOCKS } from "../../config/detail-price";
import { resolveBlockTypes } from "../../utils/detail-templates";

export async function generate(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const body = req.body as {
      inputUrl?: string;
      productName?: string;
      templateId?: string;
      platform?: string;
      sellingPoints?: string[];
      preferredProvider?: string;
      mode?: "full" | "five";
    };

    if (!body.inputUrl) {
      res.status(400).json({ message: "请上传商品图" });
      return;
    }
    if (!body.productName?.trim()) {
      res.status(400).json({ message: "请输入产品名称" });
      return;
    }

    const jsonBlocks = resolveBlockTypes(body.templateId);
    const isFive = body.mode === "five";
    const blockTypes = isFive
      ? (FIVE_IMAGE_BLOCKS as unknown as DetailBlockType[])
      : jsonBlocks;

    const cost = isFive ? DETAIL_PRICING.fiveImages : DETAIL_PRICING.fullPage;

    const task = await detailService.generate({
      userId,
      inputUrl: body.inputUrl,
      productName: body.productName.trim(),
      templateId: jsonBlocks ? undefined : body.templateId,
      platform: body.platform,
      sellingPoints: body.sellingPoints,
      preferredProvider: body.preferredProvider,
      blockTypes,
      cost,
    });

    res.json({ task });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "生成失败",
    });
  }
}
