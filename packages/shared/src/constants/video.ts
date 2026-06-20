/** 视频模板类型 — Phase 14 */
export enum VideoTemplateType {
  PRODUCT_ROTATE = "PRODUCT_ROTATE",
  SCENE_PUSH = "SCENE_PUSH",
  ZOOM_IN = "ZOOM_IN",
  UNBOXING = "UNBOXING",
  MARKETING = "MARKETING",
}

export enum VideoStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export enum VideoProviderId {
  KLING = "kling",
  VEO = "veo",
  WAN = "wan",
}

export const VIDEO_TEMPLATE_LABELS: Record<VideoTemplateType, string> = {
  [VideoTemplateType.PRODUCT_ROTATE]: "商品旋转",
  [VideoTemplateType.SCENE_PUSH]: "场景推进",
  [VideoTemplateType.ZOOM_IN]: "镜头拉近",
  [VideoTemplateType.UNBOXING]: "开箱展示",
  [VideoTemplateType.MARKETING]: "营销广告",
};

/** 支持的视频时长（秒） */
export const VIDEO_DURATIONS = [5, 8, 10] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

/** 时长 → 积分 */
export const VIDEO_DURATION_COSTS: Record<number, number> = {
  5: 20,
  8: 30,
  10: 40,
};

/** 时长 → 预计生成时间（秒） */
export const VIDEO_ESTIMATED_SECONDS: Record<number, number> = {
  5: 30,
  8: 45,
  10: 60,
};

export function getVideoPointCost(duration: number): number {
  return VIDEO_DURATION_COSTS[duration] ?? 20;
}

/** 模板类型 → 默认 Provider */
export const VIDEO_TEMPLATE_PROVIDER: Partial<Record<VideoTemplateType, VideoProviderId>> = {
  [VideoTemplateType.PRODUCT_ROTATE]: VideoProviderId.KLING,
  [VideoTemplateType.SCENE_PUSH]: VideoProviderId.VEO,
  [VideoTemplateType.ZOOM_IN]: VideoProviderId.WAN,
  [VideoTemplateType.UNBOXING]: VideoProviderId.KLING,
  [VideoTemplateType.MARKETING]: VideoProviderId.VEO,
};
