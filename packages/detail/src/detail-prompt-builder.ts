import { DetailBlockType } from "@acs/shared";

export interface DetailPromptInput {
  blockType: DetailBlockType;
  productName: string;
  sellingPoints: string[];
  category?: string;
  style?: string;
}

/** 为各详情页模块生成 Prompt */
export function buildDetailBlockPrompt(input: DetailPromptInput): string {
  const { blockType, productName, sellingPoints } = input;
  const points = sellingPoints.slice(0, 4).join("、");
  const category = input.category ?? "商品";

  switch (blockType) {
    case DetailBlockType.BANNER:
      return `电商详情页 Banner，${productName}，${points}，高端商业摄影，790px宽，醒目主视觉`;
    case DetailBlockType.FEATURE:
      return `电商卖点展示图，${productName}，突出卖点：${points}，图文排版，清晰易读`;
    case DetailBlockType.SCENE:
      return `生活方式场景图，${productName}融入${input.style ?? "现代"}环境，自然光，真实使用场景`;
    case DetailBlockType.SIZE:
      return `产品尺寸标注图，${productName}，精确尺寸线标注，规格信息，专业电商风格`;
    case DetailBlockType.PARAMETER:
      return `产品参数表图，${productName}，材质/重量/颜色/容量参数展示，清晰表格排版`;
    case DetailBlockType.DETAIL:
      return `产品细节特写，${productName}，材质纹理、工艺细节，微距摄影`;
    case DetailBlockType.BRAND:
      return `品牌故事模块，${category}品牌调性，${productName}，信任感设计`;
    case DetailBlockType.REASON:
      return `购买理由模块，${productName}，${points}，促销氛围，转化导向`;
    default:
      return `${productName} 电商详情页模块，${points}`;
  }
}
