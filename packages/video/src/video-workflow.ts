import { prisma } from "@acs/database";
import { AnalyticsTracker } from "@acs/analytics";
import { ANALYTICS_EVENT_TYPES, ANALYTICS_MODULES } from "@acs/shared";
import { buildUserStoragePath } from "@acs/shared";
import { getStorageProvider } from "@acs/storage";
import { getVideoProvider } from "@acs/video-providers";
import { modelUsageService } from "@acs/router";
import { pointService } from "@acs/points";
import {
  getVideoPointCost,
  UserPlan,
  UserRole,
  VideoProviderId,
  VideoStatus,
  VideoTemplateType,
  VIDEO_ESTIMATED_SECONDS,
} from "@acs/shared";
import { estimateModelCost } from "@acs/analytics";
import { randomUUID } from "node:crypto";
import { buildVideoPrompt } from "./video-prompt-builder";
import { getVideoFailoverChain, routeVideoProvider } from "./video-router";

export interface VideoWorkflowInput {
  videoTaskId: string;
  userId: string;
  inputUrl: string;
  templateType: VideoTemplateType;
  duration: number;
  productName?: string;
  preferredProvider?: string;
}

/** 最小有效 MP4（用于 mock 输出） */
function createMockMp4Buffer(durationSec: number): Buffer {
  const brand = Buffer.from("mock-mp4-acs-video-engine");
  const meta = Buffer.from(JSON.stringify({ duration: durationSec, ts: Date.now() }));
  return Buffer.concat([brand, meta]);
}

async function saveVideoToOss(userId: string, buffer: Buffer, fileName: string): Promise<string> {
  const storage = getStorageProvider();
  const storagePath = buildUserStoragePath("results", userId, fileName);
  return storage.upload(buffer, storagePath, "video/mp4");
}

async function updateProgress(videoTaskId: string, progress: number): Promise<void> {
  await prisma.videoTask.update({
    where: { id: videoTaskId },
    data: { progress },
  });
}

/**
 * VideoWorkflow — 商品图 → Prompt → Video Router → Provider → OSS → 扣积分
 */
export class VideoWorkflow {
  async execute(input: VideoWorkflowInput): Promise<void> {
    const startedAt = Date.now();

    await prisma.videoTask.update({
      where: { id: input.videoTaskId },
      data: { status: VideoStatus.PROCESSING, progress: 5 },
    });

    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { plan: true, role: true, points: true },
      });

      const route = routeVideoProvider({
        templateType: input.templateType,
        duration: input.duration,
        userPlan: user?.plan as UserPlan | undefined,
        userRole: user?.role as UserRole | undefined,
        userBalance: user?.points,
        preferredProvider: input.preferredProvider,
      });

      const prompt = buildVideoPrompt({
        templateType: input.templateType,
        productName: input.productName,
        duration: input.duration,
      });

      await prisma.videoTask.update({
        where: { id: input.videoTaskId },
        data: { provider: route.provider, prompt, cost: route.cost },
      });

      await updateProgress(input.videoTaskId, 15);

      const chain = getVideoFailoverChain(route.provider);
      let lastError: Error | null = null;
      let videoUrl: string | null = null;
      let usedProvider = route.provider;

      for (const providerId of chain) {
        const genStarted = Date.now();
        try {
          await updateProgress(input.videoTaskId, 30);
          const provider = getVideoProvider(providerId);
          const result = await provider.imageToVideo({
            imageUrl: input.inputUrl,
            prompt,
            duration: input.duration,
            aspectRatio: "9:16",
          });

          await updateProgress(input.videoTaskId, 70);

          let buffer: Buffer;
          if (result.videoUrl.startsWith("mock://") || result.mock) {
            buffer = createMockMp4Buffer(input.duration);
          } else {
            const res = await fetch(result.videoUrl);
            if (!res.ok) throw new Error("无法下载生成视频");
            buffer = Buffer.from(await res.arrayBuffer());
          }

          videoUrl = await saveVideoToOss(
            input.userId,
            buffer,
            `video_${input.videoTaskId}_${randomUUID()}.mp4`
          );
          usedProvider = providerId;

          void modelUsageService.record({
            provider: providerId,
            taskType: "product_video",
            success: true,
            duration: Date.now() - genStarted,
            taskId: input.videoTaskId,
            userId: input.userId,
            cost: route.cost,
          });

          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          void modelUsageService.record({
            provider: providerId,
            taskType: "product_video",
            success: false,
            duration: Date.now() - genStarted,
            taskId: input.videoTaskId,
            userId: input.userId,
            cost: 0,
          });
        }
      }

      if (!videoUrl) {
        throw lastError ?? new Error("所有视频 Provider 均失败");
      }

      await updateProgress(input.videoTaskId, 90);

      await pointService.deductPoints(
        input.userId,
        route.cost,
        `商品视频 ${input.duration}秒 (${usedProvider})`
      );

      AnalyticsTracker.track({
        userId: input.userId,
        eventType: ANALYTICS_EVENT_TYPES.VIDEO_GENERATE,
        module: ANALYTICS_MODULES.VIDEO,
        action: "generate",
        revenue: route.cost * 0.01,
        cost: estimateModelCost(usedProvider),
        metadata: {
          duration: input.duration,
          provider: usedProvider,
          videoTaskId: input.videoTaskId,
        },
      });

      await prisma.videoTask.update({
        where: { id: input.videoTaskId },
        data: {
          status: VideoStatus.SUCCESS,
          progress: 100,
          videoUrl,
          provider: usedProvider,
          completedAt: new Date(),
        },
      });

      void startedAt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "视频生成失败";
      await prisma.videoTask.update({
        where: { id: input.videoTaskId },
        data: {
          status: VideoStatus.FAILED,
          error: message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
}

export const videoWorkflow = new VideoWorkflow();
