# Phase 11 — Auto Update（自动更新系统）

## 架构

```
Desktop Client
      ↓
Version Service (@acs/update)
      ↓
GET /api/version/latest
      ↓
Release Files (OSS/CDN URL)
```

## 数据表

- `AppVersion` — 版本、下载地址、强制更新、渠道 (stable/beta)
- `ReleaseNote` — 更新日志
- `DownloadLog` — 下载统计

## 版本规则 (Semver)

| 变更类型 | 递增 |
|----------|------|
| Bug 修复 | +0.0.1 (patch) |
| 新功能 | +0.1.0 (minor) |
| 重大升级 | +1.0.0 (major) |

工具：`compareVersions` / `bumpVersion`（`@acs/shared`）

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/version/latest | 检查最新版本 |
| POST | /api/version/download-log | 记录下载 |
| GET | /api/admin/versions | 版本列表 |
| POST | /api/admin/versions | 创建版本 |
| POST | /api/admin/versions/[id]/publish | 发布版本 |
| GET | /api/admin/versions/stats | 下载/升级统计 |

### GET /api/version/latest 参数

- `currentVersion` — 客户端当前版本
- `channel` — `STABLE` | `BETA`
- `platform` — `WINDOWS` | `MACOS` | `LINUX`

## Desktop

- `UpdateService` — 检查 / 下载 / 安装（浏览器环境触发安装包下载）
- `UpdateChecker` — 启动时自动检测
- `UpdateDialog` — 立即更新 / 稍后提醒
- `forceUpdate=true` — 阻断进入系统
- 设置页 — 正式版 / 测试版渠道切换

## Admin

路径：`/versions`

- 新增版本、上传安装包 URL、强制更新、发布
- 统计：下载量、活跃版本、升级率

## 迁移

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration: `20260803000000_phase_11_auto_update`

## 平台支持

- Windows / macOS — 独立 `downloadUrlWin` / `downloadUrlMac`
- Linux — 预留 `ClientPlatform.LINUX`
