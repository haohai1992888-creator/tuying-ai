# Sprint 20 — Beta 内测系统

> 支持 10~20 名内测用户 · 无新增商业功能

## 功能清单

| 模块 | 说明 |
|------|------|
| Beta 用户 | `betaUser` / `betaExpireAt` / `betaPoints` |
| 邀请码 | `InviteCode` + 使用记录，默认 `BETA2026` |
| 赠送积分 | 管理员 100 / 500 / 1000 → `PointLog` |
| 反馈 | `Feedback` 四类 + 后台回复/关闭 |
| 问题上报 | 客户端生成失败弹窗自动附带 task/model/error/prompt |
| 数据统计 | Dashboard Beta 指标 |
| 成本监控 | GPT / Seedream / Gemini + 用户成本排行 |
| 行为统计 | 页面/模板/生成/导出 Top10 |
| 系统公告 | `Announcement` 客户端首页公告栏 |
| 版本反馈 | Desktop `1.0.0-beta` + BETA 渠道更新 |
| Beta Report | 内测报告 JSON 导出 |

## Admin 面板

- `/beta-users` — Beta Users
- `/invite-codes` — Invite Codes
- `/feedback` — Feedback
- `/cost-center` — Cost Center
- `/system-health` — System Health
- `/beta-report` — Beta Report

## API

### 用户端（需登录）

- `POST /api/beta/invite/redeem`
- `POST /api/beta/feedback`
- `POST /api/beta/issue-report`
- `POST /api/beta/behavior`
- `GET /api/beta/announcements`

### 管理端

- `GET/POST/DELETE /api/admin/beta/users*`
- `GET/POST/DELETE /api/admin/beta/invite-codes*`
- `GET/POST /api/admin/beta/feedback*`
- `GET /api/admin/beta/cost-center`
- `GET /api/admin/beta/report`
- `GET /api/admin/beta/dashboard`

## 初始化

```bash
npm run db:migrate
npm run db:seed
```

邀请码 `BETA2026`（20 次，2026 年底到期）与欢迎公告会自动写入。

## 客户端

- 版本：`1.0.0-beta`
- 注册页支持邀请码
- 首页公告栏 + 页面行为埋点
- 生成失败 → 提交问题弹窗
