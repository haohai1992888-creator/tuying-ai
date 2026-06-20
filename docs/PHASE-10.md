# Phase 10 — 会员体系（VIP System）

## 会员等级

```typescript
enum UserPlan {
  FREE
  VIP
  ENTERPRISE
}
```

用户表扩展：`plan`、`vipExpireAt`（已有字段复用）。

## 会员权益

| 权益 | 免费版 | VIP | 企业版 |
|------|--------|-----|--------|
| 月费 | 免费 | ¥29 | ¥99 |
| 开通赠送 | 注册 100 积分 | 1000 积分 | 5000 积分 |
| 每日签到 | +5 | +20 | +50 |
| 最大并发 | 3 | 10 | 30 |
| 路由策略 | Gemini 成本优先 | GPT 优先 | 质量最高 |

## 数据表

- `SubscriptionPlan` — 会员套餐（VIP / ENTERPRISE）
- `SubscriptionOrder` — 订阅订单

## 核心模块 (`packages/membership`)

| 模块 | 职责 |
|------|------|
| `MembershipService` | 开通 / 续费 / 升级 / 查询 / 每日签到 |
| `AutoRenewStub` | 自动续费预留接口（未实现扣费） |

## 联动

- **Router**：`resolveEffectivePlan` → FREE/VIP/ENTERPRISE 路由策略
- **Batch**：`ConcurrencyManager` 按 Plan 限流 3/10/30
- **Points**：`PointType.SIGN_IN` 每日签到

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/membership | 当前会员信息 |
| GET | /api/membership/plans | 可购套餐 |
| GET | /api/membership/benefits | 权益对比数据 |
| POST | /api/membership/subscribe | 开通/续费/升级 |
| POST | /api/membership/check-in | 每日签到 |
| POST | /api/membership/mock-pay | 模拟支付 |
| GET | /api/admin/memberships | 会员列表 |
| GET | /api/admin/membership/stats | 会员统计 |
| POST | /api/admin/memberships/[userId]/grant | 赠送会员 |
| POST | /api/admin/memberships/[userId]/extend | 延长会员 |
| POST | /api/admin/memberships/[userId]/cancel | 取消会员 |

## Desktop

- `/membership` — 会员中心（等级、到期、签到、升级）
- `/membership/compare` — 权益对比页

## Admin

- `/membership` — 会员管理 + 统计（数量、续费率、收入、转化率）

## 迁移

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration: `20260802000000_phase_10_membership`
