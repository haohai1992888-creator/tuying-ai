import AdmZip from "adm-zip";
import { ALLOWED_IMAGE_EXTENSIONS } from "@acs/shared";
import type { BatchItemInput } from "./types";

export class BatchSplitter {
  /** 从 URL 列表拆分子任务 */
  splitFromUrls(items: BatchItemInput[]): BatchItemInput[] {
    return items.filter((item) => item.inputUrl?.trim());
  }

  /** 从 ZIP 缓冲解压图片 URL 占位 — 需先上传解压后的文件 */
  extractImageEntriesFromZip(buffer: Buffer): Array<{ name: string; buffer: Buffer }> {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const images: Array<{ name: string; buffer: Buffer }> = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const ext = entry.entryName.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
        continue;
      }
      images.push({ name: entry.entryName, buffer: entry.getData() });
    }

    return images;
  }

  /** 从 CSV/JSON 文本解析 inputUrl 列表（Excel 导入简化） */
  parseSpreadsheet(text: string): BatchItemInput[] {
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed) as Array<{ inputUrl?: string; url?: string }>;
        return arr
          .map((row) => ({ inputUrl: row.inputUrl ?? row.url ?? "" }))
          .filter((r) => r.inputUrl);
      } catch {
        return [];
      }
    }

    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    const items: BatchItemInput[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && (line.includes("url") || line.includes("inputUrl"))) continue;
      const cols = line.split(/[,，\t]/);
      const url = cols.find((c) => c.trim().startsWith("http"))?.trim() ?? cols[0]?.trim();
      if (url) items.push({ inputUrl: url });
    }
    return items;
  }
}

export const batchSplitter = new BatchSplitter();
