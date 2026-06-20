# Phase 8 — Intelligent Model Router

## 架构

```
Workflow → RouterNode → RuleBasedRouter → GenerateNode → Provider → Result
                              ↓
                    CostPolicy / UserLevel / ModelScore
                              ↓
                    FailoverStrategy (GenerateNode)
                              ↓
                    ModelUsage 监控记录
```

业务代码**无需修改**即可扩展新 Provider（注册到 `@acs/ai-providers` + `MODEL_SCORES` + `FAILOVER_CHAINS`）。

## RuleBasedRouter

位置：`packages/router/src/RuleBasedRouter.ts`

### 任务规则（第一版）

| 任务 | Provider |
|------|----------|
| 场景图 | GPT Image 2 |
| 中文海报 | Seedream |
| 模特图 | Seedream |
| 白底图 | Gemini Flash Image |
| 批量生成 | Gemini |

### 用户等级策略

| 等级 | 策略 |
|------|------|
| 普通用户 | 成本优先（Gemini 加权） |
| VIP | GPT 优先 |
| 企业版/Admin | 质量最高优先 |

### CostPolicy

积分/余额不足时自动降级：`GPT → Seedream → Gemini`

### FailoverStrategy

- GPT 失败 → Seedream → Gemini
- Seedream 失败 → Gemini → GPT
- Gemini 失败 → Seedream → GPT

## ModelScore

```typescript
GPT:      { quality: 10, speed: 7, cost: 5 }
Seedream: { quality: 9,  speed: 8, cost: 6 }
Gemini:   { quality: 7,  speed: 9, cost: 9 }
```

## ModelUsage

表 `model_usage` 记录每次 Generate 调用：provider、taskType、success、duration、cost。

## API

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/tasks/create | 支持 `preferredProvider`: auto \| gpt \| seedream \| gemini |
| GET | /api/admin/model-usage | Admin 模型监控统计 |

## Desktop 高级设置

路径：`/settings`

- 默认：自动选择（RuleBasedRouter）
- 高级用户可指定 GPT / Seedream / Gemini

## Admin

路径：`/model-monitor`

展示 GPT、Seedream、Gemini 调用次数、成功率、平均耗时、积分消耗。

## 未来扩展

`FUTURE_PROVIDERS`: flux, ideogram, midjourney, claude-image

扩展步骤：

1. 实现 `XxxProvider implements AIProvider`
2. 注册到 `getAIProvider` registry
3. 更新 `MODEL_SCORES` / `TASK_RULES` / `FAILOVER_CHAINS`

无需修改 Workflow 或 Desktop 业务页面。
