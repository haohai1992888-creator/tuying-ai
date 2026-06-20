# Phase 14 — 生产环境工程化

## 架构

```
Tauri 客户端
    ↓
Nginx (80/443)
    ↓
Express API (:3001)
    ↓
Redis Queue (BullMQ)
    ↓
Worker
    ↓
Workflow → GPT / Seedream / Gemini
    ↓
PostgreSQL + OSS
```

## 环境划分

| 文件 | 用途 |
|------|------|
| `.env.development` | 本地开发 |
| `.env.test` | CI / 测试库 |
| `.env.production` | 生产部署模板 |

加载顺序：`loadEnv()` 读取 `.env` + `.env.{APP_ENV}`（`@acs/ops`）。

## Docker

```bash
# 基础设施（Postgres + Redis）
npm run docker:up

# 完整生产栈（API + Worker + Web + Admin + Nginx）
npm run docker:prod
```

服务：

| 容器 | 端口 | 说明 |
|------|------|------|
| acs-api | 3001 | Express API |
| acs-worker | — | BullMQ Worker |
| acs-postgres | 5432 | 数据库 |
| acs-redis | 6379 | 队列 |
| acs-nginx | 80/443 | 反向代理 |

## PM2

```bash
npm run build -w @acs/api
npm run pm2:start
pm2 status
pm2 logs acs-api
pm2 startup   # 开机自启
pm2 save
```

配置：`infra/pm2/ecosystem.config.cjs`

## Redis 队列

启用：

```env
USE_REDIS_QUEUE=true
REDIS_URL=redis://localhost:6379
```

- 队列包：`@acs/queue`（BullMQ + ioredis）
- API 入队：`POST /api/task/run/:id` → 返回 `{ queued: true }`
- Worker：`npm run dev:worker` 或 `npm run worker -w @acs/api`

## Nginx + HTTPS

配置：`infra/nginx/nginx.conf`

```bash
# 获取证书（服务器上）
certbot --nginx -d api.example.com -d app.example.com -d admin.example.com
# 将证书挂载到 infra/nginx/ssl/
```

## 日志

Winston 输出到 `logs/app.log`、`logs/error.log`。

```typescript
import { logger } from "@acs/ops";
logger.info("Task Success", { taskId });
logger.error("Task failed", { error });
```

## 监控

可选 Sentry：

```env
SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0
```

```typescript
import { captureException, initMonitoring } from "@acs/ops";
await initMonitoring();
captureException(error);
```

## 限流 & API 签名

- 全局限流：`express-rate-limit`（默认 100 req/min）
- 可选签名头：`x-timestamp`、`x-nonce`、`x-signature`（设置 `API_SIGN_SECRET` 启用）

## AI 超时 & 熔断

```env
AI_TIMEOUT_MS=60000
CIRCUIT_FAILURE_THRESHOLD=5
CIRCUIT_RESET_MS=60000
```

GPT 连续失败 → 熔断 → 自动 fallback 到 Seedream/Gemini。

## 备份 & 容灾

```bash
# Linux
./scripts/backup-db.sh
./scripts/restore-db.sh backups/pg_YYYYMMDD_HHMMSS.sql.gz

# Windows
./scripts/backup-db.ps1
```

建议 crontab 每天凌晨 2 点：

```
0 2 * * * /path/to/scripts/backup-db.sh
```

Docker Postgres 数据卷 + `backups/` 目录双备份。

## 服务器建议

| 阶段 | 配置 |
|------|------|
| 开发 | 2核 2G |
| 内测 (<10人) | 2核 2G |
| 50 用户 | 4核 8G |
| 100 用户 | 8核 16G |
| 500 用户 | 16核 32G |

## 目录

```
apps/api/          API + worker 入口
apps/worker/       Worker 独立包（可选）
infra/docker/      Dockerfile + compose
infra/nginx/       反向代理
infra/pm2/         PM2 配置
scripts/           备份/恢复
logs/              运行日志
backups/           数据库备份
packages/ops/      日志/环境/熔断/监控
packages/queue/    BullMQ 队列
```

## 验收清单

- [x] Docker Compose（API + Worker + Redis + Postgres + Nginx）
- [x] PM2 ecosystem
- [x] BullMQ 任务队列 + Worker
- [x] Nginx 反向代理 + HTTPS 模板
- [x] Winston 日志
- [x] Sentry 可选集成
- [x] 数据库自动备份脚本
- [x] 限流 + API 签名
- [x] AI 超时 + 熔断 fallback
- [x] 多环境 `.env.*`
