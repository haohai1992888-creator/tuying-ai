# Phase 6 — 支付系统 + 积分充值

## 架构

```
Desktop/Web API
  → OrderService.createOrder
  → PaymentProvider (Wechat / Alipay)
  → 支付回调（幂等）
  → 增加积分 + RECHARGE 流水
```

**禁止**业务代码直接调用支付 SDK，统一通过 `PaymentProvider`。

## Payment Provider

位置：`packages/payment/`

| 组件 | 职责 |
|------|------|
| WechatProvider | 微信下单、回调解析 |
| AlipayProvider | 支付宝下单、回调解析 |
| OrderService | 订单创建、支付履约（幂等） |
| PackageService | 积分套餐 CRUD |

环境变量：

- `PAYMENT_MODE=mock` — 开发模拟支付（默认）
- `WECHAT_APP_ID` / `WECHAT_MCH_ID` — 微信支付
- `ALIPAY_APP_ID` — 支付宝
- `API_PUBLIC_URL` — 回调地址前缀

## 积分套餐（V1）

| 积分 | 价格 |
|------|------|
| 100 | ¥9.9 |
| 300 | ¥29 |
| 1000 | ¥79 |
| 3000 | ¥199 |

## 订单状态

`PENDING → PAID | CLOSED | REFUNDED`

## 幂等风控

- 支付回调使用事务 + `updateMany(where: status=PENDING)` 乐观锁
- 已 `PAID` 订单重复回调直接返回成功，**不重复加积分**
- `externalTradeNo` 唯一约束防重复交易

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/payment/packages | 可用套餐列表 |
| POST | /api/payment/create-order | 创建充值订单 |
| POST | /api/payment/callback/wechat | 微信回调 |
| POST | /api/payment/callback/alipay | 支付宝回调 |
| POST | /api/payment/mock-pay?orderNo= | 模拟支付（mock 模式） |
| GET | /api/orders | 我的订单 |
| GET | /api/orders/:id | 订单详情 |
| GET | /api/admin/packages | Admin 套餐列表 |
| POST | /api/admin/packages | 新增套餐 |
| PUT | /api/admin/packages/:id | 编辑/上下架 |
| GET | /api/admin/orders | Admin 订单列表 |

### 创建订单

```json
POST /api/payment/create-order
{
  "packageId": "xxx",
  "paymentMethod": "WECHAT"
}
```

响应：

```json
{
  "orderId": "...",
  "orderNo": "ACS...",
  "payUrl": "...",
  "amount": 9.9,
  "points": 100
}
```

## Desktop

| 页面 | 路径 | 功能 |
|------|------|------|
| 充值中心 | /recharge | 选套餐、支付方式、立即购买 |
| 我的订单 | /orders | 订单列表 |

Mock 模式下点击「立即购买」自动完成模拟支付并刷新积分。

## Admin

| 页面 | 路径 |
|------|------|
| 套餐管理 | /packages |
| 订单管理 | /orders |

## 验收流程

1. 用户登录 Desktop
2. 充值中心 → 购买 100 积分套餐
3. Mock 模式自动支付成功 → 积分 +100
4. 积分中心 / 充值页余额更新
5. 商品场景图生成 → 扣 5 积分
6. Admin 查看订单与 RECHARGE 流水

## 数据库

```bash
npm run db:migrate
npm run db:seed
```
