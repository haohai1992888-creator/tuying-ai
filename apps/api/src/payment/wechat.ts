import { WechatProvider, type PaymentOrderInput } from "@acs/payment";

const wechatProvider = new WechatProvider();

export async function createWechatPay(order: PaymentOrderInput) {
  const result = await wechatProvider.createOrder(order);
  return {
    codeUrl: result.payUrl ?? result.paymentParams?.codeUrl ?? "https://pay.example.com/wechat",
    payUrl: result.payUrl,
    orderNo: result.orderNo,
  };
}
