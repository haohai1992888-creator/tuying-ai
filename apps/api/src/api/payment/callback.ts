import type { Request, Response } from "express";
import { orderService } from "@acs/payment";
import { findOrderByIdForUser } from "../../utils/payment-response";

export async function paymentCallback(req: Request, res: Response): Promise<void> {
  try {
    const { orderId, orderNo } = req.body as { orderId?: string; orderNo?: string };

    let resolvedOrderNo = orderNo;
    if (orderId && !resolvedOrderNo) {
      const order = await findOrderByIdForUser(orderId);
      if (!order) {
        res.status(404).json({ message: "订单不存在" });
        return;
      }
      resolvedOrderNo = order.orderNo;
    }

    if (!resolvedOrderNo) {
      res.status(400).json({ message: "请提供 orderId 或 orderNo" });
      return;
    }

    const fulfilled = await orderService.fulfillPayment({
      orderNo: resolvedOrderNo,
      externalTradeNo: `express-cb-${Date.now()}`,
    });

    if (orderId) {
      res.send("success");
      return;
    }

    res.json({
      success: true,
      order: {
        id: fulfilled.id,
        orderNo: fulfilled.orderNo,
        amount: fulfilled.amount,
        points: fulfilled.points,
        status: fulfilled.status === "PAID" ? "SUCCESS" : fulfilled.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "支付回调失败",
    });
  }
}

export async function mockPay(req: Request, res: Response): Promise<void> {
  try {
    const orderNo = String(req.query.orderNo ?? "");
    if (!orderNo) {
      res.status(400).json({ message: "缺少 orderNo" });
      return;
    }

    const fulfilled = await orderService.fulfillPayment({
      orderNo,
      externalTradeNo: `mock-${Date.now()}`,
    });

    res.json({
      success: true,
      message: "支付成功",
      points: fulfilled.points,
      order: fulfilled,
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "模拟支付失败",
    });
  }
}
