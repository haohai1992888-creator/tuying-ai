import { getCurrentVersion, updateService, type UpdateInfo } from "./services/updateService";
import { getDeviceId } from "./store/update";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
}

export async function checkUpdate(): Promise<UpdateInfo | null> {
  return updateService.checkUpdate();
}

export async function downloadAndInstallUpdate(
  info: UpdateInfo,
  onProgress?: (pct: number) => void
): Promise<"tauri" | "browser"> {
  if (isTauriRuntime()) {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update?.available) {
        await updateService.installUpdate(info, onProgress);
        return "browser";
      }

      await update.downloadAndInstall((event) => {
        if (event.event === "Progress" && event.data.chunkLength) {
          onProgress?.(Math.min(99, (event.data.chunkLength % 100) + 1));
        }
      });

      onProgress?.(100);
      return "tauri";
    } catch {
      await updateService.installUpdate(info, onProgress);
      return "browser";
    }
  }

  await updateService.installUpdate(info, onProgress);
  return "browser";
}

export async function restartAfterUpdate(mode: "tauri" | "browser"): Promise<void> {
  if (mode === "tauri" && isTauriRuntime()) {
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
    return;
  }
  updateService.restartApp();
}

export { getCurrentVersion, getDeviceId };
