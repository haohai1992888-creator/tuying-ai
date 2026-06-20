import { prisma } from "../db";

export async function recordTemplateUsage(userId: string, templateId: string): Promise<void> {
  await prisma.$transaction([
    prisma.templateUsage.create({ data: { userId, templateId } }),
    prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    }),
    prisma.recentTemplate.upsert({
      where: { userId_templateId: { userId, templateId } },
      create: { userId, templateId },
      update: { usedAt: new Date() },
    }),
  ]);
}

export async function favoriteTemplate(userId: string, templateId: string): Promise<void> {
  await prisma.favoriteTemplate.upsert({
    where: { userId_templateId: { userId, templateId } },
    create: { userId, templateId },
    update: {},
  });
}

export async function unfavoriteTemplate(userId: string, templateId: string): Promise<void> {
  await prisma.favoriteTemplate.deleteMany({ where: { userId, templateId } });
}
