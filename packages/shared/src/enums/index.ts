export enum UserRole {
  USER = "USER",
  VIP = "VIP",
  ADMIN = "ADMIN",
}

export enum UserPlan {
  FREE = "FREE",
  VIP = "VIP",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionOrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CLOSED = "CLOSED",
  REFUNDED = "REFUNDED",
}

export enum ReleaseChannel {
  STABLE = "STABLE",
  BETA = "BETA",
}

export enum ClientPlatform {
  WINDOWS = "WINDOWS",
  MACOS = "MACOS",
  LINUX = "LINUX",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
  BANNED = "BANNED",
}

export enum TaskStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum PointType {
  RECHARGE = "RECHARGE",
  CONSUME = "CONSUME",
  REFUND = "REFUND",
  GIFT = "GIFT",
  SIGN_IN = "SIGN_IN",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CLOSED = "CLOSED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  WECHAT = "WECHAT",
  ALIPAY = "ALIPAY",
}

export enum FileCategory {
  ORIGINAL = "ORIGINAL",
  GENERATED = "GENERATED",
  THUMBNAIL = "THUMBNAIL",
  TEMP = "TEMP",
}

export enum AIProviderId {
  GPT = "gpt",
  SEEDREAM = "seedream",
  GEMINI = "gemini",
}

export enum BatchStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
  FAILED = "FAILED",
  PAUSED = "PAUSED",
  CANCELLED = "CANCELLED",
}

export enum DetailTaskStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum DetailPlatform {
  TAOBAO = "TAOBAO",
  PINDUODUO = "PINDUODUO",
  DOUYIN = "DOUYIN",
  XIAOHONGSHU = "XIAOHONGSHU",
  OZON = "OZON",
  AMAZON = "AMAZON",
}

export enum TaskType {
  PROMPT = "prompt",
  WHITE_BACKGROUND = "white_background",
  MAIN_IMAGE_OPTIMIZE = "main_image_optimize",
  SCENE_IMAGE = "scene_image",
  MODEL_IMAGE = "model_image",
  POSTER = "poster",
  BATCH_WHITE_BACKGROUND = "batch_white_background",
  BATCH_PRODUCT_IMAGE = "batch_product_image",
  BATCH_SCENE_IMAGE = "batch_scene_image",
  BATCH_POSTER = "batch_poster",
  BATCH_MODEL_IMAGE = "batch_model_image",
  DETAIL_PAGE = "detail_page",
  PRODUCT_VIDEO = "product_video",
}

export enum TaskComplexity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum UserLevel {
  FREE = "free",
  PRO = "pro",
  VIP = "vip",
  ENTERPRISE = "enterprise",
}

/** Router 任务类型 — Phase 8 智能路由归一化 */
export enum RouterTaskType {
  SCENE_IMAGE = "scene_image",
  POSTER_IMAGE = "poster",
  MODEL_IMAGE = "model_image",
  WHITE_BG = "white_background",
  BATCH_IMAGE = "batch_image",
  PRODUCT_VIDEO = "product_video",
}

/** @deprecated use PointType */
export enum PointChangeType {
  CONSUME = "CONSUME",
  GRANT = "GRANT",
  REFUND = "REFUND",
  REWARD = "REWARD",
}
