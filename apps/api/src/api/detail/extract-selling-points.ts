import type { Request, Response } from "express";
import { pointService } from "@acs/points";
import { generateSellingPoints } from "../../ai/selling";
import { DETAIL_PRICING } from "../../config/detail-price";

export async function extractSellingPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const { productName, sellingPoints } = req.body as {
      productName?: string;
      sellingPoints?: string[];
    };

    if (!productName?.trim()) {
      res.status(400).json({ message: "请输入产品名称" });
      return;
    }

    const balance = await pointService.getBalance(userId);
    if (balance < DETAIL_PRICING.sellingPoints) {
      res.status(400).json({ message: "积分不足" });
      return;
    }

    const points = await generateSellingPoints({
      productName: productName.trim(),
      userPoints: sellingPoints,
    });

    await pointService.deductPoints(
      userId,
      DETAIL_PRICING.sellingPoints,
      `卖点生成 ${productName.trim()}`
    );

    res.json({ sellingPoints: points, cost: DETAIL_PRICING.sellingPoints });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "卖点生成失败",
    });
  }
}
