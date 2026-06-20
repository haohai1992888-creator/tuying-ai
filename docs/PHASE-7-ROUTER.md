# Phase 7 — Model Router（智能路由）

## 目标

- 自动选择模型（任务类型 + 用户等级 + 成本）
- 失败降级（GPT → Seedream → Gemini）
- 模型调用统计与成本记录

## 架构（Express 课程 · `apps/api`）

```
用户提交任务 → Workflow → ModelRouter → Provider → 生成
                              ↓ 失败
                          Fallback 链
                              ↓
                        ModelUsage 记录
```

## 模型配置

`apps/api/src/config/models.ts`

| 模型 | cost | quality | speed |
|------|------|---------|-------|
| GPT | 10 | 10 | 7 |
| Seedream | 4 | 8 | 9 |
| Gemini | 2 | 6 | 10 |

## 路由规则

| 用户 | 策略 |
|------|------|
| FREE | 优先 Gemini（成本） |
| VIP | 优先 GPT |
| 场景图 | Seedream / VIP→GPT |
| 详情页 | GPT |
| 批量 | Gemini |

复用 `@acs/router` 的 `RuleBasedRouter` + `FailoverStrategy`。

## 用户等级

Monorepo 使用 `User.plan`（FREE / VIP / ENTERPRISE）映射 `UserLevel`，无需单独 migration。

## API

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/task/create | `model: "auto"` 由 Router 选择 |
| POST | /api/task/run/:id | 执行 + Fallback |
| GET | /api/analytics/models | 模型统计 |

### 统计响应示例

```json
[
  {
    "model": "gpt",
    "label": "GPT Image 2",
    "calls": 500,
    "cost": 5000,
    "successRate": 97
  }
]
```

## 数据库

使用已有 `model_usage` 表（等价于课程 `ModelLog`）。

## Desktop

- `ModelSelect` 新增 **自动路由**
- 默认 `model: "auto"`

## 验收

1. 免费用户 + `auto` → 路由到 Gemini
2. VIP 用户 + `auto` → 路由到 GPT
3. GPT 失败 → 自动 Seedream → Gemini
4. `GET /api/analytics/models` 有统计数据

## 扩展新 Provider

1. `providers/xxx/provider.ts`
2. `providerFactory.ts` 注册
3. `config/models.ts` 添加评分
4. `fallback.ts` 加入降级链

Workflow 与 Router 核心无需修改。
