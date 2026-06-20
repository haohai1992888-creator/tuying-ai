import { prisma } from "@acs/database";
import { pointService } from "@acs/points";
import {
  DEFAULT_DETAIL_BLOCKS,
  DETAIL_CATEGORIES,
  DetailBlockType,
  DetailTaskStatus,
  getPointCost,
  TaskStatus,
  TaskType,
} from "@acs/shared";
import { composeDetailLongImage } from "./detail-composer";
import { generateDetailBlock } from "./block-generator";
import { detailWorkflow } from "./detail-workflow";
import { extractSellingPoints } from "./selling-point-extractor";
import { saveGeneratedResult } from "@acs/files";
import type {
  DetailGenerateInput,
  DetailTaskDto,
  DetailTemplateDto,
  SellingPointExtractInput,
} from "./types";

export class DetailService {
  listCategories(): string[] {
    return [...DETAIL_CATEGORIES];
  }

  async listTemplates(category?: string): Promise<DetailTemplateDto[]> {
    const rows = await prisma.detailTemplate.findMany({
      where: {
        enabled: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapTemplate);
  }

  async getTemplate(id: string): Promise<DetailTemplateDto | null> {
    const row = await prisma.detailTemplate.findUnique({ where: { id } });
    if (!row || !row.enabled) return null;
    return mapTemplate(row);
  }

  extractSellingPoints(input: SellingPointExtractInput): string[] {
    return extractSellingPoints(input);
  }

  async generate(input: DetailGenerateInput): Promise<DetailTaskDto> {
    const cost = input.cost ?? getPointCost(TaskType.DETAIL_PAGE);
    const balance = await pointService.getBalance(input.userId);
    if (balance < cost) throw new Error("积分不足");

    let blockTypes = input.blockTypes ?? DEFAULT_DETAIL_BLOCKS;
    let category: string | undefined;

    if (input.templateId) {
      const template = await prisma.detailTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (!template || !template.enabled) throw new Error("模板不存在或已下架");
      blockTypes = input.blockTypes ?? ((template.blockTypes as DetailBlockType[]) ?? DEFAULT_DETAIL_BLOCKS);
      category = template.category;
    }

    const sellingPoints =
      input.sellingPoints?.length
        ? input.sellingPoints
        : extractSellingPoints({ productName: input.productName });

    const task = await prisma.detailTask.create({
      data: {
        userId: input.userId,
        templateId: input.templateId ?? null,
        productName: input.productName,
        inputUrl: input.inputUrl,
        platform: (input.platform as "TAOBAO") ?? "TAOBAO",
        sellingPoints: sellingPoints as object,
        cost,
        status: DetailTaskStatus.PENDING,
        blocks: {
          create: blockTypes.map((blockType, i) => ({
            blockType,
            sortOrder: i,
            status: TaskStatus.PENDING,
          })),
        },
      },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });

    void detailWorkflow
      .execute({
        detailTaskId: task.id,
        userId: input.userId,
        inputUrl: input.inputUrl,
        productName: input.productName,
        sellingPoints,
        blockTypes,
        platform: input.platform ?? task.platform,
        category,
        preferredProvider: input.preferredProvider,
      })
      .catch((err) => console.error("[DetailService] workflow error:", err));

    return mapTask(task);
  }

  async getTask(userId: string, taskId: string): Promise<DetailTaskDto | null> {
    const task = await prisma.detailTask.findFirst({
      where: { id: taskId, userId },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
    if (!task) return null;
    return mapTask(task);
  }

  async regenerateBlock(userId: string, taskId: string, blockId: string): Promise<DetailTaskDto> {
    const task = await prisma.detailTask.findFirst({
      where: { id: taskId, userId },
      include: { blocks: true, template: true },
    });
    if (!task) throw new Error("任务不存在");

    const block = task.blocks.find((b) => b.id === blockId);
    if (!block) throw new Error("模块不存在");

    const sellingPoints = (task.sellingPoints as string[] | null) ?? [];

    await prisma.detailBlock.update({
      where: { id: blockId },
      data: { status: TaskStatus.PROCESSING },
    });

    const result = await generateDetailBlock({
      userId,
      detailTaskId: taskId,
      blockId,
      blockType: block.blockType as DetailBlockType,
      productName: task.productName,
      sellingPoints,
      inputUrl: task.inputUrl,
      category: task.template?.category,
    });

    await prisma.detailBlock.update({
      where: { id: blockId },
      data: {
        status: TaskStatus.SUCCESS,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        provider: result.provider,
        error: null,
      },
    });

    const updated = await this.recomposeTask(userId, taskId);
    return updated;
  }

  async recomposeTask(userId: string, taskId: string): Promise<DetailTaskDto> {
    const task = await prisma.detailTask.findFirst({
      where: { id: taskId, userId },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
    if (!task) throw new Error("任务不存在");

    const successBlocks = task.blocks.filter((b) => b.status === TaskStatus.SUCCESS && b.imageUrl);
    if (successBlocks.length === 0) throw new Error("没有可拼接的模块");

    const composeResult = await composeDetailLongImage({
      blocks: successBlocks.map((b) => ({ imageUrl: b.imageUrl!, blockType: b.blockType })),
      platform: task.platform,
      productName: task.productName,
    });

    const saved = await saveGeneratedResult({
      userId,
      buffer: composeResult.buffer,
      fileName: `detail_long_${taskId}_${Date.now()}.png`,
    });

    const updated = await prisma.detailTask.update({
      where: { id: taskId },
      data: { resultUrl: saved.publicUrl },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });

    return mapTask(updated);
  }

  async listAllAdmin(limit = 50): Promise<DetailTaskDto[]> {
    const rows = await prisma.detailTask.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
    return rows.map(mapTask);
  }
}

function mapTemplate(row: {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  blockTypes: unknown;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
}): DetailTemplateDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    coverUrl: row.coverUrl,
    blockTypes: (row.blockTypes as DetailBlockType[]) ?? DEFAULT_DETAIL_BLOCKS,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapTask(row: {
  id: string;
  userId: string;
  templateId: string | null;
  productName: string;
  inputUrl: string;
  platform: string;
  sellingPoints: unknown;
  status: string;
  resultUrl: string | null;
  cost: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
  blocks?: Array<{
    id: string;
    detailTaskId: string;
    blockType: string;
    sortOrder: number;
    status: string;
    imageUrl: string | null;
    prompt: string | null;
    provider: string | null;
    error: string | null;
    createdAt: Date;
  }>;
}): DetailTaskDto {
  return {
    id: row.id,
    userId: row.userId,
    templateId: row.templateId,
    productName: row.productName,
    inputUrl: row.inputUrl,
    platform: row.platform,
    sellingPoints: (row.sellingPoints as string[] | null) ?? [],
    status: row.status,
    resultUrl: row.resultUrl,
    cost: row.cost,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    blocks: row.blocks?.map((b) => ({
      id: b.id,
      detailTaskId: b.detailTaskId,
      blockType: b.blockType as DetailBlockType,
      sortOrder: b.sortOrder,
      status: b.status,
      imageUrl: b.imageUrl,
      prompt: b.prompt,
      provider: b.provider,
      error: b.error,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

export const detailService = new DetailService();
