import { THUMBNAIL_SIZES } from "@acs/shared";
import { validateImageDimensions } from "./image-validator";

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

async function loadSharp() {
  const mod = await import("sharp");
  return mod.default;
}

export class ImageService {
  async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const sharp = await loadSharp();
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    await validateImageDimensions(width, height);
    return {
      width,
      height,
      format: meta.format ?? "unknown",
      size: buffer.length,
    };
  }

  async compress(buffer: Buffer, quality = 85): Promise<ProcessedImage> {
    const sharp = await loadSharp();
    const pipeline = sharp(buffer).rotate().resize({
      width: 2048,
      height: 2048,
      fit: "inside",
      withoutEnlargement: true,
    });

    const meta = await sharp(buffer).metadata();
    const format = meta.format === "png" ? "png" : "jpeg";
    const output =
      format === "png"
        ? await pipeline.png({ compressionLevel: 8 }).toBuffer()
        : await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

    const outMeta = await sharp(output).metadata();
    return {
      buffer: output,
      width: outMeta.width ?? 0,
      height: outMeta.height ?? 0,
      format,
      size: output.length,
    };
  }

  async generateThumbnail(buffer: Buffer, size: number): Promise<ProcessedImage> {
    const sharp = await loadSharp();
    const output = await sharp(buffer)
      .rotate()
      .resize(size, size, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();

    const meta = await sharp(output).metadata();
    return {
      buffer: output,
      width: meta.width ?? size,
      height: meta.height ?? size,
      format: "webp",
      size: output.length,
    };
  }

  async generateAllThumbnails(buffer: Buffer): Promise<Map<number, ProcessedImage>> {
    const results = new Map<number, ProcessedImage>();
    for (const size of THUMBNAIL_SIZES) {
      results.set(size, await this.generateThumbnail(buffer, size));
    }
    return results;
  }

  async convertFormat(
    buffer: Buffer,
    format: "jpeg" | "png" | "webp"
  ): Promise<ProcessedImage> {
    const sharp = await loadSharp();
    let pipeline = sharp(buffer).rotate();
    if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
    if (format === "png") pipeline = pipeline.png({ compressionLevel: 8 });
    if (format === "webp") pipeline = pipeline.webp({ quality: 85 });

    const output = await pipeline.toBuffer();
    const meta = await sharp(output).metadata();
    return {
      buffer: output,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      format,
      size: output.length,
    };
  }
}

export const imageService = new ImageService();
