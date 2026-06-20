import { TaskType } from "../enums";

/** 积分消耗规则 — Phase 2+ 任务扣费参考 */
export const POINT_COSTS: Record<TaskType, number> = {
  [TaskType.PROMPT]: 1,
  [TaskType.WHITE_BACKGROUND]: 2,
  [TaskType.MAIN_IMAGE_OPTIMIZE]: 3,
  [TaskType.SCENE_IMAGE]: 5,
  [TaskType.MODEL_IMAGE]: 8,
  [TaskType.POSTER]: 10,
  [TaskType.BATCH_WHITE_BACKGROUND]: 2,
  [TaskType.BATCH_PRODUCT_IMAGE]: 3,
  [TaskType.BATCH_SCENE_IMAGE]: 5,
  [TaskType.BATCH_POSTER]: 10,
  [TaskType.BATCH_MODEL_IMAGE]: 8,
  [TaskType.DETAIL_PAGE]: 50,
  [TaskType.PRODUCT_VIDEO]: 20,
};

export const REDIS_KEYS = {
  user: (id: string) => `acs:user:${id}`,
  points: (userId: string) => `acs:points:${userId}`,
  task: (taskId: string) => `acs:task:${taskId}`,
  token: (userId: string) => `acs:token:${userId}`,
  file: (id: string) => `acs:file:${id}`,
  fileUrl: (id: string) => `acs:file:url:${id}`,
  userFiles: (userId: string) => `acs:files:${userId}`,
  batchTask: (id: string) => `acs:batch:${id}`,
  batchActive: (userId: string) => `acs:batch:active:${userId}`,
  dailyCheckIn: (userId: string, date: string) => `acs:checkin:${userId}:${date}`,
} as const;

export const REDIS_TTL = {
  USER: 30 * 60,
  POINTS: 30 * 60,
  TOKEN: 30 * 60,
  FILE: 30 * 60,
} as const;

export const REDIS_QUEUES = {
  AI_TASK: "ai-task-queue",
  BATCH_TASK: "batch-task-queue",
  BATCH: "batch-queue",
  IMAGE_GENERATE: "image-generate-queue",
  IMAGE_SAVE: "image-save-queue",
  WORKFLOW: "workflow-queue",
  ANALYTICS: "analytics-queue",
} as const;

export const OSS_PATHS = {
  uploads: "uploads",
  results: "results",
  thumbnails: "thumbnails",
  temp: "temp",
} as const;

export const REGISTER_GIFT_POINTS = 100;

/** Phase 3 — 图片上传限制 */
export const FILE_LIMITS = {
  DEFAULT_MAX_BYTES: 20 * 1024 * 1024,
  ABSOLUTE_MAX_BYTES: 50 * 1024 * 1024,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 300,
  MAX_WIDTH: 8000,
  MAX_HEIGHT: 8000,
} as const;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

export const THUMBNAIL_SIZES = [200, 400, 800] as const;

export function buildUserStoragePath(
  folder: keyof typeof OSS_PATHS,
  userId: string,
  fileName: string
): string {
  return `${OSS_PATHS[folder]}/${userId}/${fileName}`;
}

export function getPointCost(taskType: TaskType): number {
  return POINT_COSTS[taskType] ?? 1;
}

export * from "./membership";
export * from "./templates";
export * from "./detail";
export * from "./video";
export * from "./analytics";
