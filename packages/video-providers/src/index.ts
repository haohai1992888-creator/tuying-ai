export * from "./types";
export { KlingProvider, VeoProvider, WanProvider } from "./mock/mock-providers";

import { VideoProviderId } from "@acs/shared";
import type { VideoProvider } from "./types";
import { KlingProvider, VeoProvider, WanProvider } from "./mock/mock-providers";

const klingProvider = new KlingProvider();
const veoProvider = new VeoProvider();
const wanProvider = new WanProvider();

const registry: Record<VideoProviderId, VideoProvider> = {
  [VideoProviderId.KLING]: klingProvider,
  [VideoProviderId.VEO]: veoProvider,
  [VideoProviderId.WAN]: wanProvider,
};

export function getVideoProvider(id: VideoProviderId): VideoProvider {
  return registry[id];
}

export function isValidVideoProvider(id: string): id is VideoProviderId {
  return id in registry;
}
