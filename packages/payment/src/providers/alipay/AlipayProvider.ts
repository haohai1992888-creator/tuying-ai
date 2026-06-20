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

/** 支付宝 Provider — 业务禁止直接调用 SDK */
export class AlipayProvider implements PaymentProvider {
  readonly name = PaymentMethod.ALIPAY;

  async createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult> {
    if (isMockMode()) {
      return {
        orderNo: input.orderNo,
        status: "PENDING",
        payUrl: `${apiBase()}/api/payment/mock-pay?orderNo=${encodeURIComponent(input.orderNo)}`,
        paymentParams: { mock: true, provider: "alipay" },
      };
    }

    const appId = process.env.ALIPAY_APP_ID?.trim();
    if (!appId) {
      throw new Error("支付宝未配置 ALIPAY_APP_ID");
    }

    return {
      orderNo: input.orderNo,
      status: "PENDING",
      payUrl: `${apiBase()}/api/payment/mock-pay?orderNo=${encodeURIComponent(input.orderNo)}`,
      paymentParams: { appId, notifyUrl: input.notifyUrl },
    };
  }

  async queryOrder(orderNo: string): Promise<PaymentQueryResult> {
    return { orderNo, status: "PENDING" };
  }

  async closeOrder(orderNo: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `支付宝关单 ${orderNo}` };
  }

  async refund(orderNo: string, amount?: number): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `支付宝退款 ${orderNo}${amount ? ` ¥${amount}` : ""}` };
  }

  async parseCallback(body: unknown, _headers?: Headers): Promise<PaymentCallbackPayload | null> {
    if (!body || typeof body !== "object") return null;
    const data = body as Record<string, unknown>;
    const orderNo = String(data.orderNo ?? data.out_trade_no ?? "");
    if (!orderNo) return null;
    return {
      orderNo,
      externalTradeNo: String(data.externalTradeNo ?? data.trade_no ?? `ali-${Date.now()}`),
      amount: Number(data.amount ?? data.total_amount ?? 0),
      success: data.success !== false && data.trade_status !== "TRADE_CLOSED",
    };
  }
}
