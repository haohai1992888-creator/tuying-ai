# Phase 8 — Batch Engine（批量生成）

## 目标

- 批量任务创建与拆分
- 并发执行 + 进度统计
- 批量结果返回

## 架构（Express 课程 · `apps/api`）

```
prompts[] → BatchTask → N × Task(batchTaskId) → BatchEngine → WorkflowEngine
                                                      ↓
                                              updateProgress
```

## 与课程文档的对应

| 课程 | 实际 |
|------|------|
| `Batch` 表 | `batch_tasks`（BatchTask） |
| `Task.batchId` | `Task.batchTaskId` |
| `total/completed/failed` | `totalCount/successCount/failedCount` |

## API

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/batch/create | `{ prompts: string[], type?, model? }` |
| GET | /api/batch/:id | 批量详情 + 子 Task |
| POST | /api/batch/run/:id | 同步并发执行 |

### 创建示例

```json
POST /api/batch/create
{
  "prompts": ["厨房场景", "客厅场景", "卧室场景"],
  "type": "scene",
  "model": "auto"
}
```

## 并发

环境变量 `BATCH_CONCURRENCY`（默认 3）控制同时执行的 Workflow 数量。

## Desktop

- `apps/desktop/src/api/batch.ts`
- `/batch-engine` 页面（课程式 Prompt 批量）

完整 SKU 批量上传仍使用 `/batch`（Web API + `@acs/batch`）。

## 验收

1. 创建 Batch 成功，生成多个 Task
2. 执行后进度更新（completed/failed）
3. 全部完成后 status 为 SUCCESS / PARTIAL_SUCCESS / FAILED
4. 子 Task 含 outputUrl

## 下一阶段

Phase 11+ 可升级为 Redis Queue + Worker 异步执行。
