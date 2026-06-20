# Phase 13 — AI Detail Page Engine（详情页引擎）

## 架构

```
商品图 → OCR/卖点提取 → DetailWorkflow → 多模块生成 → DetailComposer 长图拼接 → OSS
```

## 详情页模块（DetailBlock）

| 类型 | 说明 | Provider |
|------|------|----------|
| BANNER | 主视觉 Banner | Seedream |
| FEATURE | 卖点展示 | Seedream |
| SCENE | 场景图 | GPT |
| SIZE | 尺寸标注 | GPT |
| PARAMETER | 参数表 | GPT |
| DETAIL | 细节特写 | Seedream |
| BRAND | 品牌故事 | Seedream |
| REASON | 购买理由 | Seedream |

## 数据表

| 表 | 说明 |
|----|------|
| `DetailTemplate` | 详情页模板（分类 + 模块组合） |
| `DetailTask` | 详情页生成任务 |
| `DetailBlock` | 单个模块及生成结果 |

## 平台宽度

| 平台 | 宽度 |
|------|------|
| 淘宝 | 790px |
| 拼多多/抖店/小红书 | 750px |
| Ozon | 800px |
| Amazon | 970px |

## 积分

详情页生成：**20 积分**（`TaskType.DETAIL_PAGE`）

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/detail/categories | 模板分类 |
| GET | /api/detail/templates | 详情页模板列表 |
| POST | /api/detail/extract-selling-points | AI 卖点提取 |
| POST | /api/detail/generate | 开始生成详情页 |
| GET | /api/detail/[id] | 任务状态 + 模块预览 |
| POST | /api/detail/[id]/blocks/[blockId]/regenerate | 重新生成单模块 |

## Desktop

路径：`/detail-page` — 上传商品、填写卖点、选择模板、模块预览、重新生成、导出长图

## 核心包 `@acs/detail`

- `DetailWorkflow` — 完整生成流水线
- `DetailComposer` — 790px 宽长图拼接
- `extractSellingPoints` — AI 卖点提取
- `generateDetailBlock` — 单模块生成

## 迁移

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration: `20260805000000_phase_13_detail`

## 验收流程

1. 上传商品图
2. 输入产品名称（如「厨房刀架」）
3. 点击「AI 提取卖点」或手动填写
4. 选择模板与平台
5. 点击「开始生成」
6. 查看模块预览 → 导出长图
