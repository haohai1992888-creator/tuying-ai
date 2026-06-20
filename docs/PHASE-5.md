# Phase 5 — GPT Image 2 Provider

## 架构

```
Desktop/Web API
  → TaskService.createTask
  → workflow-queue
  → scene-image-workflow
      Input → PromptBuilder (ScenePromptBuilder)
      → Router → GenerateNode (GPTProvider)
      → SaveFileNode (OSS + 400/800 缩略图)
      → DeductPointsNode (5 积分)
      → OutputNode
```

**禁止**前端或业务代码直接调用 OpenAI SDK。所有 AI 调用必须经过：

`Workflow → GenerateNode → GPTProvider → GPTClient`

## GPT Provider

位置：`packages/ai-providers/src/gpt/`

| 文件 | 职责 |
|------|------|
| GPTClient.ts | OpenAI SDK 封装、认证、重试 3 次、日志 |
| GPTMapper.ts | 请求/响应映射、参考图下载 |
| GPTTypes.ts | 类型定义 |
| GPTProvider.ts | 实现 AIProvider.generate/edit/batchGenerate |

环境变量：

- `OPENAI_API_KEY` — 必填（真实生成）
- `OPENAI_BASE_URL` — 可选，默认 `https://api.openai.com/v1`
- `OPENAI_IMAGE_MODEL` — 默认 `gpt-image-1`

## Prompt 模板

`packages/ai-providers/prompt_templates/`

- `scene/` — 场景图（zh/en，变量 `{category}` `{style}`）
- `poster/`、`white_bg/`、`model/` — 模板骨架

`ScenePromptBuilder` 输入示例：

```json
{ "category": "保温杯", "style": "现代办公" }
```

## 场景图工作流

`packages/workflow/workflows/scene_image_workflow.json`

- id: `scene-image-workflow`
- taskType: `scene_image`
- 节点：`input → prompt → router → generate → save → points → output`

## 积分规则

| 任务 | 积分 |
|------|------|
| scene_image | 5 |

- GenerateNode 执行前检查余额
- DeductPointsNode 在生成成功、OSS 保存后扣费
- 失败不扣积分

## OSS 结果

生成成功后保存至 `results/{userId}/`，并生成 400×400、800×800 缩略图。

## 任务状态

`PENDING → PROCESSING → SUCCESS | FAILED`

WorkflowQueueWorker 创建 WorkflowRun 时将 Task 设为 PROCESSING，完成后更新 SUCCESS/FAILED。

## API

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/files/upload | 上传商品图 |
| POST | /api/tasks/create | 创建 scene_image 任务 |
| GET | /api/tasks | 任务列表 |
| GET | /api/tasks/:id | 任务详情（含 outputUrl、workflowRun） |
| GET | /api/admin/ai-tasks | Admin AI 任务管理 |

### 创建场景图任务

```json
POST /api/tasks/create
{
  "taskType": "scene_image",
  "inputUrl": "https://...",
  "category": "保温杯",
  "style": "现代办公"
}
```

## Desktop

页面：`/scene-image`

- 上传商品图
- 选择场景（现代办公 / 温馨家居 / 户外自然）
- 生成并轮询任务状态
- 预览与下载结果

## Admin

页面：`/ai-tasks`

显示：任务 ID、用户、工作流、模型、状态、耗时、积分消耗

## 验收流程

1. 配置 `OPENAI_API_KEY`
2. Desktop 打开「商品场景图」
3. 上传商品图，选择「现代办公场景」
4. 点击生成 → 工作流执行 → GPT 生成 → OSS 保存
5. 返回结果 URL，扣 5 积分

## Mock 说明

Seedream / Gemini 仍为 Mock Provider，仅 GPT 接入真实 OpenAI Image API。

## Phase 5 验证（Express 课程 API · `apps/api`）

课程清单 GPT Image 2 流程已接入 `WorkflowEngine`：

```
Prompt → GPT Image 2 → 下载/解码 → OSS/本地存储 → 更新 Task → 返回 URL
```

| 步骤 | 说明 |
|------|------|
| 配置 | `.env` 设置 `OPENAI_API_KEY`（可选 `OPENAI_BASE_URL`） |
| 启动 | `npm run dev:api` |
| 创建+执行 | `POST /api/task/create` + `POST /api/task/run/:id` |
| Desktop | `/generate` 页面 |

### 完成标志

- 创建任务成功
- GPT 调用成功（需有效 API Key）
- 图片保存到 OSS/本地 `results/{userId}/`
- Task 状态 `SUCCESS`，`outputUrl` 为可访问 URL
