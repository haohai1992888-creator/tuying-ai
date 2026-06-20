import type {
  PaymentCallbackPayload,
  PaymentOrderInput,
  PaymentOrderResult,
  PaymentQueryResult,
  PaymentRefundResult,
} from "@acs/shared";
import type { PaymentMethod } from "@acs/shared";

export interface PaymentProvider {
  readonly name: PaymentMethod;
  createOrder(input: PaymentOrderInput): Promise<PaymentOrderResult>;
  queryOrder(orderNo: string): Promise<PaymentQueryResult>;
  closeOrder(orderNo: string): Promise<{ success: boolean; message: string }>;
  refund(orderNo: string, amount?: number): Promise<PaymentRefundResult>;
  parseCallback(body: unknown, headers?: Headers): Promise<PaymentCallbackPayload | null>;
}

export type { PaymentOrderInput, PaymentOrderResult, PaymentQueryResult, PaymentCallbackPayload };
