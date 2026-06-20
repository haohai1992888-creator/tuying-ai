# Phase 6 — Seedream + Gemini 多模型接入

## 目标

- GPT / Seedream / Gemini 统一 Provider 接口
- Factory 模式切换模型
- Task 记录所选模型
- Workflow 按模型参数执行

## Provider 架构（Express 课程 · `apps/api`）

```
用户选择 model → Task 保存 → Workflow → getProvider(model) → 生成 → OSS → 返回 URL
```

| Provider | 环境变量 | 未配置时 |
|----------|----------|----------|
| GPT | `OPENAI_API_KEY` | 报错 |
| Seedream | `SEEDREAM_API_KEY` | Mock URL |
| Gemini | `GEMINI_API_KEY` | Mock URL |

## API

| Method | Path | Body |
|--------|------|------|
| POST | /api/task/create | `{ type, prompt, model?, inputUrl? }` |
| POST | /api/task/run/:id | — |
| GET | /api/task/:id | — |

`model` 可选值：`gpt` | `seedream` | `gemini`（默认 `gpt`）

## 共享包

Monorepo 完整多模型能力：

- `packages/ai-providers` — GPT / Seedream / Gemini Provider
- `packages/router` — Model Router + Failover

## Desktop

- `components/ModelSelect.tsx` — 模型下拉
- `/generate` — 选择模型 + Prompt + 创建执行

## 扩展新模型

1. 实现 `AIProvider`（`apps/api/src/providers/types.ts`）
2. 在 `providerFactory.ts` 注册
3. Workflow 无需修改

## 验收

1. 配置对应 API Key
2. `npm run dev:api` + Desktop `/generate`
3. 分别选择 GPT / Seedream / Gemini 生成
4. Task 响应含 `model` 字段，状态 `SUCCESS`
