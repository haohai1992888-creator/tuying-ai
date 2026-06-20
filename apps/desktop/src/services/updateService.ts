import { getAccessToken } from "./api";
import { getDeviceId, getReleaseChannel } from "../store/update";
import type { DesktopUpdateJson } from "../types/download";

const UPDATE_API_BASE =
  import.meta.env.VITE_UPDATE_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

const UPDATE_JSON_URL =
  import.meta.env.VITE_UPDATE_JSON_URL ??
  `${UPDATE_API_BASE}/update.json`;

const DOWNLOAD_BASE =
  import.meta.env.VITE_DOWNLOAD_BASE_URL ??
  `${UPDATE_API_BASE}/download`;

export interface UpdateInfo {
  version: string;
  title: string;
  description: string;
  forceUpdate: boolean;
  downloadUrl: string;
  hasUpdate: boolean;
  releaseNotes?: string[];
  pubDate?: string;
  rolloutPercent?: number;
}

export function getCurrentVersion(): string {
  return __APP_VERSION__;
}

export function detectPlatform(): "WINDOWS" | "MACOS" | "LINUX" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "WINDOWS";
  if (ua.includes("mac")) return "MACOS";
  return "LINUX";
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/i, "").split(".").map((n) => Number(n) || 0);
}

function isNewerVersion(current: string, latest: string): boolean {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
}

function normalizeNotes(notes: unknown): string[] {
  if (typeof notes === "string") return [notes];
  if (Array.isArray(notes)) return notes.map(String);
  return [];
}

function normalizeUpdatePayload(raw: Record<string, unknown>): DesktopUpdateJson {
  const version = String(raw.version ?? "0.0.0");
  const noteLines = normalizeNotes(raw.notes);
  const base = DOWNLOAD_BASE.replace(/\/$/, "");

  return {
    version,
    pub_date: String(raw.pub_date ?? new Date().toISOString()),
    title: String(raw.title ?? `AI Commerce Desktop v${version}`),
    description: String(raw.description ?? noteLines[0] ?? "版本更新"),
    notes: noteLines.length ? noteLines : ["版本更新"],
    releaseNotes: [{ version, items: noteLines.length ? noteLines : ["版本更新"] }],
    downloads: (raw.downloads as DesktopUpdateJson["downloads"]) ?? {
      windows: {
        url: `${base}/windows/AI-Commerce-Setup.exe`,
        filename: "AI-Commerce-Setup.exe",
        size: 0,
      },
      mac: {
        url: `${base}/mac/AI-Commerce.dmg`,
        filename: "AI-Commerce.dmg",
        size: 0,
      },
    },
    platforms: raw.platforms as DesktopUpdateJson["platforms"],
  };
}

function pickDownloadUrl(data: DesktopUpdateJson): string {
  const platform = detectPlatform();
  if (platform === "MACOS") return data.downloads.mac.url;
  return data.downloads.windows.url;
}

export class UpdateService {
  async checkUpdateFromJson(): Promise<UpdateInfo | null> {
    const res = await fetch(UPDATE_JSON_URL, { cache: "no-store" });
    if (!res.ok) return null;

    const raw = (await res.json()) as Record<string, unknown>;
    const data = normalizeUpdatePayload(raw);
    const current = getCurrentVersion();
    const hasUpdate = isNewerVersion(current, data.version);

    return {
      version: data.version,
      title: data.title,
      description: data.description,
      forceUpdate: false,
      downloadUrl: pickDownloadUrl(data),
      hasUpdate,
      releaseNotes: data.notes,
      pubDate: data.pub_date,
    };
  }

  async checkUpdate(): Promise<UpdateInfo | null> {
    const fromJson = await this.checkUpdateFromJson();
    if (fromJson?.hasUpdate) return fromJson;
    if (fromJson && !fromJson.hasUpdate) return fromJson;

    const params = new URLSearchParams({
      currentVersion: getCurrentVersion(),
      channel: getReleaseChannel(),
      platform: detectPlatform(),
      deviceId: getDeviceId(),
    });

    const token = getAccessToken();
    const res = await fetch(`${UPDATE_API_BASE}/api/version/latest?${params}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) return fromJson;
    return (await res.json()) as UpdateInfo;
  }

  async logDownload(version: string): Promise<void> {
    const token = getAccessToken();
    await fetch(`${UPDATE_API_BASE}/api/version/download-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        version,
        platform: detectPlatform(),
        channel: getReleaseChannel(),
      }),
    });
  }

  async downloadUpdate(info: UpdateInfo, onProgress?: (pct: number) => void): Promise<void> {
    if (!info.downloadUrl) throw new Error("无可用下载地址");

    await this.logDownload(info.version);

    const res = await fetch(info.downloadUrl);
    if (!res.ok) {
      window.open(info.downloadUrl, "_blank");
      return;
    }

    const total = Number(res.headers.get("content-length") ?? 0);
    const reader = res.body?.getReader();
    if (!reader) {
      window.open(info.downloadUrl, "_blank");
      return;
    }

    const chunks: Uint8Array[] = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        if (total > 0 && onProgress) onProgress(Math.round((loaded / total) * 100));
      }
    }

    const blob = new Blob(chunks as BlobPart[]);
    const name = info.downloadUrl.split("/").pop()?.split("?")[0] ?? `acs-${info.version}.exe`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async installUpdate(info: UpdateInfo, onProgress?: (pct: number) => void): Promise<void> {
    await this.downloadUpdate(info, onProgress);
    localStorage.setItem("acs_pending_version", info.version);
  }

  restartApp(): void {
    localStorage.setItem("acs_installed_version", getCurrentVersion());
    window.location.reload();
  }
}

export const updateService = new UpdateService();
