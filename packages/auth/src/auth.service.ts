import { prisma, type User } from "@acs/database";
import { REGISTER_GIFT_POINTS, REDIS_KEYS, REDIS_TTL, UserRole, UserStatus } from "@acs/shared";
import { cacheService } from "@acs/shared/redis";
import {
  generateRandomToken,
  getRefreshSecret,
  hashPassword,
  hashToken,
  parseExpiresInSeconds,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from "./crypto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  avatar: string | null;
  points: number;
  role: UserRole;
  vipExpireAt: string | null;
  status: UserStatus;
}

export class AuthService {
  async register(input: {
    email?: string;
    phone?: string;
    password: string;
    nickname?: string;
  }): Promise<{ user: AuthUserProfile; tokens: TokenPair }> {
    if (!input.email && !input.phone) {
      throw new Error("请提供邮箱或手机号");
    }
    if (input.password.length < 6) {
      throw new Error("密码至少 6 位");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        password: passwordHash,
        nickname: input.nickname ?? "新用户",
        points: REGISTER_GIFT_POINTS,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        pointLogs: {
          create: {
            type: "GIFT",
            amount: REGISTER_GIFT_POINTS,
            balance: REGISTER_GIFT_POINTS,
            remark: "注册赠送",
          },
        },
      },
    });

    const tokens = await this.issueTokenPair(user);
    await this.cacheUser(user);
    return { user: mapUser(user), tokens };
  }

  async login(input: { account: string; password: string }): Promise<{ user: AuthUserProfile; tokens: TokenPair }> {
    const account = input.account.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: account }, { phone: account }],
      },
    });

    if (!user) throw new Error("账号或密码错误");
    if (user.status === UserStatus.BANNED) throw new Error("账号已被封禁");
    if (user.status === UserStatus.DISABLED) throw new Error("账号已禁用");

    const ok = await verifyPassword(input.password, user.password);
    if (!ok) throw new Error("账号或密码错误");

    const tokens = await this.issueTokenPair(user);
    await this.cacheUser(user);
    return { user: mapUser(user), tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const hash = hashToken(refreshToken);
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new Error("Refresh Token 无效或已过期");
    }
    if (record.user.status !== UserStatus.ACTIVE) {
      throw new Error("账号不可用");
    }

    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(record.user);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    if (newPassword.length < 6) throw new Error("新密码至少 6 位");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("用户不存在");

    const ok = await verifyPassword(oldPassword, user.password);
    if (!ok) throw new Error("原密码错误");

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(newPassword) },
    });

    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await cacheService.del(REDIS_KEYS.user(userId));
  }

  async requestPasswordReset(email: string): Promise<{ resetToken?: string; message: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: "若邮箱存在，将发送重置链接" };
    }

    const rawToken = generateRandomToken();
    const expiresSeconds = parseExpiresInSeconds(process.env.RESET_TOKEN_EXPIRES_IN?.trim() || "1h");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + expiresSeconds * 1000),
      },
    });

    return {
      resetToken: process.env.NODE_ENV === "development" ? rawToken : undefined,
      message: "若邮箱存在，将发送重置链接",
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 6) throw new Error("密码至少 6 位");
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error("重置链接无效或已过期");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: await hashPassword(newPassword) },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await cacheService.del(REDIS_KEYS.user(record.userId));
  }

  verifyAccessToken(token: string) {
    return verifyAccessToken(token);
  }

  async getUserById(userId: string): Promise<AuthUserProfile | null> {
    const cached = await cacheService.get(REDIS_KEYS.user(userId));
    if (cached) {
      try {
        return JSON.parse(cached) as AuthUserProfile;
      } catch {
        // ignore
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const profile = mapUser(user);
    await this.cacheUser(user);
    return profile;
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const { token: accessToken, expiresIn } = signAccessToken(user.id, user.role as UserRole);
    const refreshToken = generateRandomToken(48);
    const refreshExpires = parseExpiresInSeconds(process.env.REFRESH_TOKEN_EXPIRES_IN?.trim() || "7d");

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshExpires * 1000),
      },
    });

    await cacheService.set(REDIS_KEYS.token(user.id), hashToken(refreshToken), REDIS_TTL.TOKEN);

    return { accessToken, refreshToken, expiresIn };
  }

  private async cacheUser(user: User): Promise<void> {
    await cacheService.set(REDIS_KEYS.user(user.id), JSON.stringify(mapUser(user)), REDIS_TTL.USER);
    await cacheService.set(REDIS_KEYS.points(user.id), String(user.points), REDIS_TTL.POINTS);
  }
}

function mapUser(user: User): AuthUserProfile {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    points: user.points,
    role: user.role as UserRole,
    vipExpireAt: user.vipExpireAt?.toISOString() ?? null,
    status: user.status as UserStatus,
  };
}

export const authService = new AuthService();
