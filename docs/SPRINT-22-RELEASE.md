# Sprint 22 — 桌面客户端发布与 CI/CD

## 构建产物

| 平台 | Runner | 输出 |
|------|--------|------|
| Windows x64 | `windows-latest` | `AI-Commerce-Setup.exe` |
| macOS Universal | `macos-latest` | `AI-Commerce.dmg` |

本地 Windows 构建：

```bash
npm run build:desktop:win
# 需要 Rust + Visual Studio Build Tools
```

macOS Universal 必须在 macOS 上构建：

```bash
npm run build:desktop:mac
# 或 cargo tauri build --target universal-apple-darwin
```

## 环境变量

| 变量 | 示例 |
|------|------|
| `DOWNLOAD_BASE_URL` | `https://download.xxx.com` |
| `VITE_UPDATE_JSON_URL` | `https://download.xxx.com/update.json` |
| `STORAGE_DRIVER` | `r2` / `cos` / `oss` |
| `STORAGE_ACCESS_KEY` | CDN Access Key |
| `STORAGE_SECRET` | CDN Secret |

也兼容 `R2_*` / `COS_*` / `OSS_*` 分 provider 变量。

## update.json

最小格式（CDN 根路径）：

```json
{
  "version": "1.0.0",
  "notes": "首次发布"
}
```

完整格式见 `download/update/update.json.example`。

客户端启动请求 `VITE_UPDATE_JSON_URL`，发现新版本弹窗升级。

## GitHub Actions

`.github/workflows/release.yml`

```text
git tag v1.0.0
  → pnpm install
  → pnpm build
  → tauri build (Windows + macOS)
  → 上传 artifact
  → 合并 download/
  → 上传 CDN (download.xxx.com)
  → 更新 update.json
  → 客户端自动升级
```

GitHub Secrets：`DOWNLOAD_BASE_URL`, `VITE_UPDATE_JSON_URL`, `STORAGE_*`

## 下载中心

```
download/
  windows/AI-Commerce-Setup.exe
  mac/AI-Commerce.dmg
  update/update.json
```

官网：`/download` — 版本号、更新时间、更新日志、文件大小、OS 自动识别。

## Tauri 发布配置

- `apps/desktop/src-tauri/tauri.conf.json` — NSIS / DMG / updater
- `apps/desktop/publish.config.json` — 由 `npm run desktop:configure` 生成
- `scripts/desktop/configure-publish.mjs` — 注入 updater endpoint
