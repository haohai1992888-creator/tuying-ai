# Phase 2 — 用户系统与基础业务

## 目标

完成用户体系、JWT 认证、权限、积分、任务与 Admin 后台。**不接 AI 模型**。

## 数据库结构

### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | cuid |
| email | String? | 唯一 |
| phone | String? | 唯一 |
| password | String | BCrypt |
| avatar | String? | |
| nickname | String? | |
| role | UserRole | USER / VIP / ADMIN |
| points | Int | 默认 100 |
| vipExpireAt | DateTime? | |
| status | UserStatus | ACTIVE / DISABLED / BANNED |

### PointLog
| 字段 | 类型 |
|------|------|
| id, userId, type, amount, balance, remark, createdAt |

`PointType`: RECHARGE / CONSUME / REFUND / GIFT

### Task
| 字段 | 类型 |
|------|------|
| id, userId, taskType, status, cost, inputUrl, outputUrl, modelName, createdAt |

`TaskStatus`: PENDING / PROCESSING / **SUCCESS** / FAILED

Phase 2 创建任务后直接进入 **SUCCESS**。

### RefreshToken / PasswordResetToken
支持 JWT + Refresh Token 与忘记密码。

## API 清单

### Web — 认证
| Method | Path | 说明 |
|--------|------|------|
| POST | /api/auth/register | 注册（赠 100 积分） |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 退出 |
| POST | /api/auth/refresh | 刷新 Token |
| POST | /api/auth/change-password | 修改密码（需登录） |
| POST | /api/auth/forgot-password | 忘记密码 |
| POST | /api/auth/reset-password | 重置密码 |

### Web — 用户中心
| Method | Path | 说明 |
|--------|------|------|
| GET | /api/user/profile | 个人资料 |
| PUT | /api/user/profile | 更新昵称/头像 |
| GET | /api/user/points | 积分余额 |
| GET | /api/user/tasks | 我的任务 |

### Web — 积分
| Method | Path | 说明 |
|--------|------|------|
| GET | /api/points | 余额 |
| GET | /api/points/logs | 流水 |

### Web — 任务
| Method | Path | 说明 |
|--------|------|------|
| POST | /api/tasks/create | 创建任务（直接 SUCCESS） |
| GET | /api/tasks | 任务列表 |
| GET | /api/tasks/:id | 任务详情 |

### Admin — 需 ADMIN 角色
| Method | Path | 说明 |
|--------|------|------|
| POST | /api/auth/login | 管理员登录 |
| GET | /api/admin/stats | 仪表盘统计 |
| GET | /api/admin/users | 用户列表 |
| GET/PATCH | /api/admin/users/:id | 查看/封禁/调积分/VIP |
| GET | /api/admin/tasks | 全部任务 |
| GET | /api/admin/points/logs | 积分流水 |

## 权限系统

- `authGuard` — 校验 Bearer JWT
- `roleGuard(ctx, [UserRole.ADMIN])` — 角色校验

## Redis 缓存（内存实现，TTL 30 分钟）

- 用户信息 `acs:user:{id}`
- 积分余额 `acs:points:{userId}`
- Token `acs:token:{userId}`

## 种子数据

```bash
npm run db:seed
```

- 管理员：`admin@acs.local` / `admin123`

## 本地启动

```bash
npm install
npm run db:generate
# 配置 .env DATABASE_URL / JWT_SECRET 等
npm run dev:web      # :3000
npm run dev:admin    # :3001
npm run dev:desktop  # :5173
```

## 项目树（Phase 2 新增）

```
packages/
  auth/           JWT + BCrypt + Guards
  points/         PointService
  tasks/          TaskService
  admin/          AdminService
apps/
  web/            业务 API + 用户页面
  admin/          管理 API + Admin UI
  desktop/        Vite + React 客户端
```

## 核心代码

- `packages/auth/src/auth.service.ts` — 注册/登录/Token
- `packages/auth/src/guards.ts` — AuthGuard / RoleGuard
- `packages/points/src/point.service.ts` — 积分增减与流水
- `packages/tasks/src/task.service.ts` — 任务创建（直接 SUCCESS）
- `packages/admin/src/admin.service.ts` — 后台用户管理

## 禁止项（本阶段）

- 不接 GPT / Seedream / Gemini
- 不开发图片生成与工作流节点
- 不接 OSS（Phase 3）

## Phase 2 验证（Express 课程 API · `apps/api`）

课程清单中的 JWT 注册/登录已落地为 `apps/api`，复用 `@acs/auth`（BCrypt + JWT），数据库仍用 `@acs/database`。

| 步骤 | 命令 / 地址 |
|------|-------------|
| 启动数据库 | `npm run docker:up` |
| 迁移 | `npm run db:migrate` |
| 启动 API | `npm run dev:api` |
| 注册 | `POST http://localhost:3001/api/register` `{ "email", "password" }` |
| 登录 | `POST http://localhost:3001/api/login` → `{ "token", "user" }` |
| 当前用户 | `GET http://localhost:3001/api/me` + `Authorization: Bearer <token>` |

说明：User 表字段为 `points`（默认 100），API 响应中映射为 `balance` 以匹配课程文档。

Desktop 客户端 Token 保存在 `localStorage.token`（`apps/desktop/src/store/auth.ts`），请求时自动附加 `Authorization: Bearer`。

### 完成标志

- 注册成功
- 登录成功并获取 Token
- `GET /api/me` 成功
- 未登录访问 `/api/me` 返回 401

## 下一阶段

**Phase 3**: OSS 上传 + 图片管理 + 文件服务
