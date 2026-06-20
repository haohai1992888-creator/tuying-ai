# Sprint 21 — 桌面客户端发布系统

## 构建目标

| 平台 | 输出 | Tauri 配置 |
|------|------|------------|
| Windows x64 | `AI-Commerce-Setup.exe` | NSIS |
| macOS Universal | `AI-Commerce.dmg` | `--target universal-apple-darwin` |

配置文件：`apps/desktop/src-tauri/tauri.conf.json`

## download/ 目录

```
download/
  windows/AI-Commerce-Setup.exe
  mac/AI-Commerce.dmg
  update/update.json
  update/update.json.example
```

API 静态托管：`GET /download/*`  
更新清单：`GET /update.json`（别名 `/download/update/update.json`）

## 官网下载页

路由：`/download`（`apps/desktop/src/pages/DownloadPage.tsx`）

- 下载 Windows / macOS 按钮
- 当前版本号、文件大小
- 更新日志（`ReleaseNotes` 组件）
- 浏览器自动识别系统并高亮对应按钮

## 自动更新

客户端启动时请求 `update.json`（默认 `http://localhost:3001/update.json`）。

环境变量：

- `VITE_UPDATE_JSON_URL` — 前端更新检查地址
- Tauri updater endpoint — `tauri.conf.json` → `plugins.updater.endpoints`

发现新版本后弹窗升级（Tauri 原生 updater + 浏览器回退下载）。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run desktop:icons` | 生成 `src-tauri/icons/` |
| `npm run build:desktop:win` | Windows NSIS 构建 |
| `npm run build:desktop:mac` | macOS Universal DMG |
| `npm run release:desktop` | 收集产物 + 生成 `update.json` |
| `npm run release:desktop -- --version 1.0.1 --cdn` | 上传 CDN（需配置 storage） |

## CI

`.github/workflows/release-desktop.yml`

触发：`desktop-v*` / `v*` tag 或手动 dispatch。

## 发布 Checklist

1. 更新 `apps/desktop/package.json` 版本
2. `git tag v1.0.0 && git push origin v1.0.0`
3. CI 构建 EXE + DMG
4. 合并到 `download/` 并更新 `update.json`
5. 上传 R2 / COS / OSS
6. 用户从官网下载或客户端自动升级
