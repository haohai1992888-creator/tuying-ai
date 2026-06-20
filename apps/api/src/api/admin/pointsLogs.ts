import type { Request, Response } from "express";
import { prisma } from "@acs/database";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listPointLogs(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const logs = await prisma.pointLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { nickname: true, email: true } } },
    });

    jsonSuccess(
      res,
      logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userNickname: log.user.nickname,
        userEmail: log.user.email,
        type: log.type,
        amount: log.amount,
        balance: log.balance,
        remark: log.remark,
        createdAt: log.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取积分日志失败", undefined, 500);
  }
}
