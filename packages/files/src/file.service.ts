import { prisma } from "@acs/database";
import {
  buildUserStoragePath,
  FileCategory,
  REDIS_KEYS,
  REDIS_TTL,
  THUMBNAIL_SIZES,
} from "@acs/shared";
import { cacheService } from "@acs/shared/redis";
import { getStorageProvider } from "@acs/storage";
import { randomUUID } from "node:crypto";
import { ImageValidationError, validateImageUpload } from "./image-validator";
import { imageService } from "./image.service";

export interface FileDto {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: FileCategory;
  storagePath: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface UploadResult {
  id: string;
  url: string;
  width: number;
  height: number;
}

export class FileService {
  async upload(
    userId: string,
    input: {
      buffer: Buffer;
      fileName: string;
      category?: FileCategory;
    }
  ): Promise<UploadResult> {
    const validation = validateImageUpload({
      buffer: input.buffer,
      fileName: input.fileName,
      fileSize: input.buffer.length,
    });

    await imageService.getMetadata(input.buffer);

    const compressed = await imageService.compress(input.buffer);
    const storage = getStorageProvider();
    const category = input.category ?? FileCategory.ORIGINAL;
    const folder = category === FileCategory.TEMP ? "temp" : "uploads";
    const baseName = `${randomUUID()}.${compressed.format === "png" ? "png" : "jpg"}`;
    const storagePath = buildUserStoragePath(folder, userId, baseName);
    const contentType = compressed.format === "png" ? "image/png" : "image/jpeg";
    const publicUrl = await storage.upload(compressed.buffer, storagePath, contentType);

    const file = await prisma.file.create({
      data: {
        userId,
        fileName: input.fileName,
        fileType: contentType,
        fileSize: compressed.size,
        category,
        storagePath,
        publicUrl,
        width: compressed.width,
        height: compressed.height,
      },
    });

    await this.generateAndStoreThumbnails(userId, file.id, compressed.buffer);
    await this.invalidateUserCache(userId);

    return {
      id: file.id,
      url: publicUrl,
      width: compressed.width,
      height: compressed.height,
    };
  }

  private async generateAndStoreThumbnails(
    userId: string,
    _originalId: string,
    buffer: Buffer
  ): Promise<void> {
    const storage = getStorageProvider();
    const thumbnails = await imageService.generateAllThumbnails(buffer);

    for (const size of THUMBNAIL_SIZES) {
      const thumb = thumbnails.get(size);
      if (!thumb) continue;

      const thumbName = `${randomUUID()}_${size}.webp`;
      const storagePath = buildUserStoragePath("thumbnails", userId, thumbName);
      const publicUrl = await storage.upload(thumb.buffer, storagePath, "image/webp");

      await prisma.file.create({
        data: {
          userId,
          fileName: `${size}x${size}.webp`,
          fileType: "image/webp",
          fileSize: thumb.size,
          category: FileCategory.THUMBNAIL,
          storagePath,
          publicUrl,
          width: thumb.width,
          height: thumb.height,
        },
      });
    }
  }

  async listFiles(
    userId: string,
    options?: { category?: FileCategory; search?: string; limit?: number }
  ): Promise<FileDto[]> {
    const cacheKey = REDIS_KEYS.userFiles(userId);
    if (!options?.category && !options?.search) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as FileDto[];
        } catch {
          // ignore
        }
      }
    }

    const rows = await prisma.file.findMany({
      where: {
        userId,
        ...(options?.category ? { category: options.category } : { category: { in: [FileCategory.ORIGINAL, FileCategory.GENERATED] } }),
        ...(options?.search
          ? { fileName: { contains: options.search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 100,
    });

    const result = rows.map(mapFile);
    if (!options?.category && !options?.search) {
      await cacheService.set(cacheKey, JSON.stringify(result), REDIS_TTL.FILE);
    }
    return result;
  }

  async listAllFiles(limit = 100): Promise<FileDto[]> {
    const rows = await prisma.file.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapFile);
  }

  async getFile(fileId: string): Promise<FileDto | null> {
    const cacheKey = REDIS_KEYS.file(fileId);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as FileDto;
      } catch {
        // ignore
      }
    }

    const row = await prisma.file.findUnique({ where: { id: fileId } });
    if (!row) return null;

    const dto = mapFile(row);
    await cacheService.set(cacheKey, JSON.stringify(dto), REDIS_TTL.FILE);

    const urlCacheKey = REDIS_KEYS.fileUrl(fileId);
    await cacheService.set(urlCacheKey, dto.publicUrl, REDIS_TTL.FILE);

    return dto;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return false;

    const storage = getStorageProvider();
    await storage.delete(file.storagePath);
    await prisma.file.delete({ where: { id: fileId } });

    await cacheService.del(REDIS_KEYS.file(fileId));
    await cacheService.del(REDIS_KEYS.fileUrl(fileId));
    await this.invalidateUserCache(file.userId);

    return true;
  }

  async getCachedUrl(fileId: string): Promise<string | null> {
    const cached = await cacheService.get(REDIS_KEYS.fileUrl(fileId));
    if (cached) return cached;

    const file = await this.getFile(fileId);
    return file?.publicUrl ?? null;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await cacheService.del(REDIS_KEYS.userFiles(userId));
  }
}

function mapFile(row: {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  storagePath: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  createdAt: Date;
}): FileDto {
  return {
    id: row.id,
    userId: row.userId,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    category: row.category as FileCategory,
    storagePath: row.storagePath,
    publicUrl: row.publicUrl,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
  };
}

export const fileService = new FileService();
export { ImageValidationError };
