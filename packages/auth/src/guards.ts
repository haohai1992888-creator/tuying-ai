import { UserRole } from "@acs/shared";
import { authService } from "./auth.service";
import { getBearerToken, verifyAccessToken } from "./crypto";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthContext {
  userId: string;
  role: UserRole;
}

/** AuthGuard — 校验 Bearer JWT */
export async function authGuard(request: Request): Promise<AuthContext> {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) throw new AuthError("未登录");

  const payload = verifyAccessToken(token);
  if (!payload) throw new AuthError("登录已过期，请重新登录");

  const user = await authService.getUserById(payload.sub);
  if (!user) throw new AuthError("用户不存在");
  if (user.status === "BANNED") throw new AuthError("账号已被封禁", 403);
  if (user.status === "DISABLED") throw new AuthError("账号已禁用", 403);

  return { userId: payload.sub, role: payload.role as UserRole };
}

/** RoleGuard — 校验角色（@Roles("ADMIN") 等价于 roleGuard(ctx, [UserRole.ADMIN])） */
export function roleGuard(context: AuthContext, allowed: UserRole[]): void {
  if (!allowed.includes(context.role)) {
    throw new AuthError("权限不足", 403);
  }
}

export function roles(...allowed: UserRole[]) {
  return allowed;
}
