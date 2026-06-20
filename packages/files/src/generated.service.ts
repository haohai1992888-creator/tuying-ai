import { prisma } from "@acs/database";
import { buildUserStoragePath, FileCategory } from "@acs/shared";
import { getStorageProvider } from "@acs/storage";
import { randomUUID } from "node:crypto";
import { imageService } from "./image.service";

export interface SaveGeneratedInput {
  userId: string;
  buffer: Buffer;
  fileName?: string;
  thumbnailSizes?: number[];
}

export interface SaveGeneratedResult {
  fileId: string;
  storagePath: string;
  publicUrl: string;
  thumbnails: Array<{ size: number; storagePath: string; publicUrl: string; fileId: string }>;
}

/** 保存 AI 生成结果到 OSS + 缩略图 + File 记录 */
export async function saveGeneratedResult(input: SaveGeneratedInput): Promise<SaveGeneratedResult> {
  const storage = getStorageProvider();
  const fileName = input.fileName ?? `${randomUUID()}.png`;
  const storagePath = buildUserStoragePath("results", input.userId, fileName);
  const publicUrl = await storage.upload(input.buffer, storagePath, "image/png");

  const file = await prisma.file.create({
    data: {
      userId: input.userId,
      fileName,
      fileType: "image/png",
      fileSize: input.buffer.length,
      category: FileCategory.GENERATED,
      storagePath,
      publicUrl,
    },
  });

  const thumbnailSizes = input.thumbnailSizes ?? [400, 800];
  const thumbnails: SaveGeneratedResult["thumbnails"] = [];

  for (const size of thumbnailSizes) {
    const thumb = await imageService.generateThumbnail(input.buffer, size);
    const thumbName = `${randomUUID()}_${size}.webp`;
    const thumbPath = buildUserStoragePath("thumbnails", input.userId, thumbName);
    const thumbUrl = await storage.upload(thumb.buffer, thumbPath, "image/webp");

    const thumbFile = await prisma.file.create({
      data: {
        userId: input.userId,
        fileName: `${size}x${size}.webp`,
        fileType: "image/webp",
        fileSize: thumb.size,
        category: FileCategory.THUMBNAIL,
        storagePath: thumbPath,
        publicUrl: thumbUrl,
        width: thumb.width,
        height: thumb.height,
      },
    });

    thumbnails.push({
      size,
      storagePath: thumbPath,
      publicUrl: thumbUrl,
      fileId: thumbFile.id,
    });
  }

  return {
    fileId: file.id,
    storagePath,
    publicUrl,
    thumbnails,
  };
}

export async function fetchImageBuffer(source: string): Promise<Buffer> {
  if (source.startsWith("data:")) {
    const base64 = source.split(",")[1];
    return Buffer.from(base64, "base64");
  }
  const res = await fetch(source);
  if (!res.ok) throw new Error(`无法下载图片: ${source}`);
  return Buffer.from(await res.arrayBuffer());
}
