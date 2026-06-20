import {
  getVideoPointCost,
  UserPlan,
  UserRole,
  VideoProviderId,
  VideoTemplateType,
  VIDEO_TEMPLATE_PROVIDER,
} from "@acs/shared";

const VIDEO_TASK_RULES: Partial<Record<VideoTemplateType, { provider: VideoProviderId; reason: string }>> = {
  [VideoTemplateType.PRODUCT_ROTATE]: { provider: VideoProviderId.KLING, reason: "商品旋转 → 可灵" },
  [VideoTemplateType.SCENE_PUSH]: { provider: VideoProviderId.VEO, reason: "场景推进 → Veo" },
  [VideoTemplateType.ZOOM_IN]: { provider: VideoProviderId.WAN, reason: "镜头拉近 → Wan Video" },
  [VideoTemplateType.UNBOXING]: { provider: VideoProviderId.KLING, reason: "开箱展示 → 可灵" },
  [VideoTemplateType.MARKETING]: { provider: VideoProviderId.VEO, reason: "营销广告 → Veo" },
};

const FAILOVER: Record<VideoProviderId, VideoProviderId[]> = {
  [VideoProviderId.KLING]: [VideoProviderId.KLING, VideoProviderId.WAN, VideoProviderId.VEO],
  [VideoProviderId.VEO]: [VideoProviderId.VEO, VideoProviderId.KLING, VideoProviderId.WAN],
  [VideoProviderId.WAN]: [VideoProviderId.WAN, VideoProviderId.KLING, VideoProviderId.VEO],
};

export interface VideoRouteInput {
  templateType: VideoTemplateType;
  duration: number;
  userPlan?: UserPlan;
  userRole?: UserRole;
  userBalance?: number;
  preferredProvider?: string;
}

export interface VideoRouteResult {
  provider: VideoProviderId;
  reason: string;
  fallbackChain: VideoProviderId[];
  cost: number;
}

export function routeVideoProvider(input: VideoRouteInput): VideoRouteResult {
  const rule =
    VIDEO_TASK_RULES[input.templateType] ??
    VIDEO_TEMPLATE_PROVIDER[input.templateType]
      ? {
          provider: VIDEO_TEMPLATE_PROVIDER[input.templateType]!,
          reason: "模板默认 Provider",
        }
      : { provider: VideoProviderId.KLING, reason: "默认可灵" };

  let provider = rule.provider;
  let reason = rule.reason;
  const cost = getVideoPointCost(input.duration);

  const preferred = input.preferredProvider?.trim().toLowerCase();
  if (preferred && preferred !== "auto" && Object.values(VideoProviderId).includes(preferred as VideoProviderId)) {
    provider = preferred as VideoProviderId;
    reason = `用户指定: ${preferred}`;
  } else if (input.userRole === UserRole.ADMIN || input.userPlan === UserPlan.ENTERPRISE) {
    provider = VideoProviderId.VEO;
    reason = "企业版优先 Veo";
  }

  return {
    provider,
    reason,
    fallbackChain: FAILOVER[provider] ?? [provider],
    cost,
  };
}

export function getVideoFailoverChain(primary: VideoProviderId): VideoProviderId[] {
  return FAILOVER[primary] ?? [primary];
}
