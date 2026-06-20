import {
  VIDEO_TEMPLATE_LABELS,
  VideoProviderId,
  VideoTemplateType,
} from "@acs/shared";

export interface VideoPromptInput {
  templateType: VideoTemplateType;
  productName?: string;
  duration: number;
}

/** 为各视频模板构建 Prompt */
export function buildVideoPrompt(input: VideoPromptInput): string {
  const product = input.productName ?? "商品";
  const duration = input.duration;

  switch (input.templateType) {
    case VideoTemplateType.PRODUCT_ROTATE:
      return `${product} 360度旋转展示，电商商品视频，${duration}秒，白底或简约背景，流畅旋转`;
    case VideoTemplateType.SCENE_PUSH:
      return `${product} 场景推进镜头，生活方式场景，${duration}秒，电影感运镜，自然光`;
    case VideoTemplateType.ZOOM_IN:
      return `${product} 镜头缓慢拉近特写，突出产品细节，${duration}秒，高端商业摄影`;
    case VideoTemplateType.UNBOXING:
      return `${product} 开箱展示视频，${duration}秒，真实开箱体验，惊喜感`;
    case VideoTemplateType.MARKETING:
      return `${product} 营销广告视频，${duration}秒，促销氛围，醒目卖点，转化导向`;
    default:
      return `${product} 电商商品展示视频，${duration}秒，${VIDEO_TEMPLATE_LABELS[input.templateType] ?? "展示"}`;
  }
}
