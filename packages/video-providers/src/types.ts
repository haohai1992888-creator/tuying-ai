import { VideoProviderId } from "@acs/shared";

export interface VideoGenerateInput {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface VideoGenerateOutput {
  videoUrl: string;
  provider: VideoProviderId;
  jobId?: string;
  mock?: boolean;
  duration?: number;
}

export interface ImageToVideoInput {
  imageUrl: string;
  prompt?: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface VideoProvider {
  readonly id: VideoProviderId;
  generate(input: VideoGenerateInput): Promise<VideoGenerateOutput>;
  imageToVideo(input: ImageToVideoInput): Promise<VideoGenerateOutput>;
}
