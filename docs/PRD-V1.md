# AI Commerce Studio · PRD V1.0

> 项目代号：**AI Commerce Studio**（AI 电商工作台）  
> 产品形态：**Tauri Desktop + SaaS Platform**  
> 开发模式：**Workflow Engine + Model Router + Multi-Model Architecture**

---

## 一、项目背景

当前电商卖家面临：

- 商品图制作成本高
- 主图设计效率低
- 场景图制作周期长
- 模特图制作成本高
- 海报设计依赖设计师
- AI 工具分散，使用门槛高

需要构建面向电商卖家的 **AI 工作台**。用户上传商品图后，AI 自动完成：

- 商品图优化 · 场景图 · 模特图 · 海报 · 白底图 · **批量生成**

**未来扩展：** 商品视频 · 详情页 · AI 短剧剪辑 · 自媒体矩阵

---

## 二、项目目标

构建 **可持续扩展的 AI Workflow Platform**。

### 第一阶段聚焦

| 域 | 能力 |
|----|------|
| **AI 商品图** | 主图优化 · 场景图 · 白底图 |
| **AI 营销设计** | 海报图 · 广告图 |
| **AI 人物处理** | 模特换装 · 模特生成 |
| **AI 批量处理** | 批量商品图 · 批量白底图 |

---

## 三、总体架构

```
Tauri Desktop Client
        │
        ▼
Next.js Business API
        │
        ▼
Workflow Engine
        │
        ▼
Model Router
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
GPT Image 2  Seedream 4.5  Gemini Flash Image
        │
        ▼
OSS Storage → PostgreSQL · Redis
```

---

## 四、系统分层

### Layer 1 · Client（Tauri 2 + React）

**栈：** Tauri 2.x · React · TypeScript · TailwindCSS · Shadcn UI · Zustand · TanStack Query

**职责：** 用户交互 — 登录/注册 · 上传 · 参数 · 任务提交 · 结果/历史 · 下载 · 积分 · 支付

**约束：客户端禁止直接调用 AI 模型，所有请求经 Business API。**

### Layer 2 · Business API（Next.js 15）

**职责：** 认证 · 权限 · 订单 · 积分校验 · 创建/查询任务 · 返回结果

**核心接口：**

| 方法 | 路径 |
|------|------|
| POST | `/api/task/create` |
| GET | `/api/task/status` |
| GET | `/api/user/profile` |
| POST | `/api/payment/create` |

### Layer 3 · Workflow Engine

**核心原则：** 禁止 `if (task == "scene")`，全部配置化。

**节点标准：**

```json
{ "id": "...", "type": "...", "input": {}, "output": {}, "next": "..." }
```

#### 场景图工作流

上传 → 商品识别 → 分类 → Prompt 增强 → 模型路由 → 生成 → OSS → 扣积分 → 返回

#### 海报工作流

上传 → OCR → 卖点提取 → Prompt 构建 → 模型路由 → 生成 → 存储 → 返回

#### 白底图工作流

上传 → 背景检测 → 抠图 → 白底生成 → 存储 → 返回

#### 批量工作流

多图上传 → 任务拆分 → 队列 → 并发 → 汇总 → 压缩包

---

## 五、Model Router

**输入示例：**

```json
{
  "taskType": "scene_image",
  "category": "kitchen",
  "complexity": "medium",
  "userLevel": "vip"
}
```

**输出：** `{ "provider": "gpt-image" }`

| 任务 | 模型 | 原因 |
|------|------|------|
| 白底图 | Gemini Flash Image | 快 · 成本低 |
| 场景图 | GPT Image 2 | 场景遵循 · 商品一致性 |
| 中文海报 | Seedream 4.5 | 中文文字 |
| 模特换装 | Seedream 4.5 | 人物一致性 |
| 批量生成 | Gemini Flash Image | 成本最低 |

**未来：** 评分 · 自动降级 · 故障转移 · 成本控制 · 用户等级策略（如 GPT 失败 → Seedream）

---

## 六、AI Provider 抽象

```typescript
interface AIProvider {
  generate(input: GenerateInput): Promise<GenerateOutput>;
  edit(input: EditInput): Promise<EditOutput>;
  batchGenerate(input: BatchInput): Promise<BatchOutput>;
}
```

| Provider | 负责 |
|----------|------|
| GPT | 场景图 · 主图优化 · 广告图 |
| Seedream | 海报 · 模特 · 中文营销图 |
| Gemini | 白底图 · 批量图 |

---

## 七、数据模型

### users

id · email · phone · password · avatar · points · vip_expire_time · created_at

### tasks

id · user_id · task_type · model_name · input_url · output_url · cost · status · created_at

### point_logs

id · user_id · change_type · points · remark · created_at

### orders

id · user_id · amount · status · payment_method · created_at

---

## 八、Redis

**缓存：** 用户信息 · Token · 积分余额 · 任务状态

**队列：** AI 任务队列 · 批量任务队列

---

## 九、OSS 目录

`/uploads` · `/results` · `/thumbnails` · `/temp` — 库内仅存 URL

---

## 十、积分规则

| 功能 | 积分 |
|------|------|
| 提示词生成 | 1 |
| 白底图 | 2 |
| 主图优化 | 3 |
| 场景图 | 5 |
| 模特图 | 8 |
| 海报图 | 10 |

**流程：** 检查积分 → 执行 → 成功扣减 → 记流水

---

## 十一、支付

微信支付 · 支付宝 — 创建订单 → 支付 → 回调 → 增积分 → 更新余额

---

## 十二、MVP Sprint 路线

见 [SPRINTS.md](./SPRINTS.md)

| Sprint | 内容 |
|--------|------|
| 1 | 用户系统 · JWT |
| 2 | OSS 上传 · 预览 |
| 3 | GPT Image 2 |
| 4 | 积分系统 |
| 5 | Workflow Engine |
| 6 | Model Router |
| 7 | Seedream · Gemini |
| 8 | 微信 · 支付宝支付 |
| 9 | 批量生成 |

---

## 十三、长期规划

商品图 / 详情页 / 视频 / 短剧 / 公众号 / 内容矩阵 — 全部基于：

Workflow Engine · Model Router · User · Payment · Points · OSS · PostgreSQL · Redis

**最终定位：AI Workflow Platform，而非单一 AI 图片工具。**
