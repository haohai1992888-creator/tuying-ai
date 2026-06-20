# MVP Sprint 路线

> AI Commerce Studio V1.0 — 按 Sprint 交付，每 Sprint 可独立验收。

## Sprint 1 · 用户系统

- [ ] 用户注册 / 登录（email + password）
- [ ] JWT 签发与校验中间件
- [ ] `GET /api/user/profile`
- [ ] Prisma `User` 表 + migration
- [ ] 密码 bcrypt 哈希

**验收：** 注册 → 登录 → 带 Token 访问 profile

---

## Sprint 2 · 文件上传

- [ ] OSS SDK 接入（S3 兼容）
- [ ] `POST /api/upload` → 返回 `input_url`
- [ ] Desktop / API 侧图片预览 URL
- [ ] `/uploads` 目录规范

**验收：** 上传 JPG → 获得可访问 URL → 写入 temp 记录

---

## Sprint 3 · GPT Image 2

- [ ] `GptImageProvider` 实现 `generate()`
- [ ] 环境变量 `OPENAI_API_KEY`
- [ ] 单节点测试 workflow（无完整引擎）

**验收：** 给定 Prompt + 参考图 → 返回生成 URL

---

## Sprint 4 · 积分系统

- [ ] `point_logs` 流水
- [ ] 扣减 / 充值 GRANT
- [ ] 创建任务前 `points` 预检
- [ ] PRD 积分单价表配置化

**验收：** 余额不足拒绝 · 成功后扣减 · 流水可查

---

## Sprint 5 · Workflow Engine

- [ ] `WorkflowEngine.run(workflowId, context)`
- [ ] 节点类型：upload / recognize / prompt / route / generate / store / billing
- [ ] 场景图 JSON 工作流跑通
- [ ] `tasks` 表状态机 PENDING → PROCESSING → COMPLETED / FAILED

**验收：** `POST /api/task/create` 触发场景图全流程

---

## Sprint 6 · Model Router

- [ ] `ModelRouter.select(request)`
- [ ] PRD 路由规则表
- [ ] fallback 链（GPT → Seedream）
- [ ] 写入 `tasks.model_name`

**验收：** 不同 taskType 路由到不同 provider

---

## Sprint 7 · Seedream + Gemini

- [ ] `SeedreamProvider` · `GeminiProvider`
- [ ] 海报 / 白底 / 批量工作流 JSON
- [ ] 三 Provider 统一错误格式

**验收：** 白底走 Gemini · 海报走 Seedream · 场景走 GPT

---

## Sprint 8 · 支付

- [ ] `orders` 创建
- [ ] 微信支付 + 支付宝（Native / JSAPI 按端区分）
- [ ] Webhook 回调 → 增积分
- [ ] `POST /api/payment/create`

**验收：** 支付成功 → 积分到账 → 订单 PAID

---

## Sprint 9 · 批量生成

- [ ] Redis 批量队列
- [ ] 任务拆分 + 并发 Worker
- [ ] 结果 ZIP + `output_url`
- [ ] Desktop 批量上传 UI

**验收：** 10 张图批量白底 → 单 ZIP 下载

---

## 当前仓库进度

| Sprint | 状态 |
|--------|------|
| 0 · 项目脚手架 | ✅ Monorepo · PRD · Schema · 包骨架 · API 路由桩 |
| 1–9 | ⏳ 待开发 |
