import { prisma } from "@acs/database";

export async function evaluateAlerts(): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const modelStats = await prisma.modelStats.findMany({ where: { date: today } });
  const pendingOrders = await prisma.order.count({
    where: { status: "PENDING", createdAt: { lt: new Date(Date.now() - 3600_000) } },
  });

  const checks: Array<{ message: string; level: string }> = [];

  for (const m of modelStats) {
    const failRate = m.calls > 0 ? m.fail / m.calls : 0;
    if (failRate > 0.3 && m.calls >= 5) {
      checks.push({
        message: `${m.model} 模型失败率过高 (${Math.round(failRate * 100)}%)`,
        level: "warning",
      });
    }
    if (Number(m.cost) > 500) {
      checks.push({
        message: `${m.model} 今日 AI 成本超预算 (¥${Number(m.cost).toFixed(0)})`,
        level: "critical",
      });
    }
  }

  if (pendingOrders > 20) {
    checks.push({
      message: `支付异常：${pendingOrders} 笔订单超过 1 小时未支付`,
      level: "warning",
    });
  }

  for (const check of checks) {
    const existing = await prisma.alert.findFirst({
      where: { message: check.message, resolved: false },
    });
    if (!existing) {
      await prisma.alert.create({ data: check });
    }
  }
}

export async function listAlerts(limit = 20) {
  return prisma.alert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function resolveAlert(id: string) {
  return prisma.alert.update({ where: { id }, data: { resolved: true } });
}
