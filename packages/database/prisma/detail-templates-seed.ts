import type { PrismaClient } from "@prisma/client";

const CATEGORIES = ["厨房用品", "家居用品", "收纳用品", "食品", "服装", "美妆"] as const;

const VARIANTS = [
  { suffix: "标准详情", blocks: ["BANNER", "FEATURE", "SCENE", "PARAMETER", "DETAIL", "REASON"] },
  { suffix: "卖点强化", blocks: ["BANNER", "FEATURE", "REASON"] },
  { suffix: "场景展示", blocks: ["BANNER", "SCENE", "DETAIL", "BRAND"] },
  { suffix: "参数详情", blocks: ["BANNER", "PARAMETER", "SIZE", "DETAIL"] },
  { suffix: "品牌故事", blocks: ["BANNER", "BRAND", "REASON", "FEATURE"] },
  { suffix: "五图精简", blocks: ["BANNER", "FEATURE", "SCENE", "PARAMETER", "REASON"] },
  { suffix: "促销转化", blocks: ["BANNER", "FEATURE", "REASON", "SCENE"] },
  { suffix: "高端质感", blocks: ["BANNER", "FEATURE", "SCENE", "BRAND", "DETAIL"] },
  { suffix: "使用说明", blocks: ["BANNER", "DETAIL", "PARAMETER", "REASON"] },
];

const PRODUCT_PREFIX: Record<string, string[]> = {
  厨房用品: ["锅具", "刀架", "餐具", "置物架", "小家电"],
  家居用品: ["收纳盒", "台灯", "抱枕", "衣架", "地毯"],
  收纳用品: ["抽屉收纳", "桌面收纳", "衣柜收纳", "鞋盒", "整理箱"],
  食品: ["零食", "饮料", "坚果", "咖啡", "速食"],
  服装: ["T恤", "连衣裙", "运动鞋", "外套", "背包"],
  美妆: ["口红", "面膜", "护肤套装", "化妆镜", "香水"],
};

export async function seedDetailTemplates(prisma: PrismaClient): Promise<number> {
  let created = 0;
  let sortOrder = 100;

  for (const category of CATEGORIES) {
    const prefixes = PRODUCT_PREFIX[category] ?? ["商品"];
    for (const prefix of prefixes) {
      for (const variant of VARIANTS) {
        const name = `${prefix}${variant.suffix}`;
        const existing = await prisma.detailTemplate.findFirst({ where: { name } });
        if (existing) continue;

        await prisma.detailTemplate.create({
          data: {
            name,
            description: `${category} · ${variant.suffix}详情页模板`,
            category,
            coverUrl: `https://picsum.photos/seed/detail-${encodeURIComponent(name)}/400/600`,
            blockTypes: variant.blocks,
            enabled: true,
            sortOrder: sortOrder++,
          },
        });
        created += 1;
      }
    }
  }

  return created;
}
