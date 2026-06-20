# Phase 1 · 项目初始化与基础架构

> **目标**：完整 Monorepo 架构 + 骨架代码，**禁止** AI 功能、业务页面、真实 API 接入。

## 交付清单

| # | 交付项 | 状态 |
|---|--------|------|
| 1 | Turborepo Monorepo | ✅ |
| 2 | 完整目录结构 | ✅ |
| 3 | TypeScript 接口定义 | ✅ `@acs/shared` |
| 4 | Prisma 数据库 | ✅ `@acs/database` |
| 5 | Workflow Engine 骨架 | ✅ `@acs/workflow` |
| 6 | Model Router 骨架 | ✅ `@acs/router` |
| 7 | AI Provider Mock | ✅ `@acs/ai-providers` |
| 8 | Auth / Payment / Storage 骨架 | ✅ |
| 9 | Redis Cache + Queue 骨架 | ✅ `@acs/shared/redis` |
| 10 | Docker 开发环境 | ✅ `infra/docker` |

## 完整项目树

```
ai-commerce-studio/
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .env.example
├── README.md
│
├── apps/
│   ├── desktop/                    # Tauri 桌面客户端（Phase 1 目录骨架）
│   │   ├── README.md
│   │   ├── package.json
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── services/api.ts
│   │       ├── store/auth.ts
│   │       ├── types/index.ts
│   │       └── routes/index.ts
│   │
│   ├── web/                        # 官网 + Business API
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # 占位，非业务页
│   │   │   └── api/health/route.ts
│   │   ├── components/
│   │   ├── lib/http.ts
│   │   ├── services/
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── admin/                      # 管理后台
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── api/health/route.ts
│       ├── components/
│       ├── lib/
│       ├── services/
│       ├── middleware.ts
│       └── package.json
│
├── packages/
│   ├── ui/                         # 公共 UI（Shadcn 占位）
│   ├── database/                   # Prisma + PostgreSQL
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── src/index.ts
│   ├── workflow/                   # 工作流引擎
│   │   ├── workflows/*.json
│   │   └── src/{types,engine,index}.ts
│   ├── router/                     # Model Router
│   ├── ai-providers/               # GPT / Seedream / Gemini Mock
│   ├── auth/                       # JWT + Refresh + 角色
│   ├── payment/                    # 微信 / 支付宝 Mock
│   ├── storage/                    # OSS / R2 Mock
│   └── shared/                     # constants · enums · types · utils · redis
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml      # Postgres · Redis · Web · Admin · Nginx
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.admin
│   └── nginx/nginx.conf
│
└── docs/
    ├── PRD-V1.md
    ├── ARCHITECTURE.md
    ├── SPRINTS.md
    └── PHASE-1.md                  # 本文档
```

## 包依赖关系

```
apps/web ──► @acs/shared, @acs/database, @acs/workflow, @acs/router,
             @acs/auth, @acs/payment, @acs/storage, @acs/ui

apps/admin ──► @acs/shared, @acs/database, @acs/auth, @acs/ui

apps/desktop ──► @acs/shared

packages/workflow ──► @acs/shared
packages/router ──► @acs/shared
packages/ai-providers ──► @acs/shared
packages/auth ──► @acs/shared
packages/payment ──► @acs/shared
packages/storage ──► @acs/shared
```

## 数据库表（Phase 1）

| 表 | 说明 |
|----|------|
| `users` | email, phone, password, avatar, points, role, vip_expire_time |
| `refresh_tokens` | JWT Refresh Token |
| `tasks` | task_type, model_name, input/output_url, cost, status |
| `point_logs` | change_type, points, remark |
| `orders` | amount, status, payment_method |

## 禁止项（本阶段）

- ❌ 接入 GPT / Seedream / Gemini 真实 API
- ❌ 开发业务页面（首页营销、支付页、Admin 面板等）
- ❌ 工作流业务节点实现
- ❌ 真实微信支付 / 支付宝

## 本地命令

```bash
npm install
npm run db:generate
npm run db:migrate
npm run docker:up        # Postgres + Redis
npm run dev:api          # Phase 1 Express API :3001
npm run dev:web          # :3000
npm run dev:admin        # :3001（与 dev:api 勿同时占用同端口）
```

## Phase 1 验证（Express 最小 API）

课程清单中的 Express + Prisma 验证已落地为 `apps/api`（复用 `@acs/database`，无需单独 `prisma/` 目录）。

| 步骤 | 命令 / 地址 |
|------|-------------|
| 启动数据库 | `npm run docker:up` |
| 迁移 | `npm run db:migrate` |
| 启动 API | `npm run dev:api` |
| 健康检查 | `GET http://localhost:3001/` → `{ "message": "AI Commerce Studio API Running" }` |
| 写库测试 | `GET http://localhost:3001/test` → `{ "message": "User created in DB", ... }` |

### 完成标志

- Express 启动成功
- Prisma 连接成功（`@acs/database`）
- PostgreSQL 写入成功（`/test`）
- API 可访问

## 下一阶段

**Sprint 1** — 用户注册/登录 + 真实 JWT + `GET /api/user/profile`
