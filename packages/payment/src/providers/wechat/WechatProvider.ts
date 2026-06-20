import { PaymentMethod } from "@acs/shared";
import type {
  PaymentCallbackPayload,
  PaymentOrderInput,
  PaymentOrderResult,
  PaymentProvider,
  PaymentQueryResult,
} from "../../types/payment.types";

function isMockMode(): boolean {
  return (process.env.PAYMENT_MODE ?? "mock").toLowerCase() === "mock";
}

function apiBase(): string {
  return process.env.API_PUBLIC_URL ?? "http://localhost:3000";
}

/** 微信支付 Provider — 业务禁止直接调用 SDK */
export class WechatProvider implements PaymentProvider {
  readonly name = PaymentMethod.WECHAT;

  async createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult> {
    if (isMockMode()) {
      return {
        orderNo: input.orderNo,
        status: "PENDING",
        payUrl: `${apiBase()}/api/payment/mock-pay?orderNo=${encodeURIComponent(input.orderNo)}`,
        paymentParams: { mock: true, provider: "wechat" },
      };
    }

    const appId = process.env.WECHAT_APP_ID?.trim();
    const mchId = process.env.WECHAT_MCH_ID?.trim();
    if (!appId || !mchId) {
      throw new Error("微信支付未配置 WECHAT_APP_ID / WECHAT_MCH_ID");
    }

    // V1 骨架：真实 SDK 接入点
    return {
      orderNo: input.orderNo,
      status: "PENDING",
      payUrl: `${apiBase()}/api/payment/mock-pay?orderNo=${encodeURIComponent(input.orderNo)}`,
      paymentParams: { appId, mchId, notifyUrl: input.notifyUrl },
    };
  }

  async queryOrder(orderNo: string): Promise<PaymentQueryResult> {
    return { orderNo, status: "PENDING" };
  }

  async closeOrder(orderNo: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `微信关单 ${orderNo}` };
  }

  async refund(orderNo: string, amount?: number): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `微信退款 ${orderNo}${amount ? ` ¥${amount}` : ""}` };
  }

  async parseCallback(body: unknown, _headers?: Headers): Promise<PaymentCallbackPayload | null> {
    if (!body || typeof body !== "object") return null;
    const data = body as Record<string, unknown>;
    const orderNo = String(data.orderNo ?? data.out_trade_no ?? "");
    if (!orderNo) return null;
    return {
      orderNo,
      externalTradeNo: String(data.externalTradeNo ?? data.transaction_id ?? `wx-${Date.now()}`),
      amount: Number(data.amount ?? data.total_fee ?? 0),
      success: data.success !== false && data.result_code !== "FAIL",
    };
  }
}
