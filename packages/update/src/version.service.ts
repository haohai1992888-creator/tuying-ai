import { createHash } from "node:crypto";
import { prisma } from "@acs/database";
import {
  bumpVersion,
  ClientPlatform,
  compareVersions,
  isNewerVersion,
  ReleaseChannel,
} from "@acs/shared";

export interface LatestVersionDto {
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

export interface TauriUpdateManifest {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, { signature: string; url: string }>;
}

export interface AppVersionDto {
  id: string;
  version: string;
  title: string;
  description: string;
  downloadUrl: string;
  downloadUrlWin: string | null;
  downloadUrlMac: string | null;
  forceUpdate: boolean;
  channel: ReleaseChannel;
  published: boolean;
  downloadCount: number;
  createdAt: string;
}

export interface VersionRolloutDto {
  id: string;
  version: string;
  force: boolean;
  percent: number;
  channel: ReleaseChannel;
  createdAt: string;
}

export interface VersionStats {
  totalDownloads: number;
  versionDownloads: Array<{ version: string; count: number }>;
  activeVersions: string[];
  upgradeRate: number;
}

function resolveDownloadUrl(
  row: {
    downloadUrl: string;
    downloadUrlWin: string | null;
    downloadUrlMac: string | null;
  },
  platform?: string
): string {
  const p = platform?.toUpperCase();
  if (p === ClientPlatform.WINDOWS && row.downloadUrlWin) return row.downloadUrlWin;
  if (p === ClientPlatform.MACOS && row.downloadUrlMac) return row.downloadUrlMac;
  return row.downloadUrl;
}

function resolveSignature(
  row: {
    updateSignatureWin: string | null;
    updateSignatureMac: string | null;
  },
  platform?: string
): string {
  const p = platform?.toUpperCase();
  if (p === ClientPlatform.WINDOWS && row.updateSignatureWin) return row.updateSignatureWin;
  if (p === ClientPlatform.MACOS && row.updateSignatureMac) return row.updateSignatureMac;
  return row.updateSignatureWin ?? row.updateSignatureMac ?? "";
}

export function bucketPercent(key: string): number {
  const hash = createHash("sha256").update(key).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export function mapTauriTarget(target: string): { platform?: string; tauriKey: string } {
  const t = target.toLowerCase();
  if (t.includes("windows")) return { platform: ClientPlatform.WINDOWS, tauriKey: target };
  if (t.includes("darwin") || t.includes("macos")) return { platform: ClientPlatform.MACOS, tauriKey: target };
  return { tauriKey: target };
}

export class VersionService {
  async getRollout(version: string, channel: ReleaseChannel) {
    return prisma.versionRollout.findUnique({
      where: { version_channel: { version, channel } },
    });
  }

  async isEligibleForRollout(input: {
    version: string;
    channel: ReleaseChannel;
    deviceId?: string;
  }): Promise<{ eligible: boolean; force: boolean; percent: number }> {
    const rollout = await this.getRollout(input.version, input.channel);
    if (!rollout) return { eligible: true, force: false, percent: 100 };

    const key = input.deviceId?.trim() || "anonymous";
    const bucket = bucketPercent(key);
    const eligible = bucket < rollout.percent;

    return {
      eligible,
      force: rollout.force && eligible,
      percent: rollout.percent,
    };
  }

  async getLatest(input: {
    currentVersion?: string;
    channel?: ReleaseChannel | string;
    platform?: string;
    deviceId?: string;
  }): Promise<LatestVersionDto | null> {
    const channel = (input.channel ?? ReleaseChannel.STABLE) as ReleaseChannel;

    const rows = await prisma.appVersion.findMany({
      where: { channel, published: true },
      include: { releaseNotes: { orderBy: { createdAt: "desc" }, take: 8 } },
    });

    if (rows.length === 0) return null;

    const latest = rows.reduce((best, row) =>
      compareVersions(row.version, best.version) > 0 ? row : best
    );

    const current = input.currentVersion ?? "0.0.0";
    const hasUpdate = isNewerVersion(latest.version, current);
    if (!hasUpdate) {
      return {
        version: latest.version,
        title: latest.title,
        description: latest.description,
        forceUpdate: false,
        downloadUrl: resolveDownloadUrl(latest, input.platform),
        hasUpdate: false,
        releaseNotes: latest.releaseNotes.map((n) => n.content),
        pubDate: latest.pubDate?.toISOString(),
      };
    }

    const rollout = await this.isEligibleForRollout({
      version: latest.version,
      channel,
      deviceId: input.deviceId,
    });

    if (!rollout.eligible) {
      return {
        version: latest.version,
        title: latest.title,
        description: latest.description,
        forceUpdate: false,
        downloadUrl: resolveDownloadUrl(latest, input.platform),
        hasUpdate: false,
        releaseNotes: latest.releaseNotes.map((n) => n.content),
        pubDate: latest.pubDate?.toISOString(),
        rolloutPercent: rollout.percent,
      };
    }

    const downloadUrl = resolveDownloadUrl(latest, input.platform);

    return {
      version: latest.version,
      title: latest.title,
      description: latest.description,
      forceUpdate: latest.forceUpdate || rollout.force,
      downloadUrl,
      hasUpdate: true,
      releaseNotes: latest.releaseNotes.map((n) => n.content),
      pubDate: latest.pubDate?.toISOString() ?? latest.createdAt.toISOString(),
      rolloutPercent: rollout.percent,
    };
  }

  async getTauriManifest(input: {
    target: string;
    currentVersion: string;
    channel?: ReleaseChannel | string;
    deviceId?: string;
  }): Promise<TauriUpdateManifest | null> {
    const { platform, tauriKey } = mapTauriTarget(input.target);
    const latest = await this.getLatest({
      currentVersion: input.currentVersion,
      channel: input.channel,
      platform,
      deviceId: input.deviceId,
    });

    if (!latest?.hasUpdate) return null;

    const row = await prisma.appVersion.findFirst({
      where: {
        version: latest.version,
        channel: (input.channel ?? ReleaseChannel.STABLE) as ReleaseChannel,
        published: true,
      },
    });
    if (!row) return null;

    const signature = resolveSignature(row, platform);
    const url = resolveDownloadUrl(row, platform);

    return {
      version: latest.version,
      notes: latest.releaseNotes?.join("\n") || latest.description,
      pub_date: latest.pubDate ?? new Date().toISOString(),
      platforms: {
        [tauriKey]: {
          signature,
          url,
        },
      },
    };
  }

  async upsertRollout(input: {
    version: string;
    force?: boolean;
    percent: number;
    channel?: ReleaseChannel;
  }): Promise<VersionRolloutDto> {
    const channel = (input.channel ?? ReleaseChannel.STABLE) as ReleaseChannel;
    const row = await prisma.versionRollout.upsert({
      where: { version_channel: { version: input.version, channel } },
      create: {
        version: input.version,
        force: input.force ?? false,
        percent: Math.min(100, Math.max(0, input.percent)),
        channel,
      },
      update: {
        force: input.force ?? false,
        percent: Math.min(100, Math.max(0, input.percent)),
      },
    });
    return mapRollout(row);
  }

  async listVersions(limit = 50): Promise<AppVersionDto[]> {
    const rows = await prisma.appVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapVersion);
  }

  async createVersion(input: {
    version: string;
    title: string;
    description: string;
    downloadUrl: string;
    downloadUrlWin?: string;
    downloadUrlMac?: string;
    forceUpdate?: boolean;
    channel?: ReleaseChannel;
    releaseNote?: string;
    pubDate?: Date;
    updateSignatureWin?: string;
    updateSignatureMac?: string;
    rolloutPercent?: number;
    rolloutForce?: boolean;
  }): Promise<AppVersionDto> {
    const channel = (input.channel ?? ReleaseChannel.STABLE) as ReleaseChannel;
    const row = await prisma.appVersion.create({
      data: {
        version: input.version,
        title: input.title,
        description: input.description,
        downloadUrl: input.downloadUrl,
        downloadUrlWin: input.downloadUrlWin,
        downloadUrlMac: input.downloadUrlMac,
        forceUpdate: input.forceUpdate ?? false,
        channel,
        published: false,
        pubDate: input.pubDate ?? new Date(),
        updateSignatureWin: input.updateSignatureWin,
        updateSignatureMac: input.updateSignatureMac,
      },
    });

    if (input.releaseNote?.trim()) {
      await prisma.releaseNote.create({
        data: {
          versionId: row.id,
          version: row.version,
          content: input.releaseNote.trim(),
        },
      });
    }

    if (input.rolloutPercent != null) {
      await this.upsertRollout({
        version: row.version,
        percent: input.rolloutPercent,
        force: input.rolloutForce,
        channel,
      });
    }

    return mapVersion(row);
  }

  async publishVersion(id: string): Promise<AppVersionDto> {
    const row = await prisma.appVersion.update({
      where: { id },
      data: { published: true },
    });
    return mapVersion(row);
  }

  async updateVersion(
    id: string,
    input: Partial<{
      title: string;
      description: string;
      downloadUrl: string;
      downloadUrlWin: string | null;
      downloadUrlMac: string | null;
      forceUpdate: boolean;
    }>
  ): Promise<AppVersionDto> {
    const row = await prisma.appVersion.update({ where: { id }, data: input });
    return mapVersion(row);
  }

  async logDownload(input: {
    version: string;
    userId?: string;
    platform?: string;
    channel?: string;
  }): Promise<void> {
    await prisma.$transaction([
      prisma.downloadLog.create({
        data: {
          version: input.version,
          userId: input.userId,
          platform: input.platform,
          channel: input.channel,
        },
      }),
      prisma.appVersion.updateMany({
        where: { version: input.version },
        data: { downloadCount: { increment: 1 } },
      }),
    ]);
  }

  async getStats(): Promise<VersionStats> {
    const [logs, versions] = await Promise.all([
      prisma.downloadLog.findMany({ select: { version: true } }),
      prisma.appVersion.findMany({
        where: { published: true },
        select: { version: true, downloadCount: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const countByVersion = new Map<string, number>();
    for (const log of logs) {
      countByVersion.set(log.version, (countByVersion.get(log.version) ?? 0) + 1);
    }

    const versionDownloads = [...countByVersion.entries()]
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => compareVersions(b.version, a.version));

    const totalDownloads = logs.length;
    const activeVersions = versions.map((v) => v.version);
    const latest = activeVersions[0];
    const previous = activeVersions[1];
    let upgradeRate = 0;
    if (latest && previous) {
      const latestCount = countByVersion.get(latest) ?? 0;
      const prevCount = countByVersion.get(previous) ?? 1;
      upgradeRate = Math.min(100, Math.round((latestCount / Math.max(prevCount, 1)) * 100));
    }

    return {
      totalDownloads,
      versionDownloads,
      activeVersions,
      upgradeRate,
    };
  }

  async suggestNextVersion(type: "patch" | "minor" | "major", channel = ReleaseChannel.STABLE): Promise<string> {
    const latest = await prisma.appVersion.findFirst({
      where: { channel },
      orderBy: { createdAt: "desc" },
    });
    return bumpVersion(latest?.version ?? "1.0.0", type);
  }
}

function mapVersion(row: {
  id: string;
  version: string;
  title: string;
  description: string;
  downloadUrl: string;
  downloadUrlWin: string | null;
  downloadUrlMac: string | null;
  forceUpdate: boolean;
  channel: string;
  published: boolean;
  downloadCount: number;
  createdAt: Date;
}): AppVersionDto {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    description: row.description,
    downloadUrl: row.downloadUrl,
    downloadUrlWin: row.downloadUrlWin,
    downloadUrlMac: row.downloadUrlMac,
    forceUpdate: row.forceUpdate,
    channel: row.channel as ReleaseChannel,
    published: row.published,
    downloadCount: row.downloadCount,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapRollout(row: {
  id: string;
  version: string;
  force: boolean;
  percent: number;
  channel: string;
  createdAt: Date;
}): VersionRolloutDto {
  return {
    id: row.id,
    version: row.version,
    force: row.force,
    percent: row.percent,
    channel: row.channel as ReleaseChannel,
    createdAt: row.createdAt.toISOString(),
  };
}

export const versionService = new VersionService();
