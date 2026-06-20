import { prisma } from "@acs/database";
import { AnalyticsTracker } from "@acs/analytics";
import { ANALYTICS_EVENT_TYPES, ANALYTICS_MODULES } from "@acs/shared";
import { pointService } from "@acs/points";
import {
  DEFAULT_DETAIL_BLOCKS,
  DetailBlockType,
  DetailTaskStatus,
  getPointCost,
  TaskStatus,
  TaskType,
} from "@acs/shared";
import { estimateModelCost } from "@acs/analytics";
import { saveGeneratedResult } from "@acs/files";
import { generateDetailBlock } from "./block-generator";
import { composeDetailLongImage } from "./detail-composer";
import { extractSellingPoints } from "./selling-point-extractor";

export interface DetailWorkflowInput {
  detailTaskId: string;
  userId: string;
  inputUrl: string;
  productName: string;
  sellingPoints?: string[];
  blockTypes?: DetailBlockType[];
  platform?: string;
  category?: string;
  preferredProvider?: string;
}

/**
 * DetailWorkflow — 商品图 → OCR/卖点 → 多模块生成 → 长图拼接 → OSS
 */
export class DetailWorkflow {
  async execute(input: DetailWorkflowInput): Promise<void> {
    const task = await prisma.detailTask.findUnique({
      where: { id: input.detailTaskId },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });
    if (!task) throw new Error("详情页任务不存在");

    await prisma.detailTask.update({
      where: { id: input.detailTaskId },
      data: { status: DetailTaskStatus.PROCESSING },
    });

    try {
      const sellingPoints =
        input.sellingPoints?.length
          ? input.sellingPoints
          : extractSellingPoints({
              productName: input.productName,
              userPoints: (task.sellingPoints as string[] | null) ?? undefined,
            });

      await prisma.detailTask.update({
        where: { id: input.detailTaskId },
        data: { sellingPoints: sellingPoints as object },
      });

      const blocks = task.blocks.length
        ? task.blocks
        : await this.createBlocks(input.detailTaskId, input.blockTypes ?? DEFAULT_DETAIL_BLOCKS);

      for (const block of blocks) {
        await prisma.detailBlock.update({
          where: { id: block.id },
          data: { status: TaskStatus.PROCESSING },
        });

        try {
          const result = await generateDetailBlock({
            userId: input.userId,
            detailTaskId: input.detailTaskId,
            blockId: block.id,
            blockType: block.blockType as DetailBlockType,
            productName: input.productName,
            sellingPoints,
            inputUrl: input.inputUrl,
            category: input.category,
            preferredProvider: input.preferredProvider,
          });

          await prisma.detailBlock.update({
            where: { id: block.id },
            data: {
              status: TaskStatus.SUCCESS,
              imageUrl: result.imageUrl,
              prompt: result.prompt,
              provider: result.provider,
            },
          });
        } catch (error) {
          await prisma.detailBlock.update({
            where: { id: block.id },
            data: {
              status: TaskStatus.FAILED,
              error: error instanceof Error ? error.message : "模块生成失败",
            },
          });
        }
      }

      const updatedBlocks = await prisma.detailBlock.findMany({
        where: { detailTaskId: input.detailTaskId, status: TaskStatus.SUCCESS },
        orderBy: { sortOrder: "asc" },
      });

      const composeResult = await composeDetailLongImage({
        blocks: updatedBlocks.map((b) => ({
          imageUrl: b.imageUrl!,
          blockType: b.blockType,
        })),
        platform: input.platform ?? task.platform,
        productName: input.productName,
      });

      const saved = await saveGeneratedResult({
        userId: input.userId,
        buffer: composeResult.buffer,
        fileName: `detail_long_${input.detailTaskId}.png`,
      });

      const cost = task.cost > 0 ? task.cost : getPointCost(TaskType.DETAIL_PAGE);
      await pointService.deductPoints(input.userId, cost, `详情页生成 ${input.productName}`);

      AnalyticsTracker.track({
        userId: input.userId,
        eventType: ANALYTICS_EVENT_TYPES.DETAIL_GENERATE,
        module: ANALYTICS_MODULES.DETAIL,
        action: "generate",
        revenue: cost * 0.01,
        cost: estimateModelCost("seedream") * 6,
        metadata: { productName: input.productName, detailTaskId: input.detailTaskId },
      });

      await prisma.detailTask.update({
        where: { id: input.detailTaskId },
        data: {
          status: DetailTaskStatus.SUCCESS,
          resultUrl: saved.publicUrl,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "详情页生成失败";
      await prisma.detailTask.update({
        where: { id: input.detailTaskId },
        data: {
          status: DetailTaskStatus.FAILED,
          error: message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async createBlocks(detailTaskId: string, blockTypes: DetailBlockType[]) {
    const created = [];
    for (let i = 0; i < blockTypes.length; i++) {
      const block = await prisma.detailBlock.create({
        data: {
          detailTaskId,
          blockType: blockTypes[i],
          sortOrder: i,
          status: TaskStatus.PENDING,
        },
      });
      created.push(block);
    }
    return created;
  }
}

export const detailWorkflow = new DetailWorkflow();
