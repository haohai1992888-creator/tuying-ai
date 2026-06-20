# AI Commerce Studio — Release Candidate (Sprint 18)

> 内测就绪 · 统一环境 · BullMQ · 独立 Worker · 健康检查 · 生产部署

## 架构

```
Desktop (:5173) ──► API (:3001) ──► BullMQ/Redis ──► Worker (独立进程)
Admin   (:3002) ──► API /api/admin/*
Nginx   (:80/443) ──► api / admin
```

## 端口

| 服务 | 端口 |
|------|------|
| API | 3001 |
| Admin | 3002 |
| Desktop | 5173 |

## 环境变量（统一）

模板：`env/env.template`

| 环境 | 文件 | 队列 |
|------|------|------|
| 开发 | `.env.development` | `USE_MEMORY_QUEUE=true` |
| 内测/生产 | `.env.production` | `USE_REDIS_QUEUE=true` |

```bash
cp env/env.template .env
cp .env.development .env   # 或 .env.production
```

## 本地内测（RC）

```bash
npm install
npm run docker:up
npm run db:generate && npm run db:migrate && npm run db:seed

# BullMQ 内测模式（推荐验证 RC）
# .env: USE_MEMORY_QUEUE=false USE_REDIS_QUEUE=true

npm run dev:api       # :3001
npm run dev:worker    # 独立 Worker
npm run dev:admin     # :3002
npm run dev:desktop   # :5173
```

## 健康检查

```bash
curl http://localhost:3001/api/health
./scripts/healthcheck.sh
```

响应：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "checks": { "db": true, "redis": true, "queue": { "mode": "redis" } }
  }
}
```

## Docker 生产（RC）

```bash
cp .env.production .env.production.local  # 填写 POSTGRES_PASSWORD、JWT_SECRET、AI Key
npm run docker:rc
```

## PM2

```bash
npm run build -w @acs/api
npm run build -w @acs/worker
npm run build:admin
npm run pm2:start
npm run pm2:logs    # 可选
```

## 备份

```bash
./scripts/backup-db.sh
./scripts/backup-rc.sh    # DB + env 快照
./scripts/restore-db.sh backups/pg_YYYYMMDD_HHMMSS.sql.gz
```

## 验收清单

- [x] 统一环境变量 `env/env.template`
- [x] Admin :3002
- [x] Worker 独立 `apps/worker`
- [x] BullMQ 生产启用 `USE_REDIS_QUEUE=true`
- [x] `docker-compose.prod.yml`
- [x] `nginx.prod.conf`
- [x] PM2 ecosystem（api + worker + admin）
- [x] `/api/health`
- [x] 备份脚本
