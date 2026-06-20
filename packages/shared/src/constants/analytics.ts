/** Analytics 事件类型 — Phase 15 */
export const ANALYTICS_EVENT_TYPES = {
  USER_REGISTER: "USER_REGISTER",
  USER_LOGIN: "USER_LOGIN",
  IMAGE_GENERATE: "IMAGE_GENERATE",
  POSTER_GENERATE: "POSTER_GENERATE",
  DETAIL_GENERATE: "DETAIL_GENERATE",
  VIDEO_GENERATE: "VIDEO_GENERATE",
  BATCH_START: "BATCH_START",
  BATCH_COMPLETE: "BATCH_COMPLETE",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  SUBSCRIBE_SUCCESS: "SUBSCRIBE_SUCCESS",
  POINTS_DEDUCT: "POINTS_DEDUCT",
  MODEL_CALL: "MODEL_CALL",
  MODEL_FAIL: "MODEL_FAIL",
  MODEL_FALLBACK: "MODEL_FALLBACK",
  TEMPLATE_USED: "TEMPLATE_USED",
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES];

/** 功能模块标识 */
export const ANALYTICS_MODULES = {
  AUTH: "auth",
  SCENE: "scene",
  POSTER: "poster",
  DETAIL: "detail",
  VIDEO: "video",
  BATCH: "batch",
  PAYMENT: "payment",
  MEMBERSHIP: "membership",
  TEMPLATE: "template",
  MODEL: "model",
  POINTS: "points",
} as const;

/** 模型单位成本估算（USD）— 用于利润分析 */
export const MODEL_UNIT_COST_USD: Record<string, number> = {
  gpt: 0.04,
  seedream: 0.02,
  gemini: 0.01,
  kling: 0.08,
  veo: 0.1,
  wan: 0.06,
};

/** 积分 → 收入估算（CNY） */
export const POINT_TO_REVENUE_CNY = 0.01;

/** 成本监控阈值（USD） */
export const COST_MONITOR_THRESHOLD_USD = 0.15;

export const REDIS_QUEUES_ANALYTICS = "analytics-queue" as const;
