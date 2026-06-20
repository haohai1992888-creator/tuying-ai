import { PrismaClient } from "@prisma/client";

import bcrypt from "bcryptjs";
import { seedMarketplaceTemplates } from "./marketplace-seed";
import { seedDetailTemplates } from "./detail-templates-seed";



const prisma = new PrismaClient();



const DEFAULT_PACKAGES = [
  { name: "100积分套餐", points: 100, price: 9.9, sortOrder: 1 },
  { name: "300积分套餐", points: 300, price: 29, sortOrder: 2 },
  { name: "1000积分套餐", points: 1000, price: 79, sortOrder: 3 },
  { name: "3000积分套餐", points: 3000, price: 199, sortOrder: 4 },
];

const SUBSCRIPTION_PLANS = [
  { name: "VIP 会员", planCode: "VIP", price: 29, points: 1000, duration: 30, sortOrder: 1 },
  { name: "企业版会员", planCode: "ENTERPRISE", price: 99, points: 5000, duration: 30, sortOrder: 2 },
];



async function main() {

  const adminEmail = "admin@acs.local";

  const adminPassword = "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);



  const admin = await prisma.user.upsert({

    where: { email: adminEmail },

    update: {},

    create: {

      email: adminEmail,

      password: passwordHash,

      nickname: "管理员",

      role: "ADMIN",
      plan: "ENTERPRISE",
      status: "ACTIVE",

      points: 9999,

    },

  });



  for (const pkg of DEFAULT_PACKAGES) {

    const existing = await prisma.pointPackage.findFirst({

      where: { points: pkg.points, price: pkg.price },

    });

    if (!existing) {

      await prisma.pointPackage.create({

        data: {

          name: pkg.name,

          points: pkg.points,

          price: pkg.price,

          enabled: true,

          sortOrder: pkg.sortOrder,

        },

      });

    }

  }



  for (const pkg of SUBSCRIPTION_PLANS) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { planCode: pkg.planCode },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({
        data: {
          name: pkg.name,
          planCode: pkg.planCode,
          price: pkg.price,
          points: pkg.points,
          duration: pkg.duration,
          enabled: true,
          sortOrder: pkg.sortOrder,
        },
      });
    }
  }

  const appVersion = await prisma.appVersion.findFirst({
    where: { version: "1.0.0", channel: "STABLE" },
  });
  if (!appVersion) {
    const v100 = await prisma.appVersion.create({
      data: {
        version: "1.0.0",
        title: "ACS Desktop 首发版",
        description: "AI 电商工作室桌面客户端初始版本",
        downloadUrl: "https://releases.example.com/acs/1.0.0/setup.exe",
        downloadUrlWin: "https://releases.example.com/acs/1.0.0/ACS-Setup-1.0.0.exe",
        downloadUrlMac: "https://releases.example.com/acs/1.0.0/ACS-1.0.0.dmg",
        published: true,
        channel: "STABLE",
        pubDate: new Date("2026-01-01"),
      },
    });
    await prisma.releaseNote.createMany({
      data: [
        { versionId: v100.id, version: "1.0.0", content: "Workflow 任务系统" },
        { versionId: v100.id, version: "1.0.0", content: "多模型 AI 生成" },
      ],
    });
  }

  const appVersion110 = await prisma.appVersion.findFirst({
    where: { version: "1.1.0", channel: "STABLE" },
  });
  if (!appVersion110) {
    const v110 = await prisma.appVersion.create({
      data: {
        version: "1.1.0",
        title: "模板市场",
        description: "新增模板市场、支付积分系统、Batch Engine",
        downloadUrl: "https://releases.example.com/acs/1.1.0/setup.exe",
        downloadUrlWin: "https://releases.example.com/acs/1.1.0/ACS-Setup-1.1.0.exe",
        downloadUrlMac: "https://releases.example.com/acs/1.1.0/ACS-1.0.0.dmg",
        published: true,
        channel: "STABLE",
        pubDate: new Date("2026-06-20"),
      },
    });
    await prisma.releaseNote.createMany({
      data: [
        { versionId: v110.id, version: "1.1.0", content: "模板市场" },
        { versionId: v110.id, version: "1.1.0", content: "新模型路由" },
        { versionId: v110.id, version: "1.1.0", content: "性能优化" },
      ],
    });
    await prisma.versionRollout.upsert({
      where: { version_channel: { version: "1.1.0", channel: "STABLE" } },
      create: { version: "1.1.0", percent: 100, force: false, channel: "STABLE" },
      update: { percent: 100 },
    });
  }

  const SEED_TEMPLATES = [
    {
      name: "现代厨房场景",
      description: "适合厨房用品、小家电的商品场景图",
      category: "厨房用品",
      coverUrl: "https://picsum.photos/seed/kitchen/400/300",
      taskType: "scene_image",
      workflowId: "scene-image-workflow",
      promptContent:
        "将{{product}}放置于现代厨房台面，{{scene}}，自然光，高端电商摄影，突出商品主体，商业广告风格。",
      isVip: false,
      sortOrder: 1,
    },
    {
      name: "温馨家居风",
      description: "家居用品氛围场景",
      category: "家居用品",
      coverUrl: "https://picsum.photos/seed/home/400/300",
      taskType: "scene_image",
      workflowId: "scene-image-workflow",
      promptContent: "将{{product}}融入温馨家居场景，{{style}}，柔和光线，生活方式摄影。",
      isVip: false,
      sortOrder: 2,
    },
    {
      name: "618 节日海报",
      description: "大促节日营销海报",
      category: "节日营销",
      coverUrl: "https://picsum.photos/seed/festival/400/300",
      taskType: "poster",
      workflowId: "poster-workflow",
      promptContent: "{{festival}}大促海报，{{product}}为主角，{{style}}，醒目促销氛围。",
      isVip: true,
      sortOrder: 3,
    },
    {
      name: "美妆质感场景",
      description: "美妆护肤高端展示",
      category: "美妆护肤",
      coverUrl: "https://picsum.photos/seed/beauty/400/300",
      taskType: "scene_image",
      workflowId: "scene-image-workflow",
      promptContent: "将{{product}}置于大理石台面，{{color}}色调，柔光，高端美妆广告摄影。",
      isVip: true,
      sortOrder: 4,
    },
  ];

  for (const tpl of SEED_TEMPLATES) {
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
        isVip: tpl.isVip,
        enabled: true,
        sortOrder: tpl.sortOrder,
      },
    });
  }

  const SEED_DETAIL_TEMPLATES = [
    {
      name: "厨房用品详情页",
      description: "刀架、厨具等厨房用品标准详情页",
      category: "厨房用品",
      coverUrl: "https://picsum.photos/seed/detail-kitchen/400/600",
      blockTypes: ["BANNER", "FEATURE", "SCENE", "SIZE", "PARAMETER", "DETAIL"],
      sortOrder: 1,
    },
    {
      name: "家居用品详情页",
      description: "收纳、装饰等家居产品详情页",
      category: "家居用品",
      coverUrl: "https://picsum.photos/seed/detail-home/400/600",
      blockTypes: ["BANNER", "FEATURE", "SCENE", "DETAIL", "BRAND", "REASON"],
      sortOrder: 2,
    },
    {
      name: "服装详情页",
      description: "服饰鞋包详情页模板",
      category: "服装",
      coverUrl: "https://picsum.photos/seed/detail-cloth/400/600",
      blockTypes: ["BANNER", "FEATURE", "SIZE", "DETAIL", "SCENE", "REASON"],
      sortOrder: 3,
    },
    {
      name: "美妆详情页",
      description: "护肤彩妆详情页模板",
      category: "美妆",
      coverUrl: "https://picsum.photos/seed/detail-beauty/400/600",
      blockTypes: ["BANNER", "FEATURE", "PARAMETER", "DETAIL", "BRAND", "REASON"],
      sortOrder: 4,
    },
    {
      name: "宠物用品详情页",
      description: "宠物窝、玩具等详情页",
      category: "宠物",
      coverUrl: "https://picsum.photos/seed/detail-pet/400/600",
      blockTypes: ["BANNER", "FEATURE", "SCENE", "PARAMETER", "DETAIL", "REASON"],
      sortOrder: 5,
    },
  ];

  for (const tpl of SEED_DETAIL_TEMPLATES) {
    const existing = await prisma.detailTemplate.findFirst({ where: { name: tpl.name } });
    if (existing) continue;
    await prisma.detailTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        coverUrl: tpl.coverUrl,
        blockTypes: tpl.blockTypes,
        enabled: true,
        sortOrder: tpl.sortOrder,
      },
    });
  }

  const SEED_VIDEO_TEMPLATES = [
    {
      name: "商品旋转展示",
      description: "360度旋转展示商品，适合主图视频",
      templateType: "PRODUCT_ROTATE" as const,
      coverUrl: "https://picsum.photos/seed/video-rotate/400/300",
      sortOrder: 1,
    },
    {
      name: "场景推进",
      description: "生活方式场景镜头推进",
      templateType: "SCENE_PUSH" as const,
      coverUrl: "https://picsum.photos/seed/video-scene/400/300",
      sortOrder: 2,
    },
    {
      name: "镜头拉近",
      description: "缓慢拉近突出产品细节",
      templateType: "ZOOM_IN" as const,
      coverUrl: "https://picsum.photos/seed/video-zoom/400/300",
      sortOrder: 3,
    },
    {
      name: "开箱展示",
      description: "真实开箱体验视频",
      templateType: "UNBOXING" as const,
      coverUrl: "https://picsum.photos/seed/video-unbox/400/300",
      sortOrder: 4,
    },
    {
      name: "营销广告",
      description: "促销氛围营销短视频",
      templateType: "MARKETING" as const,
      coverUrl: "https://picsum.photos/seed/video-marketing/400/300",
      sortOrder: 5,
    },
  ];

  for (const tpl of SEED_VIDEO_TEMPLATES) {
    const existing = await prisma.videoTemplate.findFirst({ where: { name: tpl.name } });
    if (existing) continue;
    await prisma.videoTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        templateType: tpl.templateType,
        coverUrl: tpl.coverUrl,
        enabled: true,
        sortOrder: tpl.sortOrder,
      },
    });
  }

  console.log("[seed] Admin user:", admin.email, "password:", adminPassword);
  console.log("[seed] Point packages seeded:", DEFAULT_PACKAGES.length);
  console.log("[seed] Subscription plans seeded:", SUBSCRIPTION_PLANS.length);
  console.log("[seed] Templates seeded:", SEED_TEMPLATES.length);
  const marketplaceCreated = await seedMarketplaceTemplates(prisma);
  console.log("[seed] Marketplace templates created:", marketplaceCreated);
  const detailTemplatesCreated = await seedDetailTemplates(prisma);
  console.log("[seed] Detail templates created:", detailTemplatesCreated);
  console.log("[seed] Detail templates seeded:", SEED_DETAIL_TEMPLATES.length);
  console.log("[seed] Video templates seeded:", SEED_VIDEO_TEMPLATES.length);

  const apiBase = process.env.API_PUBLIC_BASE ?? process.env.PUBLIC_API_URL ?? "http://localhost:3001";
  const downloadBase = process.env.DOWNLOAD_BASE_URL?.trim() || `${apiBase}/download`;
  const releaseVersion = "1.0.0";

  await prisma.appVersion.upsert({
    where: { version_channel: { version: releaseVersion, channel: "STABLE" } },
    update: {
      downloadUrl: `${downloadBase}/windows/AI-Commerce-Setup.exe`,
      downloadUrlWin: `${downloadBase}/windows/AI-Commerce-Setup.exe`,
      downloadUrlMac: `${downloadBase}/mac/AI-Commerce.dmg`,
      published: true,
    },
    create: {
      version: releaseVersion,
      title: "AI Commerce Desktop",
      description: "Windows 64 位 · macOS Universal",
      downloadUrl: `${downloadBase}/windows/AI-Commerce-Setup.exe`,
      downloadUrlWin: `${downloadBase}/windows/AI-Commerce-Setup.exe`,
      downloadUrlMac: `${downloadBase}/mac/AI-Commerce.dmg`,
      channel: "STABLE",
      published: true,
      pubDate: new Date(),
    },
  });
  console.log("[seed] AppVersion", releaseVersion, "download URLs ->", downloadBase);

  await prisma.inviteCode.upsert({
    where: { code: "BETA2026" },
    update: {},
    create: {
      code: "BETA2026",
      maxCount: 20,
      expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    },
  });
  console.log("[seed] Invite code BETA2026 ready (max 20)");

  const now = new Date();
  const end = new Date(now.getTime() + 90 * 86400000);
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { title: "Beta 内测欢迎" },
  });
  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: "Beta 内测欢迎",
        content: "欢迎加入 AI Commerce Studio 内测！遇到问题可通过生成失败弹窗提交反馈。",
        startAt: now,
        endAt: end,
      },
    });
    console.log("[seed] Beta announcement created");
  }

}



main()

  .catch((e) => {

    console.error(e);

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });

