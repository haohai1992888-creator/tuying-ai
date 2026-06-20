# Phase 12 — AI 详情页系统

## 目标

- AI 卖点 / 文案生成
- 详情页模块 + 五图 + 长图
- HTML / PSD 结构导出
- 详情页 Workflow

## 数据模型

复用 monorepo 已有模型（非课程简化 `DetailPage`）：

| 课程概念 | 实际模型 |
|---------|---------|
| DetailPage | `DetailTask` + `DetailBlock` |
| content JSON | `sellingPoints` + blocks |
| cover | `resultUrl` / 首模块图 |

## 积分

| 功能 | 积分 |
|------|------|
| 卖点生成 | 5 |
| 五图生成 | 20 |
| 完整 AI 详情页 | 50 |

## API（Express `:3001`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/detail/categories` | 分类 |
| GET | `/api/detail/templates` | 模板（DB + JSON） |
| POST | `/api/detail/extract-selling-points` | AI 卖点（5 积分） |
| POST | `/api/detail/generate` | 完整详情页（50 积分） |
| POST | `/api/detail/generate-five` | 五图（20 积分） |
| GET | `/api/detail/:id` | 任务详情 + modules |
| POST | `/api/detail/:id/blocks/:blockId/regenerate` | 重生成模块 |
| GET | `/api/detail/:id/export/html` | 导出 HTML |
| GET | `/api/detail/:id/export/psd` | PSD 图层结构 JSON |

## 模块结构

```json
[
  { "type": "hero", "title": "首屏海报" },
  { "type": "selling", "title": "产品卖点" },
  { "type": "scene", "title": "真实使用场景" }
]
```

JSON 模板：`apps/api/src/config/detail-templates/`（modern / minimal / luxury / food）

## Workflow

```
商品图 → 卖点分析 → 生成模块图 → 长图拼接 → 导出
```

实现：`packages/detail/src/detail-workflow.ts`

## 验收

```bash
npm run dev:api
npm run dev:desktop
```

1. 输入产品名称 → AI 生成卖点
2. 上传商品图 → 选择模板 → 生成
3. 模块进度 + 长图预览
4. 导出 HTML / PSD 结构 / 长图 PNG

## 后续

PSD 实文件、Figma 导出、视频详情页、A/B 测试
