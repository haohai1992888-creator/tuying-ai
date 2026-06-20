import { prisma } from "@acs/database";
import { pointService } from "@acs/points";
import {
  getVideoPointCost,
  VIDEO_DURATIONS,
  VIDEO_ESTIMATED_SECONDS,
  VideoStatus,
  VideoTemplateType,
} from "@acs/shared";
import { videoWorkflow } from "./video-workflow";
import type { VideoGenerateInput, VideoTaskAdminDto, VideoTaskDto, VideoTemplateDto } from "./types";

export class VideoService {
  async listTemplates(): Promise<VideoTemplateDto[]> {
    const rows = await prisma.videoTemplate.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapTemplate);
  }

  async getTemplate(id: string): Promise<VideoTemplateDto | null> {
    const row = await prisma.videoTemplate.findUnique({ where: { id } });
    if (!row || !row.enabled) return null;
    return mapTemplate(row);
  }

  getDurations(): number[] {
    return [...VIDEO_DURATIONS];
  }

  getDurationCosts(): Record<number, number> {
    return Object.fromEntries(VIDEO_DURATIONS.map((d) => [d, getVideoPointCost(d)]));
  }

  async generate(input: VideoGenerateInput): Promise<VideoTaskDto> {
    const duration = input.duration ?? 5;
    if (!VIDEO_DURATIONS.includes(duration as 5 | 8 | 10)) {
      throw new Error("不支持的视频时长，请选择 5/8/10 秒");
    }

    const cost = getVideoPointCost(duration);
    const balance = await pointService.getBalance(input.userId);
    if (balance < cost) throw new Error("积分不足");

    const template = await prisma.videoTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template || !template.enabled) throw new Error("视频模板不存在或已下架");

    const route = await import("./video-router.js").then((m) =>
      m.routeVideoProvider({
        templateType: template.templateType as VideoTemplateType,
        duration,
        preferredProvider: input.preferredProvider,
      })
    );

    const task = await prisma.videoTask.create({
      data: {
        userId: input.userId,
        templateId: template.id,
        inputUrl: input.inputUrl,
        productName: input.productName ?? null,
        provider: route.provider,
        duration,
        cost,
        status: VideoStatus.PENDING,
        progress: 0,
      },
    });

    void videoWorkflow
      .execute({
        videoTaskId: task.id,
        userId: input.userId,
        inputUrl: input.inputUrl,
        templateType: template.templateType as VideoTemplateType,
        duration,
        productName: input.productName,
        preferredProvider: input.preferredProvider,
      })
      .catch((err) => console.error("[VideoService] workflow error:", err));

    return mapTask(task);
  }

  async getTask(userId: string, taskId: string): Promise<VideoTaskDto | null> {
    const task = await prisma.videoTask.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) return null;
    return mapTask(task);
  }

  async listAllAdmin(limit = 100): Promise<VideoTaskAdminDto[]> {
    const rows = await prisma.videoTask.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, phone: true, nickname: true } },
      },
    });

    return rows.map((row) => {
      const durationMs =
        row.completedAt && row.createdAt
          ? row.completedAt.getTime() - row.createdAt.getTime()
          : row.status === VideoStatus.PROCESSING
            ? Date.now() - row.createdAt.getTime()
            : null;

      const userLabel =
        row.user.nickname?.trim() ||
        row.user.email?.trim() ||
        row.user.phone?.trim() ||
        row.userId.slice(0, 8);

      return {
        ...mapTask(row),
        userLabel,
        durationMs,
      };
    });
  }
}

function mapTemplate(row: {
  id: string;
  name: string;
  description: string;
  templateType: string;
  coverUrl: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
}): VideoTemplateDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateType: row.templateType as VideoTemplateType,
    coverUrl: row.coverUrl,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapTask(row: {
  id: string;
  userId: string;
  templateId: string | null;
  inputUrl: string;
  productName: string | null;
  provider: string;
  duration: number;
  prompt: string | null;
  status: string;
  progress: number;
  cost: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): VideoTaskDto {
  return {
    id: row.id,
    userId: row.userId,
    templateId: row.templateId,
    inputUrl: row.inputUrl,
    productName: row.productName,
    provider: row.provider,
    duration: row.duration,
    prompt: row.prompt,
    status: row.status,
    progress: row.progress,
    cost: row.cost,
    videoUrl: row.videoUrl,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    estimatedSeconds: VIDEO_ESTIMATED_SECONDS[row.duration] ?? 30,
  };
}

export const videoService = new VideoService();
