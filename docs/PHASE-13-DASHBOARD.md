# Phase 13 — 数据中心（运营后台）

## 目标

实现运营后台的数据统计与实时看板：

- 收入 / 用户 / 任务 / 积分 / 模型 / 模板 / 成本统计
- 实时 Dashboard 与图表
- Admin 权限校验
- 预警系统

## 架构

| 层 | 路径 | 说明 |
|---|---|---|
| 统计核心 | `packages/analytics/src/ops-dashboard.ts` | `getOpsDashboard()` 聚合 Prisma 数据 |
| 预警 | `packages/analytics/src/alert.service.ts` | 模型成本/失败率/支付异常检测 |
| Express API | `apps/api/src/api/admin/*` | 桌面端或外部调用，需 `Authorization: Bearer` + `ADMIN` |
| Admin Next.js | `apps/admin/app/api/admin/dashboard` | 后台 UI 使用的 BFF 接口 |
| 前端 | `apps/admin/app/(dashboard)/page.tsx` | 仪表盘 + Recharts 图表 |

## API

### Express（`:3001`）

所有接口需管理员 JWT：

```
GET /api/admin/dashboard       # 完整运营看板
GET /api/admin/stats/points    # 积分统计
GET /api/admin/stats/models    # 模型统计
GET /api/admin/stats/templates # 模板热度
GET /api/admin/stats/tasks     # 任务成功率
GET /api/admin/alerts          # 未处理预警
POST /api/admin/alerts/:id/resolve
```

### Admin Next.js（`:3001` 或独立端口）

```
GET /api/admin/dashboard
GET /api/admin/analytics       # 数据中心深度分析
GET /api/admin/stats           # 基础统计
GET /api/admin/alerts
POST /api/admin/alerts         # body: { id }
```

## 权限

- Prisma `User.role`: `USER` | `ADMIN`
- Express: `apps/api/src/middleware/admin.ts`
- Next.js: `withAdminAuth` + JWT role 校验
- 种子账号: `admin@acs.local` / `admin123`

## Dashboard 数据结构

`getOpsDashboard()` 返回：

- **today**: 今日收入、新用户、生成量、成本、利润、利润率
- **tasksStats**: 总任务、成功/失败、成功率
- **points**: 充值 / 消费 / 剩余积分
- **models**: 各模型调用次数与成本
- **templates**: 热门模板 Top 10
- **retention**: DAU / WAU / MAU
- **charts**: 周收入柱状图、模型占比饼图

## 预警 Alert

表：`alerts`（`Alert` model）

触发条件示例：

- 模型失败率 > 30%（且调用 ≥ 5 次）
- 单模型日成本 > ¥500
- 超过 1 小时未支付的 PENDING 订单 > 20 笔

## 运行

```bash
npm run db:generate
npm run db:migrate
npm run dev:admin          # 运营后台
npm run dev:api            # Express API（含 admin 路由）
```

登录后台 → 仪表盘查看卡片与图表 → 数据中心查看深度分析。

## 验收清单

- [x] 后台 Admin 登录
- [x] 收入 / 用户 / 任务 / 积分 / 模型 / 模板统计
- [x] Recharts 周收入 + 模型占比
- [x] Admin 权限 403 拦截
- [x] Alert 预警写入与展示
