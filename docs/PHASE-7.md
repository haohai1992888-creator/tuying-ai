# Phase 7 — Seedream Provider

## 架构

```
Desktop → POST /api/tasks/create (poster | model_image)
  → poster-workflow / model-workflow
      → OCR / 卖点提取 (poster)
      → PromptBuilder (Poster / Model templates)
      → Router → GenerateNode (SeedreamProvider)
      → SaveFileNode → DeductPointsNode → Output
```

**禁止**前端直接调用 Seedream，统一走 Workflow → GenerateNode → SeedreamProvider → SeedreamClient。

## Seedream Provider

位置：`packages/ai-providers/src/seedream/`

| 文件 | 职责 |
|------|------|
| SeedreamClient.ts | ModelArk HTTP 封装、重试 3 次、日志 |
| SeedreamMapper.ts | 请求/响应映射、多参考图 |
| SeedreamTypes.ts | 类型定义 |
| SeedreamProvider.ts | 实现 AIProvider |

环境变量：

- `SEEDREAM_API_KEY` — 必填（真实生成；未配置时 Mock）
- `SEEDREAM_BASE_URL` — 默认 BytePlus ModelArk
- `SEEDREAM_MODEL` — 模型 endpoint ID

## 工作流

### poster-workflow

`input → ocr → analysis → prompt → router → generate → save → points → output`

### model-workflow

`input → prompt → router → generate → save → points → output`

## Prompt 模板

### 海报 (`prompt_templates/poster`)

618促销、新品上市、限时折扣、买一送一、品牌宣传

变量：`{category}` `{sellingPoints}` `{style}`

### 模特 (`prompt_templates/model`)

女装、男装、童装、鞋包、饰品

变量：`{category}` `{style}`

## 积分规则

| 任务 | 积分 |
|------|------|
| poster | 10 |
| model_image | 8 |

## Desktop

| 页面 | 路径 |
|------|------|
| AI 海报 | /poster |
| AI 模特图 | /model-image |

## Admin 统计

仪表盘展示：

- GPT / Seedream 调用次数
- 各模型消耗积分
- 失败率、平均耗时

## 验收流程

**海报：**

1. 上传商品图 → 选择 618 模板 → 输入卖点 → 生成
2. Seedream 生成 → OSS 保存 → 扣 10 积分

**模特图：**

1. 上传商品图 + 参考图 → 选择女装风格 → 生成
2. Seedream 生成 → OSS 保存 → 扣 8 积分

## API 创建任务

```json
POST /api/tasks/create
{
  "taskType": "poster",
  "inputUrl": "https://...",
  "category": "保温杯",
  "templateKey": "618",
  "sellingPoints": "保温24小时,限时特惠"
}
```

```json
POST /api/tasks/create
{
  "taskType": "model_image",
  "inputUrl": "https://...",
  "modelReferenceUrl": "https://...",
  "category": "连衣裙",
  "modelTemplateKey": "womenswear"
}
```
