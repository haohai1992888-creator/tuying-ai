import type { VideoTemplateType } from "@acs/shared";

export interface VideoTemplateDto {
  id: string;
  name: string;
  description: string;
  templateType: VideoTemplateType;
  coverUrl: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface VideoTaskDto {
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
  createdAt: string;
  completedAt: string | null;
  estimatedSeconds?: number;
  userLabel?: string;
  durationMs?: number | null;
}

export interface VideoGenerateInput {
  userId: string;
  inputUrl: string;
  templateId: string;
  duration?: number;
  productName?: string;
  preferredProvider?: string;
}

export interface VideoTaskAdminDto extends VideoTaskDto {
  userLabel: string;
  durationMs: number | null;
}
