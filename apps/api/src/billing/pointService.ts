export { pointService, type PointLogDto } from "@acs/points";

export async function addPoints(userId: string, amount: number, remark?: string) {
  const { pointService } = await import("@acs/points");
  const { PointType } = await import("@acs/shared");
  return pointService.addPoints(userId, amount, PointType.RECHARGE, remark);
}

export async function deductPoints(userId: string, amount: number, remark?: string) {
  const { pointService } = await import("@acs/points");
  return pointService.deductPoints(userId, amount, remark);
}

export async function refundPoints(userId: string, amount: number, remark?: string) {
  const { pointService } = await import("@acs/points");
  return pointService.refundPoints(userId, amount, remark);
}

export async function getBalance(userId: string) {
  const { pointService } = await import("@acs/points");
  return pointService.getBalance(userId);
}

export async function listPointLogs(userId: string, limit = 50) {
  const { pointService } = await import("@acs/points");
  return pointService.listLogs(userId, limit);
}
