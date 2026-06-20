/**
 * Desktop 客户端类型 — Phase 1 占位
 * 客户端禁止直接调用 AI，全部经 Business API
 */
export interface DesktopSession {
  accessToken: string;
  refreshToken: string;
}

export interface DesktopUserProfile {
  id: string;
  email: string;
  points: number;
  role: string;
}
