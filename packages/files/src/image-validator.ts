import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  FILE_LIMITS,
} from "@acs/shared";

const BLOCKED_EXTENSIONS = ["gif", "exe", "zip", "svg", "bmp", "tiff"];

export interface ImageValidationInput {
  buffer: Buffer;
  fileName: string;
  fileSize: number;
  maxBytes?: number;
}

export interface ImageValidationResult {
  extension: string;
  mime: string;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export function validateImageUpload(input: ImageValidationInput): ImageValidationResult {
  const maxBytes = Math.min(input.maxBytes ?? FILE_LIMITS.DEFAULT_MAX_BYTES, FILE_LIMITS.ABSOLUTE_MAX_BYTES);

  if (input.fileSize <= 0) {
    throw new ImageValidationError("文件为空");
  }
  if (input.fileSize > maxBytes) {
    throw new ImageValidationError(`文件大小不能超过 ${Math.floor(maxBytes / 1024 / 1024)}MB`);
  }

  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!extension) {
    throw new ImageValidationError("无法识别文件扩展名");
  }
  if (BLOCKED_EXTENSIONS.includes(extension)) {
    throw new ImageValidationError(`不允许上传 .${extension} 格式`);
  }
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    throw new ImageValidationError("仅支持 jpg / jpeg / png / webp 格式");
  }

  const mime = detectMime(input.buffer, extension);
  if (!ALLOWED_IMAGE_MIMES.includes(mime as (typeof ALLOWED_IMAGE_MIMES)[number])) {
    throw new ImageValidationError("文件内容与扩展名不匹配");
  }

  return { extension, mime };
}

function detectMime(buffer: Buffer, extension: string): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}

export async function validateImageDimensions(
  width: number,
  height: number
): Promise<void> {
  if (width < FILE_LIMITS.MIN_WIDTH || height < FILE_LIMITS.MIN_HEIGHT) {
    throw new ImageValidationError(
      `图片尺寸不能小于 ${FILE_LIMITS.MIN_WIDTH}x${FILE_LIMITS.MIN_HEIGHT}`
    );
  }
  if (width > FILE_LIMITS.MAX_WIDTH || height > FILE_LIMITS.MAX_HEIGHT) {
    throw new ImageValidationError(
      `图片尺寸不能超过 ${FILE_LIMITS.MAX_WIDTH}x${FILE_LIMITS.MAX_HEIGHT}`
    );
  }
}
