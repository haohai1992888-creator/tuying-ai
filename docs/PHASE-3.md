# Phase 3 — OSS 上传 + 图片管理 + 文件服务

## 架构

业务代码 **禁止直接调用 OSS**，统一通过 `StorageProvider` 访问。

```
业务 API → FileService → StorageProvider → OSS / R2 / Local
                ↓
           ImageService (sharp)
                ↓
            PostgreSQL (File)
                ↓
         Redis 缓存 (30min TTL)
```

## StorageProvider 接口

```typescript
interface StorageProvider {
  upload(file: Buffer, path: string, contentType?: string): Promise<string>
  delete(path: string): Promise<boolean>
  exists(path: string): Promise<boolean>
  getUrl(path: string): Promise<string>
}
```

实现：

| Provider | 说明 |
|----------|------|
| `OSSProvider` | 阿里云 OSS（S3 兼容 API） |
| `R2Provider` | Cloudflare R2 骨架 |
| `LocalStorageProvider` | 本地 `.storage/`，无 OSS 配置时自动启用 |

环境变量 `STORAGE_DRIVER`: `auto` | `oss` | `r2` | `local`

## 数据库 — File 表

| 字段 | 说明 |
|------|------|
| userId, fileName, fileType, fileSize | 基础信息 |
| category | ORIGINAL / GENERATED / THUMBNAIL / TEMP |
| storagePath, publicUrl | 存储路径与访问 URL |
| width, height | 图片尺寸 |

## OSS 目录规划

```
uploads/{userId}/      用户原图
results/{userId}/      AI 生成图（Phase 4+）
thumbnails/{userId}/   缩略图 200/400/800
temp/{userId}/         临时文件
```

## API 清单

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/files/upload | 上传图片（multipart file） |
| GET | /api/files | 我的文件列表（支持 search） |
| GET | /api/files/:id | 文件详情 |
| DELETE | /api/files/:id | 删除文件 |
| GET | /api/files/:id/download | 下载/预览（需登录 + FileGuard） |
| GET | /api/storage/[...path] | 本地存储静态访问（仅 local 模式） |
| GET | /api/admin/files | 管理员查看全部文件 |

### 上传返回

```json
{
  "id": "",
  "url": "",
  "width": 1200,
  "height": 1200
}
```

## 图片验证

| 规则 | 值 |
|------|-----|
| 允许格式 | jpg, jpeg, png, webp |
| 禁止 | gif, exe, zip 等 |
| 默认大小上限 | 20MB |
| 绝对上限 | 50MB |
| 最小尺寸 | 300×300 |
| 最大尺寸 | 8000×8000 |

## ImageService

- 压缩原图（最大边 2048）
- 生成缩略图：200×200、400×400、800×800（webp）
- 格式转换

## 权限 — FileGuard

- 用户只能访问自己的文件
- ADMIN 可访问全部

## Redis 缓存（TTL 30 分钟）

- `acs:file:{id}` — 文件信息
- `acs:file:url:{id}` — 图片 URL
- `acs:files:user:{userId}` — 用户文件列表

## 前端页面

| 端 | 页面 | 功能 |
|----|------|------|
| Web | `/files` | 我的文件：查看/删除/下载/复制链接 |
| Desktop | `/files` | 文件列表 + ImagePreview（缩放/拖拽/删除） |
| Desktop | `/upload` | 拖拽上传、批量、进度、失败重试 |
| Admin | `/files` | 全部文件管理 |

## 本地启动

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev:web      # :3000
npm run dev:desktop  # :5173
```

无 OSS 配置时自动使用本地存储（`.storage/` 目录）。

## 禁止项

- 不接 GPT / Seedream / Gemini
- 不开发工作流与 Router

## Phase 3 验证（Express 课程 API · `apps/api`）

课程清单中的 OSS 上传已落地为 `apps/api`，复用 `@acs/storage`（S3 兼容 OSS / 本地 fallback）与 Prisma `File` 表。

| 步骤 | 命令 / 地址 |
|------|-------------|
| 配置 OSS（可选） | `.env` 中 `OSS_ACCESS_KEY`、`OSS_SECRET_KEY`、`OSS_ENDPOINT`、`OSS_BUCKET` |
| 本地开发 | 不配 OSS 时自动使用 `.storage/` 本地目录 |
| 启动 API | `npm run dev:api` |
| 上传 | `POST /api/file/upload` + `Authorization` + `multipart/form-data` field `file` |
| 列表 | `GET /api/file/list` |
| 删除 | `DELETE /api/file/:id` |
| 本地访问 | `GET /api/storage/...`（仅 local 模式） |

Desktop 上传：`apps/desktop/src/api/upload.ts` → 默认 `http://localhost:3001`。

### 完成标志

- 上传成功并返回 URL
- 数据库有 `files` 记录
- 文件列表仅返回当前用户文件
- 删除成功且用户隔离

## 下一阶段

**Phase 4**: Workflow Engine
