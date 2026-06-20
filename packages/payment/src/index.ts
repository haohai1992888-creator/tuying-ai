export * from "./types/payment.types";
export * from "./providers/wechat/WechatProvider";
export * from "./providers/alipay/AlipayProvider";
export * from "./services/package.service";
export * from "./services/order.service";

import { PaymentMethod } from "@acs/shared";
import type { PaymentProvider } from "./types/payment.types";
import { alipayProvider, wechatProvider } from "./services/order.service";

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return method === PaymentMethod.WECHAT ? wechatProvider : alipayProvider;
}
