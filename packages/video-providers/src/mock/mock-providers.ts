import { VideoProviderId } from "@acs/shared";
import type {
  ImageToVideoInput,
  VideoGenerateInput,
  VideoGenerateOutput,
  VideoProvider,
} from "../types";

abstract class MockVideoProvider implements VideoProvider {
  abstract readonly id: VideoProviderId;

  async generate(input: VideoGenerateInput): Promise<VideoGenerateOutput> {
    return {
      videoUrl: `mock://${this.id}/generate/${Date.now()}.mp4`,
      provider: this.id,
      jobId: `mock-${Date.now()}`,
      mock: true,
      duration: input.duration ?? 5,
    };
  }

  async imageToVideo(input: ImageToVideoInput): Promise<VideoGenerateOutput> {
    return {
      videoUrl: `mock://${this.id}/i2v/${Date.now()}.mp4`,
      provider: this.id,
      jobId: `mock-i2v-${Date.now()}`,
      mock: true,
      duration: input.duration ?? 5,
    };
  }
}

export class KlingProvider extends MockVideoProvider {
  readonly id = VideoProviderId.KLING;
}

export class VeoProvider extends MockVideoProvider {
  readonly id = VideoProviderId.VEO;
}

export class WanProvider extends MockVideoProvider {
  readonly id = VideoProviderId.WAN;
}
