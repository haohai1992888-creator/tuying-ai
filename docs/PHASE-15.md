# Phase 15 — Data Center（Analytics & Revenue Intelligence）

## 架构

```
Client → AnalyticsTracker.track() → POST /api/analytics/track
  → EventProcessor → AnalyticsEvent + UserStats + ModelStats + FeatureStats
  → Dashboard API → Admin 数据中心
```

## 数据表

| 表 | 说明 |
|----|------|
| `AnalyticsEvent` | 统一事件主表 |
| `UserStats` | 用户日统计 |
| `ModelStats` | 模型日统计 |
| `FeatureStats` | 功能日统计 |

## 事件类型

USER_REGISTER, USER_LOGIN, IMAGE_GENERATE, POSTER_GENERATE, DETAIL_GENERATE, VIDEO_GENERATE, BATCH_START, BATCH_COMPLETE, PAYMENT_SUCCESS, SUBSCRIBE_SUCCESS, POINTS_DEDUCT, MODEL_CALL, MODEL_FAIL, MODEL_FALLBACK, TEMPLATE_USED

## 核心包 `@acs/analytics`

- `AnalyticsTracker.track()` — 统一埋点
- `EventProcessor` — 写入事件 + 更新聚合
- `CostMonitor` — 成本阈值监控与降级建议
- `analyticsService.getDataCenterDashboard()` — Admin 看板数据

## API

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/analytics/track | 事件上报 |
| GET | /api/analytics/me | 用户数据面板 |
| Admin | GET /api/admin/analytics | 数据中心全量 |

## 埋点集成

| 位置 | 事件 |
|------|------|
| `point.service deductPoints` | POINTS_DEDUCT |
| `template.service recordUsage` | TEMPLATE_USED |
| `generate.node` | MODEL_CALL / MODEL_FAIL |
| `detail-workflow` | DETAIL_GENERATE |
| `video-workflow` | VIDEO_GENERATE |
| `order.service fulfillPayment` | PAYMENT_SUCCESS |

## Admin

路径：`/data-center` — 总览、功能、模型、用户、模板热度 + 商业洞察

## Desktop

- 路径：`/data` — 我的数据面板
- SDK：`apps/desktop/src/services/analytics.ts`

## 迁移

```bash
npm run db:generate
npm run db:migrate
```

Migration: `20260807000000_phase_15_analytics`

## 验收问题

系统可回答：哪个功能最赚钱、哪个模型最贵、哪个用户最值钱、模板转化率、AI 视频/批量是否盈利。
