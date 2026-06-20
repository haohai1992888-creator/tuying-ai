# Phase 10 — 模板市场（Template Marketplace）

## 目标

- 模板分类、列表、详情
- Prompt / Workflow 模板
- 收藏、热门、使用统计
- 一键生成（上传商品图 → 自动 Prompt → Workflow）

## 数据模型

复用 monorepo 已有 Prisma 模型（非课程简化版）：

- `Template` + `PromptTemplate` — 模板与 Prompt
- `FavoriteTemplate` — 收藏
- `TemplateUsage` / `RecentTemplate` — 使用统计

运行 seed 写入 **50 个**市场模板：

```bash
npm run db:seed
```

## API（Express `:3001`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/template/categories` | 分类列表 |
| GET | `/api/template/list` | 模板列表（同 `/api/templates`） |
| GET | `/api/template/hot` | 热门 Top 10 |
| GET | `/api/template/recent` | 最近使用 |
| GET | `/api/template/:id` | 模板详情 |
| POST | `/api/template/favorite` | 收藏 `{ templateId }` |
| POST | `/api/template/generate` | 生成 `{ templateId, inputUrl, variables }` |
| POST | `/api/templates/:id/favorite` | 收藏（别名） |
| DELETE | `/api/templates/:id/favorite` | 取消收藏 |
| POST | `/api/templates/:id/generate` | 一键生成并执行 Workflow |

响应字段映射课程命名：`title`/`cover`/`points`/`model`/`favoriteCount`。

## 分类

厨房场景、家居场景、服饰模特、食品摄影、详情页、海报、短视频（及存量分类）。

## 扣费

模板 `points` 由关联模型推导（gpt 10 / seedream 5 / gemini 2），与 Phase 9 积分系统联动。

## 后台管理

`apps/admin` 已有模板管理（新增 / 编辑 Prompt / 启用 / VIP / 数据统计）。

## 验收

1. `npm run dev:api` + `npm run dev:desktop`
2. 模板市场 — 热门、分类筛选、搜索
3. 详情页 — 封面、模型、积分、次数、收藏
4. 收藏 / 取消收藏
5. 上传商品图 → 立即生成 → 扣积分 → usageCount +1

## 一键生成流程

```
选择模板 → 上传商品图 → 渲染 Prompt → 创建 Task → Workflow → AI 生成
```
