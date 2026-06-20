# AI Commerce Studio（AI 电商工作台）

> **Beta 1.0.0-beta** · Tauri Desktop + Express API + Admin 运营后台 + 内测系统

## 架构

```
Desktop (:5173)
    ↓  Authorization: Bearer
Express API (:3001)  ← 唯一后端
    ↓
BullMQ (Redis) → Worker（独立进程）
    ↓
Workflow → GPT / Seedream / Gemini
    ↓
PostgreSQL · Redis · OSS

Admin UI (:3002)  →  http://localhost:3001/api/admin/*
Nginx (prod)      →  api / admin 反向代理
```

| 应用 | 端口 | 职责 |
|------|------|------|
| `apps/desktop` | 5173 | Tauri 客户端 |
| `apps/api` | 3001 | **唯一** REST API |
| `apps/admin` | 3002 | 运营后台（纯前端） |
| `apps/worker` | — | **独立** BullMQ Worker |

## 快速开始（开发）

```bash
npm install
cp env/env.template .env
# 或 cp .env.development .env

npm run docker:up          # Postgres + Redis
npm run db:generate
npm run db:migrate
npm run db:seed

npm run dev:api            # http://localhost:3001
npm run dev:admin          # http://localhost:3002
npm run dev:desktop        # http://localhost:5173
npm run dev:worker         # 独立 Worker（BullMQ 模式）
```

Admin 登录：`admin@acs.local` / `admin123`

Admin 环境：`cp apps/admin/.env.local.example apps/admin/.env.local`

## 环境变量（统一）

| 文件 | 用途 |
|------|------|
| `env/env.template` | 完整变量模板（单一来源） |
| `.env.development` | 本地开发（内存队列） |
| `.env.production` | 内测/生产（BullMQ） |

| 变量 | 开发 | RC/生产 |
|------|------|---------|
| `USE_MEMORY_QUEUE` | `true` | `false` |
| `USE_REDIS_QUEUE` | `false` | `true` |
| `ADMIN_PORT` | `3002` | `3002` |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:3001` | `https://api.example.com` |

## 健康检查

```bash
curl http://localhost:3001/api/health
./scripts/healthcheck.sh
```

## 内测部署（RC）

```bash
# 1. 配置生产环境
cp .env.production .env
# 编辑 POSTGRES_PASSWORD、JWT_SECRET、AI Key

# 2. Docker 生产栈
npm run docker:rc

# 3. 或 PM2（裸机）
npm run build -w @acs/api
npm run build -w @acs/worker
npm run build:admin
npm run pm2:start
```

## 备份

```bash
./scripts/backup-db.sh
./scripts/backup-rc.sh
```

## API 约定

**认证：** `Authorization: Bearer <token>`

```json
{ "success": true, "data": {} }
{ "success": false, "message": "...", "code": "..." }
```

## Desktop Distribution & Release (Sprint 22)

支持 **Windows x64**（`AI-Commerce-Setup.exe`）与 **macOS Universal**（`AI-Commerce.dmg`），由 GitHub Actions 自动构建并发布到 **download.xxx.com**。

### 环境变量

```bash
DOWNLOAD_BASE_URL=https://download.xxx.com
VITE_UPDATE_JSON_URL=https://download.xxx.com/update.json
STORAGE_DRIVER=r2          # r2 | cos | oss
STORAGE_ACCESS_KEY=...
STORAGE_SECRET=...
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
```

### 目录结构

```
download/
  windows/AI-Commerce-Setup.exe
  mac/AI-Commerce.dmg
  update/update.json
```

### 本地构建

```bash
npm run desktop:icons          # 生成 Tauri 图标
npm run desktop:configure      # 注入 updater endpoint
npm run build:desktop:win      # Windows（需 Rust + VS Build Tools）
npm run build:desktop:mac      # macOS Universal（需 macOS）
npm run release:desktop        # 收集产物 + 生成 update.json
```

官网下载页：`http://localhost:5173/download`  
下载中心：`https://download.xxx.com`  
自动更新：`https://download.xxx.com/update.json`

### 发布流程

```
git tag v1.0.0
  → GitHub Actions (.github/workflows/release.yml)
  → pnpm install → pnpm build → tauri build
  → 生成 EXE + DMG
  → 上传 download.xxx.com
  → 更新 update.json
  → 客户端自动升级
```

### CDN

| 驱动 | 配置 |
|------|------|
| Cloudflare R2 | `STORAGE_DRIVER=r2` + `STORAGE_*` |
| 腾讯 COS | `STORAGE_DRIVER=cos` + `STORAGE_*` |
| 阿里 OSS | `STORAGE_DRIVER=oss` + `STORAGE_*` |

详见 [docs/SPRINT-22-RELEASE.md](./docs/SPRINT-22-RELEASE.md)。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/SPRINT-22-RELEASE.md](./docs/SPRINT-22-RELEASE.md) | **桌面发布与 CI/CD** |
| [docs/SPRINT-21-DISTRIBUTION.md](./docs/SPRINT-21-DISTRIBUTION.md) | 桌面分发基础设施 |
| [docs/SPRINT-18-RC.md](./docs/SPRINT-18-RC.md) | 内测 RC 指南 |
| [docs/SPRINT-17-ARCHITECTURE.md](./docs/SPRINT-17-ARCHITECTURE.md) | 架构收敛 |
| [docs/PHASE-14-PRODUCTION.md](./docs/PHASE-14-PRODUCTION.md) | Docker / PM2 / 队列 |

## Packages

`packages/auth` · `packages/beta` · `packages/database` · `packages/analytics` · `packages/queue` · `packages/ops` · …
