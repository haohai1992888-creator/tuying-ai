import { AuthError, type AuthContext } from "@acs/auth";
import { UserRole } from "@acs/shared";

export interface FileOwner {
  userId: string;
}

/** FileGuard — 用户只能访问自己的文件，ADMIN 可访问全部 */
export function fileGuard(context: AuthContext, file: FileOwner): void {
  if (context.role === UserRole.ADMIN) return;
  if (file.userId !== context.userId) {
    throw new AuthError("无权访问该文件", 403);
  }
}
