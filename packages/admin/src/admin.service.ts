import { prisma } from "@acs/database";
import { pointService } from "@acs/points";
import { PointType, REDIS_KEYS, UserRole, UserStatus } from "@acs/shared";
import { cacheService } from "@acs/shared/redis";

export interface AdminUserDto {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  role: UserRole;
  points: number;
  vipExpireAt: string | null;
  status: UserStatus;
  createdAt: string;
}

export class AdminService {
  async listUsers(limit = 50): Promise<AdminUserDto[]> {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapUser);
  }

  async getUser(userId: string): Promise<AdminUserDto | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? mapUser(user) : null;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<AdminUserDto> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    await cacheService.del(REDIS_KEYS.user(userId));
    return mapUser(user);
  }

  async adjustPoints(
    userId: string,
    amount: number,
    remark?: string
  ): Promise<{ balance: number }> {
    if (amount === 0) throw new Error("调整数量不能为 0");
    const result =
      amount > 0
        ? await pointService.addPoints(userId, amount, PointType.GIFT, remark ?? "管理员调整")
        : await pointService.deductPoints(userId, Math.abs(amount), remark ?? "管理员扣减");
    await cacheService.del(REDIS_KEYS.user(userId));
    return { balance: result.balance };
  }

  async updateVip(
    userId: string,
    input: { role?: UserRole; vipExpireAt?: string | null }
  ): Promise<AdminUserDto> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: input.role,
        vipExpireAt: input.vipExpireAt === undefined ? undefined : input.vipExpireAt ? new Date(input.vipExpireAt) : null,
      },
    });
    await cacheService.del(REDIS_KEYS.user(userId));
    return mapUser(user);
  }
}

function mapUser(user: {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  role: string;
  points: number;
  vipExpireAt: Date | null;
  status: string;
  createdAt: Date;
}): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    role: user.role as UserRole,
    points: user.points,
    vipExpireAt: user.vipExpireAt?.toISOString() ?? null,
    status: user.status as UserStatus,
    createdAt: user.createdAt.toISOString(),
  };
}

export const adminService = new AdminService();
