# Phase 4 — Workflow Engine

## 架构

```
Task → Workflow → Node → Router → Provider(Mock) → Result
```

业务 **禁止直接调用 AI**，必须经过 Workflow Engine。

## 核心对象

### Workflow
- id, name, description, version, nodes[]

### WorkflowNode
- 插件模式，继承 `BaseNode`
- `execute(context) => Promise<WorkflowContext>`

### WorkflowContext
- taskId, userId, input, output, variables

## 基础节点

| 节点 | 职责 |
|------|------|
| InputNode | 接收输入 |
| ImageAnalysisNode | 图片分析（Mock） |
| OCRNode | OCR 识别（Mock） |
| PromptBuilderNode | Prompt 构建/增强 |
| RouterNode | 调用 Model Router |
| GenerateNode | 调用 MockProvider（禁止真实 AI） |
| SaveFileNode | 保存结果到 Storage |
| DeductPointsNode | 扣积分 |
| OutputNode | 返回结果 |

## WorkflowExecutor

- 按顺序执行节点
- 维护 WorkflowContext
- 写入 WorkflowRun / WorkflowNodeRun
- 默认重试 3 次、超时 30s
- 支持 skipOnError

## WorkflowRegistry

- `register()` / `get()` / `list()`
- taskType → workflowId 映射（JSON 配置，无硬编码 if）

## JSON 工作流定义

```json
{
  "id": "scene-image",
  "name": "Scene Image Workflow",
  "nodes": ["input", "analysis", "ocr", "prompt", "router", "generate", "save", "points", "output"]
}
```

## 数据库

- **WorkflowRun** — workflowId, taskId, status, error, startedAt, endedAt
- **WorkflowNodeRun** — workflowRunId, nodeId, nodeType, status, error

## Redis 队列

- 队列名：`workflow-queue`
- 流程：创建任务 → 入队 → WorkflowExecutor 执行 → 更新 Task 状态

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/workflows | 工作流列表 |
| POST | /api/tasks/create | 创建任务（触发工作流） |
| GET | /api/tasks/:id | 任务详情（含 workflowRun） |
| GET | /api/admin/workflows | 管理工作流 |
| GET | /api/admin/workflow-runs | 运行记录 |
| POST | /api/admin/workflow-runs/:id/retry | 重新执行 |

## 预置工作流

- scene-image, white-background, poster
- batch-white-background, product-image, model-image

## 禁止项

- 不接 GPT Image 2 / Seedream / Gemini 真实 API
- GenerateNode 仅 MockProvider

## Phase 4 验证（Express 课程 API · `apps/api`）

课程清单中的 Task + Workflow 已落地为 `apps/api` 同步执行引擎（Phase 8 预留 Redis 队列）。

| 步骤 | 命令 / 地址 |
|------|-------------|
| 启动 API | `npm run dev:api` |
| 创建任务 | `POST /api/task/create` `{ "type": "scene", "prompt": "..." }` |
| 执行任务 | `POST /api/task/run/:id` |
| 查询任务 | `GET /api/task/:id` |

状态流转：`PENDING` → `PROCESSING` → `SUCCESS` / `FAILED`

Desktop：`apps/desktop/src/api/task.ts` + `/task` 页面（创建并同步执行）

### 完成标志

- 创建任务成功，初始状态 `PENDING`
- 执行后经过 `PROCESSING`
- 成功变为 `SUCCESS` 并写入 `outputUrl`
- 失败变为 `FAILED` 并返回 `error`

## 下一阶段

**Phase 5**: GPT Image 2 接入（通过 GenerateNode + Provider 插件）
