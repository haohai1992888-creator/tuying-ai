# Phase 9 — 支付系统 + 积分系统

## 目标

- 用户余额（`User.points`）
- 积分充值 / 扣减 / 退款
- 微信支付 / 支付宝（Mock 模式）
- 支付订单与消费记录
- Workflow 任务扣费

## API（Express `:3001`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/payment/plans` | 充值套餐 |
| POST | `/api/payment/create` | 创建订单 `{ planId, channel }` |
| POST | `/api/payment/callback` | 支付回调 `{ orderId \| orderNo }` |
| GET/POST | `/api/payment/mock-pay?orderNo=` | Mock 支付完成 |
| GET | `/api/user/balance` | 余额 `{ balance }` |
| GET | `/api/user/points` | 积分流水 |

兼容别名：`/api/points`、`/api/points/logs`、`/api/payment/packages`

## 扣费规则

| 模型 | 积分 |
|------|------|
| gemini | 2 |
| seedream | 5 |
| gpt | 10 |

## 充值套餐

| 价格 | 积分 |
|------|------|
| ¥39 | 500 |
| ¥99 | 1500 |
| ¥199 | 3500 |

## 环境变量

```env
API_PUBLIC_URL=http://localhost:3001
PAYMENT_MODE=mock
```

## 验收流程

1. 登录 Desktop → 充值中心 → 选择套餐 → 微信/支付宝 → Mock 支付
2. 积分中心查看余额增加与 RECHARGE 流水
3. 创建并运行 Workflow 任务
4. 余额减少，产生 CONSUME 流水
5. 任务失败时自动 REFUND

## 启动

```bash
npm run dev:api
npm run dev:desktop
```
