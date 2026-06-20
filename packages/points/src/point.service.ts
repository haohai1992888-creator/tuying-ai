import { prisma } from "@acs/database";
import { trackPointsDeduct } from "@acs/analytics";
import { PointType, REDIS_KEYS, REDIS_TTL } from "@acs/shared";
import { cacheService } from "@acs/shared/redis";

export interface PointLogDto {
  id: string;
  userId: string;
  type: PointType;
  amount: number;
  balance: number;
  remark: string | null;
  createdAt: string;
}

export class PointService {
  async getBalance(userId: string): Promise<number> {
    const cached = await cacheService.get(REDIS_KEYS.points(userId));
    if (cached) return Number(cached);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user) throw new Error("用户不存在");

    await cacheService.set(REDIS_KEYS.points(userId), String(user.points), REDIS_TTL.POINTS);
    return user.points;
  }

  async addPoints(
    userId: string,
    amount: number,
    type: PointType,
    remark?: string
  ): Promise<{ balance: number; log: PointLogDto }> {
    if (amount <= 0) throw new Error("积分数量必须大于 0");

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
      });

      const log = await tx.pointLog.create({
        data: {
          userId,
          type,
          amount,
          balance: user.points,
          remark,
        },
      });

      return { user, log };
    });

    await cacheService.set(REDIS_KEYS.points(userId), String(result.user.points), REDIS_TTL.POINTS);

    return {
      balance: result.user.points,
      log: mapLog(result.log),
    };
  }

  async deductPoints(
    userId: string,
    amount: number,
    remark?: string
  ): Promise<{ balance: number; log: PointLogDto }> {
    if (amount <= 0) throw new Error("扣减数量必须大于 0");

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id: userId } });
      if (!current) throw new Error("用户不存在");
      if (current.points < amount) throw new Error("积分不足");

      const user = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      });

      const log = await tx.pointLog.create({
        data: {
          userId,
          type: PointType.CONSUME,
          amount: -amount,
          balance: user.points,
          remark,
        },
      });

      return { user, log };
    });

    await cacheService.set(REDIS_KEYS.points(userId), String(result.user.points), REDIS_TTL.POINTS);

    trackPointsDeduct({
      userId,
      amount,
      module: "points",
      remark,
    });

    return {
      balance: result.user.points,
      log: mapLog(result.log),
    };
  }

  async refundPoints(userId: string, amount: number, remark?: string) {
    return this.addPoints(userId, amount, PointType.REFUND, remark);
  }

  async listLogs(userId: string, limit = 50): Promise<PointLogDto[]> {
    const rows = await prisma.pointLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapLog);
  }
}

function mapLog(row: {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balance: number;
  remark: string | null;
  createdAt: Date;
}): PointLogDto {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as PointType,
    amount: row.amount,
    balance: row.balance,
    remark: row.remark,
    createdAt: row.createdAt.toISOString(),
  };
}

export const pointService = new PointService();
