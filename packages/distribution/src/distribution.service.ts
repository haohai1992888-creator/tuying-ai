import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@acs/database";
import { getStorageProvider } from "@acs/storage";
import {
  getDownloadBaseUrl,
  getDownloadRoot,
  MAC_DMG,
  UPDATE_JSON,
  macDir,
  updateDir,
  WIN_INSTALLER,
  windowsDir,
} from "./paths";
import type { DesktopUpdateJson, DownloadPageInfo, ReleaseNoteEntry } from "./types";
import { normalizeUpdateJson } from "./normalize";

async function fileSha256(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function fileInfo(filePath: string, publicUrl: string, filename: string) {
  const st = await stat(filePath);
  return {
    url: publicUrl,
    filename,
    size: st.size,
    sha256: await fileSha256(filePath),
  };
}

const DEFAULT_RELEASE_NOTES: ReleaseNoteEntry[] = [
  { version: "1.0.0", items: ["Beta 内测客户端首发", "Windows x64 / macOS Universal"] },
  { version: "1.0.1", items: ["新增模板市场"] },
  { version: "1.1.0", items: ["新增 AI 详情页", "Batch Engine 优化"] },
];

export class DistributionService {
  async loadUpdateJson(): Promise<DesktopUpdateJson | null> {
    const jsonPath = path.join(updateDir(), UPDATE_JSON);
    try {
      await access(jsonPath);
      const raw = await readFile(jsonPath, "utf8");
      return normalizeUpdateJson(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async getDownloadPageInfo(userAgent?: string): Promise<DownloadPageInfo> {
    const cached = await this.loadUpdateJson();
    if (cached) {
      const ua = (userAgent ?? "").toLowerCase();
      const recommended: "windows" | "mac" =
        ua.includes("mac") || ua.includes("darwin") ? "mac" : "windows";
      return {
        version: cached.version,
        title: cached.title,
        description: cached.description,
        pubDate: cached.pub_date,
        releaseNotes: cached.releaseNotes,
        windows: cached.downloads.windows,
        mac: cached.downloads.mac,
        recommended,
      };
    }

    const version = await prisma.appVersion.findFirst({
      where: { published: true },
      orderBy: { pubDate: "desc" },
      include: { releaseNotes: true },
    });

    const base = getDownloadBaseUrl();
    const ver = version?.version ?? "1.0.0";
    const releaseNotes =
      version?.releaseNotes.map((n) => ({
        version: n.version,
        items: [n.content],
      })) ?? DEFAULT_RELEASE_NOTES;

    return {
      version: ver,
      title: version?.title ?? "AI Commerce Desktop",
      description: version?.description ?? "AI 电商工作台桌面客户端",
      pubDate: version?.pubDate?.toISOString() ?? new Date().toISOString(),
      releaseNotes,
      windows: {
        url: `${base}/windows/${WIN_INSTALLER}`,
        filename: WIN_INSTALLER,
        size: 0,
      },
      mac: {
        url: `${base}/mac/${MAC_DMG}`,
        filename: MAC_DMG,
        size: 0,
      },
      recommended: (userAgent ?? "").toLowerCase().includes("mac") ? "mac" : "windows",
    };
  }

  async generateUpdateJson(input: {
    version: string;
    title?: string;
    description?: string;
    releaseNotes?: ReleaseNoteEntry[];
    updateSignatureWin?: string;
    updateSignatureMac?: string;
  }): Promise<DesktopUpdateJson> {
    const root = getDownloadRoot();
    const base = getDownloadBaseUrl();
    await mkdir(windowsDir(root), { recursive: true });
    await mkdir(macDir(root), { recursive: true });
    await mkdir(updateDir(root), { recursive: true });

    const winPath = path.join(windowsDir(root), WIN_INSTALLER);
    const macPath = path.join(macDir(root), MAC_DMG);

    let winInfo = {
      url: `${base}/windows/${WIN_INSTALLER}`,
      filename: WIN_INSTALLER,
      size: 0,
    };
    let macInfo = {
      url: `${base}/mac/${MAC_DMG}`,
      filename: MAC_DMG,
      size: 0,
    };

    try {
      winInfo = await fileInfo(winPath, `${base}/windows/${WIN_INSTALLER}`, WIN_INSTALLER);
    } catch {
      // artifact not built yet
    }

    try {
      macInfo = await fileInfo(macPath, `${base}/mac/${MAC_DMG}`, MAC_DMG);
    } catch {
      // artifact not built yet
    }

    const notes = input.releaseNotes ?? DEFAULT_RELEASE_NOTES;
    const flatNotes = notes.flatMap((r) => r.items.map((i) => `${r.version}: ${i}`));

    const payload: DesktopUpdateJson = {
      version: input.version,
      pub_date: new Date().toISOString(),
      title: input.title ?? `AI Commerce Desktop v${input.version}`,
      description: input.description ?? "Windows 64-bit · macOS Universal Binary",
      notes: flatNotes,
      releaseNotes: notes,
      downloads: {
        windows: winInfo,
        mac: macInfo,
      },
    };

    if (input.updateSignatureWin || input.updateSignatureMac) {
      payload.platforms = {};
      if (input.updateSignatureWin) {
        payload.platforms["windows-x86_64"] = {
          signature: input.updateSignatureWin,
          url: winInfo.url,
        };
      }
      if (input.updateSignatureMac) {
        payload.platforms["darwin-universal"] = {
          signature: input.updateSignatureMac,
          url: macInfo.url,
        };
      }
    }

    await writeFile(path.join(updateDir(root), UPDATE_JSON), JSON.stringify(payload, null, 2), "utf8");
    return payload;
  }

  async publishToCdn(): Promise<{ uploaded: string[] }> {
    const root = getDownloadRoot();
    const storage = getStorageProvider();
    const uploaded: string[] = [];
    const updatePath = path.join(updateDir(root), UPDATE_JSON);

    const files = [
      { local: path.join(windowsDir(root), WIN_INSTALLER), remote: `windows/${WIN_INSTALLER}`, type: "application/vnd.microsoft.portable-executable" },
      { local: path.join(macDir(root), MAC_DMG), remote: `mac/${MAC_DMG}`, type: "application/x-apple-diskimage" },
      { local: updatePath, remote: `update/${UPDATE_JSON}`, type: "application/json" },
    ];

    for (const f of files) {
      try {
        await access(f.local);
        const buf = await readFile(f.local);
        await storage.upload(buf, f.remote, f.type);
        uploaded.push(f.remote);
      } catch {
        // skip missing
      }
    }

    try {
      await access(updatePath);
      const full = normalizeUpdateJson(JSON.parse(await readFile(updatePath, "utf8")));
      const simple = JSON.stringify({
        version: full.version,
        notes: full.notes[0] ?? full.description,
        pub_date: full.pub_date,
      });
      await storage.upload(Buffer.from(simple, "utf8"), UPDATE_JSON, "application/json");
      uploaded.push(UPDATE_JSON);
    } catch {
      // skip
    }

    return { uploaded };
  }
}

export const distributionService = new DistributionService();
