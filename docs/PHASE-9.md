# Phase 9 — Batch Engine（批量生成引擎）

## 架构

```
上传 ZIP / 多图 / Excel
        ↓
   BatchTask (DB)
        ↓
   BatchSplitter
        ↓
   batch-queue (Redis)
        ↓
   BatchService.processBatch
        ↓
   workflow-queue → Router → Provider → OSS
        ↓
   ProgressTracker + ResultPackager → result.zip
```

所有批量任务统一经 **Batch Engine** 调度，前端不直连 AI Provider。

## 数据表

- `BatchTask` — 批量主任务（total/success/failed/status/resultZipUrl/paused）
- `BatchItem` — 子项（inputUrl/outputUrl/status/error/itemIndex）
- `Task.batchTaskId` / `Task.batchItemId` — 关联单条 workflow 任务

### BatchStatus

`PENDING` | `PROCESSING` | `SUCCESS` | `PARTIAL_SUCCESS` | `FAILED` | `PAUSED` | `CANCELLED`

## 队列

| 队列 | 用途 |
|------|------|
| `batch-queue` | 批量调度 |
| `image-generate-queue` | 子任务生成占位 |
| `image-save-queue` | 保存占位（扩展） |
| `workflow-queue` | 实际 AI 工作流 |

## 核心模块 (`packages/batch`)

| 模块 | 职责 |
|------|------|
| `BatchSplitter` | ZIP 解压、CSV/JSON 解析、URL 列表拆分 |
| `ConcurrencyManager` | 并发：普通 3 / VIP 10 / Admin 30 |
| `ProgressTracker` | `{ total, success, failed, processing, etaSeconds }` |
| `ResultPackager` | 成功结果打包 ZIP → OSS |
| `BatchRecoveryService` | 暂停 / 继续 / 取消 / 重试失败 |
| `BatchService` | 创建、调度、完成回调 |

## 批量类型

| 类型 | Workflow | 积分/张 |
|------|----------|---------|
| batch_scene_image | scene_image | 5 |
| batch_white_background | white_background | 2 |
| batch_poster | poster | 10 |
| batch_model_image | model_image | 8 |

**扣费规则**：Workflow `deduct_points` 节点仅在成功时扣费，失败不扣。

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/batch | 用户批量任务列表 |
| POST | /api/batch | 创建批量任务 |
| GET | /api/batch/[id] | 详情 + 进度 |
| POST | /api/batch/upload | ZIP / 多图 / spreadsheet 上传 |
| POST | /api/batch/[id]/pause | 暂停 |
| POST | /api/batch/[id]/resume | 继续 |
| POST | /api/batch/[id]/cancel | 取消 |
| POST | /api/batch/[id]/retry-failed | 重试失败项 |
| GET | /api/admin/batch-tasks | Admin 批量监控 |

## Desktop — 批量生成中心

路径：`/batch`

- 拖拽 / 多选 / ZIP / Excel 导入
- 进度条、成功/失败数、预计剩余时间
- 暂停、继续、重试、下载 result.zip

## Admin — Batch Monitor

路径：`/batch-monitor`

展示用户、任务量、耗时、成功率。

## 迁移

```bash
npm run db:generate
npm run db:migrate
```

Migration: `20260801000000_phase_9_batch`

## 扩展预留

未来可接入：批量视频、批量详情页、批量内容生成 — 仅需新增 `BATCH_*` TaskType 与 `BATCH_WORKFLOW_MAP` 映射。
