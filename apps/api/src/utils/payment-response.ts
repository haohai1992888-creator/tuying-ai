import { randomBytes } from "node:crypto";
import { prisma } from "../db";
import { PaymentMethod } from "@acs/shared";
import { Decimal } from "@prisma/client/runtime/library";

export function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `ACS${ts}${rand}`;
}

export function apiBase(): string {
  return process.env.API_PUBLIC_URL ?? "http://localhost:3001";
}

export function parseChannel(channel: string): PaymentMethod {
  const key = channel.toLowerCase();
  if (key === "wechat" || key === "wx") return PaymentMethod.WECHAT;
  return PaymentMethod.ALIPAY;
}

export function toOrderResponse(order: {
  id: string;
  userId: string;
  orderNo: string;
  amount: Decimal;
  points: number;
  status: string;
  paymentMethod: string | null;
  createdAt: Date;
  paidAt?: Date | null;
}) {
  return {
    id: order.id,
    userId: order.userId,
    orderNo: order.orderNo,
    amount: Number(order.amount),
    points: order.points,
    status: order.status === "PAID" ? "SUCCESS" : order.status,
    channel: order.paymentMethod?.toLowerCase() ?? "wechat",
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export async function findOrderByIdForUser(orderId: string, userId?: string) {
  return prisma.order.findFirst({
    where: userId ? { id: orderId, userId } : { id: orderId },
  });
}
