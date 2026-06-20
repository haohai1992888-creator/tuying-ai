import { AlipayProvider, type PaymentOrderInput } from "@acs/payment";

const alipayProvider = new AlipayProvider();

export async function createAlipay(order: PaymentOrderInput) {
  const result = await alipayProvider.createOrder(order);
  return {
    payUrl: result.payUrl ?? "https://pay.example.com/alipay",
    orderNo: result.orderNo,
  };
}
