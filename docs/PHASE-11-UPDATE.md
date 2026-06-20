# Phase 11 — Tauri 自动更新系统

## 目标

- 启动 / 手动检查更新
- 下载、安装、重启
- 版本管理与更新日志
- 灰度发布、强制更新

## 版本策略

| 类型 | 示例 | 规则 |
|------|------|------|
| 大版本 | 2.0.0 | major +1 |
| 功能 | 1.1.0 | minor +1 |
| 修复 | 1.0.1 | patch +1 |

工具：`versionService.suggestNextVersion('minor' | 'patch' | 'major')`

## API（Express `:3001`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/version/latest` | 检查更新（含灰度） |
| POST | `/api/version/download-log` | 下载统计 |
| GET | `/update/:target/:currentVersion` | Tauri Updater 端点 |

查询参数：`currentVersion`、`channel`、`platform`、`deviceId`

### Tauri 响应示例

```json
{
  "version": "1.1.0",
  "notes": "新增模板市场",
  "pub_date": "2026-06-20T00:00:00.000Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "...",
      "url": "https://releases.example.com/acs/1.1.0/setup.exe"
    }
  }
}
```

无更新时返回 **204**。

## 灰度发布

`version_rollouts` 表：

| 字段 | 说明 |
|------|------|
| version | 版本号 |
| percent | 0–100，覆盖比例 |
| force | 强制更新 |

客户端 `deviceId`（localStorage）做稳定分桶：`hash(deviceId) % 100 < percent`。

示例：10% → 30% → 100% 逐步放量。

## 强制更新

`AppVersion.forceUpdate = true` 或 rollout `force = true` 时，客户端全屏拦截，必须更新才能继续。

## Tauri 配置

`apps/desktop/src-tauri/tauri.conf.json`：

```json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": ["http://localhost:3001/update/{{target}}/{{current_version}}"],
    "dialog": false,
    "pubkey": "生产环境替换为 minisign 公钥"
  }
}
```

生产环境设置：

```env
API_PUBLIC_URL=https://api.yourdomain.com
UPDATER_PUBKEY=...
```

## 客户端

| 文件 | 作用 |
|------|------|
| `src/update.ts` | 统一 check / download / install / restart |
| `components/UpdateChecker.tsx` | 启动检测 |
| `components/SettingsUpdatePanel.tsx` | 设置页「检查更新」 |
| `services/updateService.ts` | HTTP 更新（浏览器 / 开发模式） |

Tauri 运行时优先 `@tauri-apps/plugin-updater`；否则回退 HTTP 下载安装包。

## 发布流程

```
npm run tauri:build     # 打包 + 生成 updater 签名产物
      ↓
上传 OSS / COS / R2     # app-win.exe / app-mac.dmg
      ↓
Admin 发布版本 + 配置 rollout
      ↓
用户自动升级
```

## 启动

```bash
npm run dev:api          # 更新 API :3001
npm run db:seed          # 写入 1.0.0 + 1.1.0 示例版本
npm run dev:desktop      # Vite 开发（HTTP 更新）
npm run tauri:dev -w @acs/desktop   # Tauri 壳 + 热更新
```

## 验收

1. 客户端 v1.0.0 启动 → 弹窗提示 v1.1.0
2. 设置页「检查更新」正常
3. 下载进度显示
4. 安装 / 重启（Tauri 或手动运行 exe）
5. Admin 调整 rollout percent 验证灰度

## 后续

- 增量更新、CDN、分区域、Beta 渠道
- 生产环境替换 updater 公钥与真实签名
