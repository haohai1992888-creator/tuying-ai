import { AIProviderId, RouterTaskType, TaskType } from "@acs/shared";

/** 将业务 taskType 归一化为 Router 任务类型 */
export function normalizeRouterTaskType(taskType: string): RouterTaskType | string {
  switch (taskType) {
    case TaskType.SCENE_IMAGE:
    case "scene_image":
      return RouterTaskType.SCENE_IMAGE;
    case TaskType.POSTER:
    case "poster":
    case "poster_image":
      return RouterTaskType.POSTER_IMAGE;
    case TaskType.MODEL_IMAGE:
    case "model_image":
      return RouterTaskType.MODEL_IMAGE;
    case TaskType.WHITE_BACKGROUND:
    case "white_background":
    case "white_bg":
      return RouterTaskType.WHITE_BG;
    case TaskType.BATCH_WHITE_BACKGROUND:
    case TaskType.BATCH_PRODUCT_IMAGE:
    case "batch_image":
    case "batch_white_background":
    case "batch_product_image":
      return RouterTaskType.BATCH_IMAGE;
    default:
      return taskType;
  }
}

export function isValidProvider(id: string): id is AIProviderId {
  return Object.values(AIProviderId).includes(id as AIProviderId);
}

/** 未来可扩展 Provider — 注册后无需改业务代码 */
export const FUTURE_PROVIDERS = ["flux", "ideogram", "midjourney", "claude-image"] as const;
