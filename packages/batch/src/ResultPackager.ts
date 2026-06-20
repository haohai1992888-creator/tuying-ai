import { prisma } from "@acs/database";
import { fetchImageBuffer } from "@acs/files";
import { buildUserStoragePath } from "@acs/shared";
import { getStorageProvider } from "@acs/storage";
import archiver from "archiver";
import { PassThrough } from "node:stream";

/** 收集成功结果并打包 ZIP 上传 OSS */
export class ResultPackager {
  async packageBatch(batchTaskId: string): Promise<string> {
    const batch = await prisma.batchTask.findUnique({
      where: { id: batchTaskId },
      include: {
        items: { where: { status: "SUCCESS" }, orderBy: { itemIndex: "asc" } },
      },
    });
    if (!batch) throw new Error("批量任务不存在");

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    archive.on("error", (err) => {
      throw err;
    });
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<void>((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    });

    archive.pipe(stream);

    for (const item of batch.items) {
      const url = item.outputUrl;
      if (!url) continue;
      try {
        const buffer = url.startsWith("mock://")
          ? Buffer.from(JSON.stringify({ mock: true, itemId: item.id }))
          : await fetchImageBuffer(url);
        const ext = url.includes(".png") ? "png" : "jpg";
        archive.append(buffer, { name: `${String(item.itemIndex + 1).padStart(3, "0")}.${ext}` });
      } catch {
        archive.append(Buffer.from(`failed to fetch ${url}`), {
          name: `${item.itemIndex + 1}_error.txt`,
        });
      }
    }

    await archive.finalize();
    await done;

    const zipBuffer = Buffer.concat(chunks);
    const storage = getStorageProvider();
    const path = buildUserStoragePath("results", batch.userId, `batch-${batchTaskId}.zip`);
    const publicUrl = await storage.upload(zipBuffer, path, "application/zip");

    await prisma.batchTask.update({
      where: { id: batchTaskId },
      data: { resultZipUrl: publicUrl },
    });

    return publicUrl;
  }
}

export const resultPackager = new ResultPackager();
