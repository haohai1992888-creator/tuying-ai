# Phase 12 — Template Marketplace（模板市场）

## 架构

```
Template → Workflow → Prompt（变量渲染）→ Router → Provider
```

用户：选择模板 → 上传商品 → 一键生成（无需写 Prompt）

## 数据表

| 表 | 说明 |
|----|------|
| `PromptTemplate` | Prompt 内容与变量定义 |
| `Template` | 模板元数据、workflowId、权限 |
| `FavoriteTemplate` | 用户收藏 |
| `RecentTemplate` | 最近使用 |
| `TemplateUsage` | 使用统计 |

## 分类

厨房用品、家居用品、美妆护肤、服装鞋包、宠物用品、母婴用品、节日营销

## 变量系统

支持 `{{product}}` `{{style}}` `{{scene}}` `{{color}}` `{{festival}}`

## 权限

| 等级 | 可用模板 |
|------|----------|
| 免费版 | 基础模板（isVip=false） |
| VIP | 基础 + 高级 |
| 企业版 | 全部 |

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/templates | 列表（分类/搜索/收藏） |
| GET | /api/templates/categories | 分类 |
| GET | /api/templates/hot | 热门 |
| GET | /api/templates/recent | 最近使用 |
| GET | /api/templates/[id] | 详情 |
| POST | /api/templates/[id]/generate | 一键生成 |
| POST/DELETE | /api/templates/[id]/favorite | 收藏/取消 |
| Admin | /api/admin/templates/* | 管理 + 统计 |

## Desktop

路径：`/templates` — 模板中心（分类、搜索、收藏、热门、一键生成）

## Admin

路径：`/templates` — 新增/上下架/VIP/热门统计

## 迁移

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration: `20260804000000_phase_12_templates`
