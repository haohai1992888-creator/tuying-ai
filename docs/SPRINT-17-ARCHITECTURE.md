# Sprint 17 — 架构收敛

## 目标

统一后端为 `apps/api`，Admin 纯前端，删除 `apps/web`。

## 变更摘要

| 项 | 变更 |
|----|------|
| 删除 | `apps/web` 整个应用 |
| 删除 | `apps/admin/app/api/**` 全部 Next.js API Routes |
| 删除 | `getOpsDashboard()`、`adminService.getStats()` |
| 删除 | `packages/analytics/src/ops-dashboard.ts` |
| 保留 | `getDataCenterDashboard()` 作为唯一 Dashboard 数据源 |
| 端口 | API `3001` · Admin `3002` · Desktop `5173` |
| 队列 | 开发 `USE_MEMORY_QUEUE=true` · 生产 `USE_REDIS_QUEUE=true` |

## Admin 调用方式

```
NEXT_PUBLIC_API_BASE=http://localhost:3001
Authorization: Bearer <token>
GET http://localhost:3001/api/admin/*
```

## 响应格式

```json
{ "success": true, "data": {} }
{ "success": false, "message": "", "code": "" }
```

## 修改文件清单

### 删除

- `apps/web/`（整个目录）
- `apps/admin/app/api/`（32 个 route.ts）
- `apps/admin/lib/http.ts`
- `apps/admin/lib/api-handler.ts`
- `infra/docker/Dockerfile.web`
- `packages/analytics/src/ops-dashboard.ts`
- `apps/api/src/services/dashboardService.ts`
- `apps/api/src/api/admin/stats.ts`

### 新增

- `apps/api/src/utils/response.ts`
- `apps/api/src/utils/params.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/api/auth/adminLogin.ts`
- `apps/api/src/api/admin/analytics.ts`
- `apps/api/src/api/admin/users.ts`
- `apps/api/src/api/admin/userDetail.ts`
- `apps/api/src/api/admin/files.ts`
- `apps/api/src/api/admin/videoTasks.ts`
- `apps/api/src/api/admin/memberships.ts`
- `apps/api/src/api/admin/versions.ts`
- `apps/api/src/api/admin/tasks.ts`
- `apps/api/src/api/admin/workflows.ts`
- `apps/api/src/api/admin/templates.ts`
- `apps/api/src/api/admin/packages.ts`
- `apps/api/src/api/admin/modelUsage.ts`
- `apps/api/src/api/admin/batchTasks.ts`
- `apps/api/src/api/admin/pointsLogs.ts`
- `apps/api/src/api/admin/orders.ts`
- `packages/queue/src/memory-queue.ts`
- `apps/admin/.env.local.example`
- `docs/SPRINT-17-ARCHITECTURE.md`

### 修改

- `README.md`
- `package.json`（移除 web scripts）
- `apps/admin/package.json`（端口 3002，移除后端依赖）
- `apps/admin/next.config.ts`
- `apps/admin/lib/client.ts`
- `apps/admin/app/**/*.tsx`（`res.success` + 远程 API）
- `apps/api/package.json`
- `apps/api/src/index.ts`
- `apps/api/src/middleware/admin.ts`
- `apps/api/src/api/admin/dashboard.ts`
- `apps/api/src/api/admin/alerts.ts`
- `apps/api/src/worker.ts`
- `packages/analytics/src/index.ts`
- `packages/admin/src/admin.service.ts`
- `packages/queue/src/*`
- `infra/docker/docker-compose.yml`
- `infra/docker/Dockerfile.admin`
- `infra/nginx/nginx.conf`
- `.env.example` / `.env.development` / `.env.production`
- `packages/batch/src/BatchRecoveryService.ts`（import 扩展名）
- `packages/video/src/video.service.ts`（import 扩展名）
