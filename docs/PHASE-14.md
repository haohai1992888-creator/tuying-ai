# Phase 14 — AI Video Engine（AI 商品视频引擎）

## 架构

```
商品图 → Video Workflow → Video Router → Video Provider → OSS → MP4
```

## 数据表

| 表 | 说明 |
|----|------|
| `VideoTemplate` | 视频镜头模板 |
| `VideoTask` | 视频生成任务（progress、provider、videoUrl） |

## Video Provider

| Provider | 说明 |
|----------|------|
| kling（可灵） | 商品旋转、开箱 |
| veo | 场景推进、营销广告 |
| wan | 镜头拉近、图转视频 |

统一接口：`generate()` / `imageToVideo()`

## 视频模板

| 类型 | 名称 |
|------|------|
| PRODUCT_ROTATE | 商品旋转 |
| SCENE_PUSH | 场景推进 |
| ZOOM_IN | 镜头拉近 |
| UNBOXING | 开箱展示 |
| MARKETING | 营销广告 |

## 时长与积分

| 时长 | 积分 |
|------|------|
| 5 秒 | 20 |
| 8 秒 | 30 |
| 10 秒 | 40 |

## API

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/video/templates | 模板 + 时长价格 |
| POST | /api/video/generate | 开始生成 |
| GET | /api/video/[id] | 轮询进度 |
| Admin | /api/admin/video-tasks | 视频任务中心 |

## Desktop

路径：`/video` — 上传、选模板、选时长、预览（播放/暂停/循环）、下载 MP4

## Admin

路径：`/video-tasks` — 用户、模型、耗时、积分、状态

## 核心包

- `@acs/video-providers` — Kling / Veo / Wan 统一接口
- `@acs/video` — VideoWorkflow、VideoRouter、VideoService

## 迁移

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration: `20260806000000_phase_14_video`

## 验收流程

1. 上传商品图
2. 选择镜头模板（如商品旋转）
3. 选择时长（5/8/10 秒）
4. 开始生成 → 查看进度
5. 预览视频 → 下载 MP4
