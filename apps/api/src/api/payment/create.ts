import type { Request, Response } from "express";
import { PaymentMethod } from "@acs/shared";
import { prisma } from "../../db";
import { RECHARGE_PLANS } from "../../config/price";
import { createAlipay } from "../../payment/alipay";
import { createWechatPay } from "../../payment/wechat";
import {
  apiBase,
  generateOrderNo,
  parseChannel,
  toOrderResponse,
} from "../../utils/payment-response";

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const { amount, points, channel, planId } = req.body as {
      amount?: number;
      points?: number;
      channel?: string;
      planId?: string;
    };

    let finalAmount = amount;
    let finalPoints = points;

    if (planId) {
      const plan = RECHARGE_PLANS.find((p) => p.id === planId);
      if (!plan) {
        res.status(400).json({ message: "套餐不存在" });
        return;
      }
      finalAmount = plan.price;
      finalPoints = plan.points;
    }

    if (finalAmount == null || finalPoints == null || !channel) {
      res.status(400).json({ message: "请提供 amount、points、channel 或 planId + channel" });
      return;
    }

    const paymentMethod = parseChannel(channel);
    const orderNo = generateOrderNo();
    const notifyPath =
      paymentMethod === PaymentMethod.WECHAT
        ? "/api/payment/callback/wechat"
        : "/api/payment/callback/alipay";

    const order = await prisma.order.create({
      data: {
        userId,
        orderNo,
        amount: finalAmount,
        points: finalPoints,
        paymentMethod,
        status: "PENDING",
      },
    });

    const paymentInput = {
      orderNo,
      userId,
      amount: finalAmount,
      points: finalPoints,
      subject: `充值 ${finalPoints} 积分`,
      notifyUrl: `${apiBase()}${notifyPath}`,
    };

    const pay =
      paymentMethod === PaymentMethod.WECHAT
        ? await createWechatPay(paymentInput)
        : await createAlipay(paymentInput);

    res.json({
      ...toOrderResponse(order),
      payUrl: pay.payUrl,
      codeUrl: "codeUrl" in pay ? pay.codeUrl : pay.payUrl,
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "创建订单失败",
    });
  }
}
