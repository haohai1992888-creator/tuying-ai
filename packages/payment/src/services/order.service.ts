import { prisma } from "@acs/database";
import { OrderStatus, PaymentMethod, PointType, REDIS_KEYS, REDIS_TTL } from "@acs/shared";
import { cacheService } from "@acs/shared/redis";
import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes } from "node:crypto";
import { AlipayProvider } from "../providers/alipay/AlipayProvider";
import { WechatProvider } from "../providers/wechat/WechatProvider";
import type { PaymentProvider } from "../types/payment.types";
import { packageService } from "./package.service";

export interface OrderDto {
  id: string;
  orderNo: string;
  userId: string;
  amount: number;
  points: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  packageId: string | null;
  packageName?: string | null;
  paidAt: string | null;
  createdAt: string;
  userLabel?: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderNo: string;
  payUrl: string;
  amount: number;
  points: number;
}

const wechatProvider = new WechatProvider();
const alipayProvider = new AlipayProvider();

function getProvider(method: PaymentMethod): PaymentProvider {
  return method === PaymentMethod.WECHAT ? wechatProvider : alipayProvider;
}

function apiBase(): string {
  return process.env.API_PUBLIC_URL ?? "http://localhost:3000";
}

function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `ACS${ts}${rand}`;
}

export class OrderService {
  async createOrder(input: {
    userId: string;
    packageId: string;
    paymentMethod: PaymentMethod;
  }): Promise<CreateOrderResult> {
    const pkg = await packageService.getById(input.packageId);
    if (!pkg || !pkg.enabled) throw new Error("积分套餐不存在或已下架");

    const orderNo = generateOrderNo();
    const notifyPath =
      input.paymentMethod === PaymentMethod.WECHAT
        ? "/api/payment/callback/wechat"
        : "/api/payment/callback/alipay";

    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        orderNo,
        amount: new Decimal(pkg.price),
        points: pkg.points,
        status: OrderStatus.PENDING,
        paymentMethod: input.paymentMethod,
        packageId: pkg.id,
      },
    });

    const provider = getProvider(input.paymentMethod);
    const payment = await provider.createOrder({
      orderNo,
      userId: input.userId,
      amount: pkg.price,
      points: pkg.points,
      subject: `${pkg.name}（${pkg.points}积分）`,
      notifyUrl: `${apiBase()}${notifyPath}`,
    });

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      payUrl: payment.payUrl ?? "",
      amount: pkg.price,
      points: pkg.points,
    };
  }

  async listOrders(userId: string, limit = 50): Promise<OrderDto[]> {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { package: { select: { name: true } } },
    });
    return rows.map((row) => mapOrder(row));
  }

  async getOrder(userId: string, orderId: string): Promise<OrderDto | null> {
    const row = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { package: { select: { name: true } } },
    });
    return row ? mapOrder(row) : null;
  }

  async getOrderByNo(orderNo: string): Promise<OrderDto | null> {
    const row = await prisma.order.findUnique({
      where: { orderNo },
      include: { package: { select: { name: true } } },
    });
    return row ? mapOrder(row) : null;
  }

  async listAllOrders(limit = 100): Promise<OrderDto[]> {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        package: { select: { name: true } },
        user: { select: { email: true, phone: true, nickname: true } },
      },
    });
    return rows.map((row) => ({
      ...mapOrder(row),
      userLabel:
        row.user.nickname?.trim() ||
        row.user.email?.trim() ||
        row.user.phone?.trim() ||
        row.userId.slice(0, 8),
    }));
  }

  /**
   * 支付成功回调 — 幂等：同一订单只加一次积分
   */
  async fulfillPayment(input: {
    orderNo: string;
    externalTradeNo: string;
    amount?: number;
  }): Promise<OrderDto> {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderNo: input.orderNo } });
      if (!order) throw new Error("订单不存在");

      if (order.status === OrderStatus.PAID) {
        return { order, alreadyPaid: true };
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new Error(`订单状态不可支付: ${order.status}`);
      }

      if (input.amount != null && input.amount > 0) {
        const expected = Number(order.amount);
        if (Math.abs(expected - input.amount) > 0.01) {
          throw new Error("支付金额与订单不符");
        }
      }

      const existingTrade = input.externalTradeNo
        ? await tx.order.findUnique({ where: { externalTradeNo: input.externalTradeNo } })
        : null;
      if (existingTrade && existingTrade.id !== order.id) {
        throw new Error("外部交易号已被使用");
      }

      const updatedCount = await tx.order.updateMany({
        where: { id: order.id, status: OrderStatus.PENDING },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
          externalTradeNo: input.externalTradeNo,
        },
      });

      if (updatedCount.count === 0) {
        const current = await tx.order.findUnique({ where: { orderNo: input.orderNo } });
        if (current?.status === OrderStatus.PAID) {
          return { order: current, alreadyPaid: true };
        }
        throw new Error("订单支付状态更新失败");
      }

      const user = await tx.user.update({
        where: { id: order.userId },
        data: { points: { increment: order.points } },
      });

      await tx.pointLog.create({
        data: {
          userId: order.userId,
          type: PointType.RECHARGE,
          amount: order.points,
          balance: user.points,
          remark: `充值订单 ${order.orderNo}`,
        },
      });

      const paid = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { package: { select: { name: true } } },
      });

      return { order: paid, alreadyPaid: false };
    });

    await cacheService.set(
      REDIS_KEYS.points(result.order.userId),
      String(
        (
          await prisma.user.findUnique({
            where: { id: result.order.userId },
            select: { points: true },
          })
        )?.points ?? 0
      ),
      REDIS_TTL.POINTS
    );

    if (!result.alreadyPaid) {
      const { AnalyticsTracker } = await import("@acs/analytics");
      const { ANALYTICS_EVENT_TYPES, ANALYTICS_MODULES } = await import("@acs/shared");
      AnalyticsTracker.track({
        userId: result.order.userId,
        eventType: ANALYTICS_EVENT_TYPES.PAYMENT_SUCCESS,
        module: ANALYTICS_MODULES.PAYMENT,
        action: "success",
        revenue: Number(result.order.amount),
        metadata: { orderNo: result.order.orderNo, points: result.order.points },
      });
    }

    return mapOrder(result.order);
  }

  async closeExpiredOrder(orderNo: string): Promise<void> {
    await prisma.order.updateMany({
      where: { orderNo, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CLOSED },
    });
  }

  async handleCallback(
    provider: PaymentProvider,
    body: unknown,
    headers?: Headers
  ): Promise<{ ok: boolean; message: string; order?: OrderDto }> {
    const payload = await provider.parseCallback(body, headers);
    if (!payload || !payload.success) {
      return { ok: false, message: "无效回调" };
    }

    const order = await this.fulfillPayment({
      orderNo: payload.orderNo,
      externalTradeNo: payload.externalTradeNo,
      amount: payload.amount,
    });

    return { ok: true, message: "SUCCESS", order };
  }
}

function mapOrder(row: {
  id: string;
  orderNo: string;
  userId: string;
  amount: Decimal;
  points: number;
  status: string;
  paymentMethod: string | null;
  packageId: string | null;
  paidAt: Date | null;
  createdAt: Date;
  package?: { name: string } | null;
}): OrderDto {
  return {
    id: row.id,
    orderNo: row.orderNo,
    userId: row.userId,
    amount: Number(row.amount),
    points: row.points,
    status: row.status as OrderStatus,
    paymentMethod: (row.paymentMethod as PaymentMethod | null) ?? null,
    packageId: row.packageId,
    packageName: row.package?.name ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const orderService = new OrderService();

export { getProvider, wechatProvider, alipayProvider };
