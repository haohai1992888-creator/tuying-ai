import type { PrismaClient } from "@prisma/client";

interface SeedTemplate {
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  taskType: string;
  workflowId: string;
  promptContent: string;
  isVip?: boolean;
  sortOrder: number;
}

export const MARKETPLACE_TEMPLATES: SeedTemplate[] = [
  // 厨房场景
  { name: "厨房置物架场景", description: "厨房收纳置物架电商场景图", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk1/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "将{{product}}置于现代厨房置物架，{{scene}}，自然光，整洁台面，电商主图风格。", sortOrder: 10 },
  { name: "锅具摄影", description: "锅具产品特写场景", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk2/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}锅具置于灶台，{{style}}，暖色灯光，突出金属质感。", sortOrder: 11 },
  { name: "餐具摄影", description: "碗碟餐具生活方式场景", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk3/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}餐具摆盘，现代厨房，{{scene}}，俯拍，精致生活方式。", sortOrder: 12 },
  { name: "小家电厨房风", description: "咖啡机、空气炸锅等厨房小家电", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk4/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}小家电置于厨房岛台，{{style}}，明亮自然光。", sortOrder: 13 },
  { name: "刀具砧板场景", description: "刀具砧板组合展示", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk5/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}刀具砧板，木质厨房背景，{{scene}}，专业美食摄影。", sortOrder: 14 },
  { name: "调料瓶陈列", description: "调料瓶整齐陈列场景", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk6/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}调料瓶，厨房开放柜陈列，{{color}}色调，干净背景。", sortOrder: 15 },
  { name: "烘焙工具场景", description: "烘焙模具、工具展示", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk7/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}烘焙工具，面粉撒落细节，{{style}}，温馨烘焙氛围。", sortOrder: 16 },
  { name: "水槽龙头特写", description: "厨房水槽龙头产品图", category: "厨房场景", coverUrl: "https://picsum.photos/seed/mk8/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}厨房龙头，不锈钢水槽，水滴细节，高端厨卫广告。", sortOrder: 17 },

  // 家居场景
  { name: "客厅收纳场景", description: "客厅收纳用品场景图", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh1/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}置于北欧客厅，{{scene}}，柔和自然光，生活方式摄影。", sortOrder: 20 },
  { name: "卧室氛围图", description: "床品、香薰卧室场景", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh2/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}融入温馨卧室，{{style}}，暖色调，治愈氛围。", sortOrder: 21 },
  { name: "书房办公场景", description: "书桌收纳、台灯场景", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh3/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}置于现代书房，简洁桌面，{{scene}}，商务质感。", sortOrder: 22 },
  { name: "浴室洗漱场景", description: "洗漱用品浴室陈列", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh4/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}浴室洗漱台，大理石台面，{{color}}色调，清爽干净。", sortOrder: 23 },
  { name: "阳台绿植风", description: "阳台家居绿植氛围", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh5/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}阳台场景，绿植环绕，{{style}}，自然生活感。", sortOrder: 24 },
  { name: "玄关收纳", description: "玄关鞋架、挂钩场景", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh6/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}玄关收纳，极简设计，{{scene}}，明亮入户空间。", sortOrder: 25 },
  { name: "儿童房间场景", description: "儿童家具、玩具场景", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh7/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}儿童房间，彩色装饰，{{style}}，安全温馨。", sortOrder: 26 },
  { name: "白底图转场景", description: "白底商品转真实场景", category: "家居场景", coverUrl: "https://picsum.photos/seed/mh8/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "将{{product}}从白底融入真实家居场景，{{scene}}，自然阴影。", sortOrder: 27 },

  // 服饰模特
  { name: "服装模特街拍", description: "服装上身街拍风格", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf1/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}服装，时尚模特街拍，{{style}}，都市背景。", sortOrder: 30 },
  { name: "服装棚拍白底", description: "服装棚拍专业展示", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf2/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}服装，专业棚拍，纯白背景，模特全身展示。", sortOrder: 31 },
  { name: "鞋包搭配展示", description: "鞋包搭配生活方式", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf3/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}鞋包，模特搭配展示，{{scene}}，轻奢风格。", sortOrder: 32 },
  { name: "运动服饰", description: "运动服装动态展示", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf4/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}运动服饰，活力模特，健身房场景，{{style}}。", sortOrder: 33 },
  { name: "童装展示", description: "童装可爱展示", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf5/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}童装，儿童模特，明亮背景，{{style}}。", sortOrder: 34 },
  { name: "配饰特写", description: "帽子围巾配饰展示", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf6/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}配饰，模特特写，{{color}}色调，时尚杂志风。", sortOrder: 35 },
  { name: "服装模特", description: "通用服装模特模板", category: "服饰模特", coverUrl: "https://picsum.photos/seed/mf7/400/300", taskType: "model_image", workflowId: "model-image-workflow", promptContent: "{{product}}，专业电商模特图，{{style}}，突出版型。", sortOrder: 36 },

  // 食品摄影
  { name: "零食海报", description: "零食促销氛围图", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood1/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{product}}零食， appetizing 美食摄影，{{style}}，鲜艳色彩。", sortOrder: 40 },
  { name: "饮料特写", description: "饮料产品特写", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood2/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}饮料，冷凝水珠，{{color}}背景，清爽夏日。", sortOrder: 41 },
  { name: "烘焙甜品", description: "蛋糕甜品美食摄影", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood3/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}甜品，精致摆盘，{{style}}，暖色灯光。", sortOrder: 42 },
  { name: "生鲜果蔬", description: "新鲜果蔬展示", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood4/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}生鲜果蔬，水滴新鲜感，木质背景，自然光。", sortOrder: 43 },
  { name: "咖啡茶饮", description: "咖啡茶饮场景", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood5/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}咖啡茶饮，咖啡馆场景，{{scene}}，蒸汽细节。", sortOrder: 44 },
  { name: "坚果干货", description: "坚果干货包装展示", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood6/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}坚果，散落颗粒，{{style}}，健康食品广告。", sortOrder: 45 },
  { name: "方便食品", description: "速食、方便面场景", category: "食品摄影", coverUrl: "https://picsum.photos/seed/mfood7/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{product}}方便食品，热气腾腾，{{style}}，食欲激发。", sortOrder: 46 },

  // 详情页
  { name: "详情页设计", description: "通用电商详情页头图", category: "详情页", coverUrl: "https://picsum.photos/seed/md1/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}电商详情页头图，{{style}}，卖点突出，专业排版感。", sortOrder: 50 },
  { name: "主图优化", description: "商品主图优化增强", category: "详情页", coverUrl: "https://picsum.photos/seed/md2/400/600", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "优化{{product}}主图，纯白或场景背景，{{style}}，高点击率。", sortOrder: 51 },
  { name: "卖点拆解图", description: "产品卖点可视化", category: "详情页", coverUrl: "https://picsum.photos/seed/md3/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}卖点拆解，功能标注风格，{{style}}，清晰易读。", sortOrder: 52 },
  { name: "参数对比图", description: "产品参数对比展示", category: "详情页", coverUrl: "https://picsum.photos/seed/md4/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}参数对比图，专业信息图风格，{{color}}色调。", sortOrder: 53 },
  { name: "使用场景详情", description: "详情页使用场景模块", category: "详情页", coverUrl: "https://picsum.photos/seed/md5/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}使用场景，{{scene}}，生活方式，详情页模块。", sortOrder: 54 },
  { name: "品牌故事页", description: "品牌故事详情模块", category: "详情页", coverUrl: "https://picsum.photos/seed/md6/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}品牌故事，{{style}}，高端质感，情感连接。", sortOrder: 55 },
  { name: "尺寸规格图", description: "产品尺寸规格展示", category: "详情页", coverUrl: "https://picsum.photos/seed/md7/400/600", taskType: "detail_page", workflowId: "detail-page-workflow", promptContent: "{{product}}尺寸规格，清晰标注，简约信息图，{{color}}背景。", sortOrder: 56 },

  // 海报
  { name: "618大促海报", description: "618 节日促销海报", category: "海报", coverUrl: "https://picsum.photos/seed/mp1/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{festival}}大促海报，{{product}}为主角，{{style}}，醒目促销。", sortOrder: 60, isVip: true },
  { name: "双11狂欢海报", description: "双11 电商海报", category: "海报", coverUrl: "https://picsum.photos/seed/mp2/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "双11狂欢，{{product}}，{{style}}，红色促销氛围。", sortOrder: 61, isVip: true },
  { name: "新品上市海报", description: "新品发布宣传海报", category: "海报", coverUrl: "https://picsum.photos/seed/mp3/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{product}}新品上市，{{style}}，简约高端，留白设计。", sortOrder: 62 },
  { name: "限时秒杀海报", description: "秒杀活动海报", category: "海报", coverUrl: "https://picsum.photos/seed/mp4/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "限时秒杀，{{product}}，{{style}}，紧迫感设计。", sortOrder: 63 },
  { name: "品牌联名海报", description: "品牌联名宣传", category: "海报", coverUrl: "https://picsum.photos/seed/mp5/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{product}}品牌联名，{{style}}，潮流视觉。", sortOrder: 64 },
  { name: "满减活动海报", description: "满减优惠海报", category: "海报", coverUrl: "https://picsum.photos/seed/mp6/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "满减优惠，{{product}}，{{festival}}，促销标签。", sortOrder: 65 },
  { name: "直播预告海报", description: "直播带货预告", category: "海报", coverUrl: "https://picsum.photos/seed/mp7/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "直播预告，{{product}}，{{style}}，主播推荐风格。", sortOrder: 66 },

  // 短视频
  { name: "短视频封面", description: "短视频封面图设计", category: "短视频", coverUrl: "https://picsum.photos/seed/mv1/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}短视频封面，{{style}}，高对比，吸引点击。", sortOrder: 70 },
  { name: "商品旋转展示", description: "适合主图视频的旋转感", category: "短视频", coverUrl: "https://picsum.photos/seed/mv2/400/300", taskType: "product_video", workflowId: "video-workflow", promptContent: "{{product}}360度展示，纯白背景，产品旋转，电商视频。", sortOrder: 71 },
  { name: "开箱展示封面", description: "开箱视频封面", category: "短视频", coverUrl: "https://picsum.photos/seed/mv3/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}开箱瞬间，{{style}}，真实体验感。", sortOrder: 72 },
  { name: "场景推进封面", description: "场景推进镜头封面", category: "短视频", coverUrl: "https://picsum.photos/seed/mv4/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}场景推进，{{scene}}，电影感构图。", sortOrder: 73 },
  { name: "营销短视频", description: "促销氛围短视频封面", category: "短视频", coverUrl: "https://picsum.photos/seed/mv5/400/300", taskType: "poster", workflowId: "poster-workflow", promptContent: "{{product}}营销短视频，{{festival}}，动感促销。", sortOrder: 74 },
  { name: "产品细节放大", description: "细节特写视频封面", category: "短视频", coverUrl: "https://picsum.photos/seed/mv5b/400/300", taskType: "scene_image", workflowId: "scene-image-workflow", promptContent: "{{product}}细节放大，微距质感，{{style}}，工艺展示。", sortOrder: 75 },
];

export async function seedMarketplaceTemplates(prisma: PrismaClient): Promise<number> {
  let created = 0;

  for (const tpl of MARKETPLACE_TEMPLATES) {
    const existing = await prisma.template.findFirst({ where: { name: tpl.name } });
    if (existing) continue;

    const prompt = await prisma.promptTemplate.create({
      data: {
        name: `${tpl.name} Prompt`,
        content: tpl.promptContent,
        variables: ["product", "scene", "style", "color", "festival"],
      },
    });

    await prisma.template.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        coverUrl: tpl.coverUrl,
        workflowId: tpl.workflowId,
        taskType: tpl.taskType,
        promptId: prompt.id,
        isVip: tpl.isVip ?? false,
        enabled: true,
        sortOrder: tpl.sortOrder,
      },
    });

    created += 1;
  }

  return created;
}
