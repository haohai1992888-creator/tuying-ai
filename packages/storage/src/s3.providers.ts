import { readUnifiedStorageEnv, mergeStorageEnv } from "./storage-env";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageProvider } from "./types";

function first(...values: Array<string | undefined>): string {
  for (const v of values) {
    const trimmed = v?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function createS3Client(config: {
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle ?? true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

abstract class S3StorageProvider implements StorageProvider {
  protected abstract readonly client: S3Client;
  protected abstract readonly bucket: string;
  protected abstract readonly publicBaseUrl: string;

  async upload(file: Buffer, path: string, contentType = "application/octet-stream"): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: file,
        ContentType: contentType,
      })
    );
    return this.getUrl(path);
  }

  async delete(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: path,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: path,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(path: string): Promise<string> {
    const base = this.publicBaseUrl.replace(/\/$/, "");
    return `${base}/${path}`;
  }
}

/** 阿里云 OSS（S3 兼容 API） */
export class OSSProvider extends S3StorageProvider {
  protected readonly client: S3Client;
  protected readonly bucket: string;
  protected readonly publicBaseUrl: string;

  constructor() {
    super();
    const unified = readUnifiedStorageEnv();
    const cfg = mergeStorageEnv(
      {
        accessKeyId: first(process.env.OSS_ACCESS_KEY),
        secretAccessKey: first(process.env.OSS_SECRET_KEY),
        endpoint: first(process.env.OSS_ENDPOINT),
        bucket: first(process.env.OSS_BUCKET),
        region: first(process.env.OSS_REGION) || "oss-cn-hangzhou",
        publicBaseUrl: first(process.env.OSS_PUBLIC_BASE_URL),
      },
      unified
    );

    if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.endpoint || !cfg.bucket) {
      throw new Error(
        "OSS 配置不完整，请设置 STORAGE_* 或 OSS_ACCESS_KEY / OSS_SECRET_KEY / OSS_ENDPOINT / OSS_BUCKET"
      );
    }

    this.bucket = cfg.bucket;
    this.publicBaseUrl =
      cfg.publicBaseUrl || cfg.endpoint.replace(/^https?:\/\//, `https://${cfg.bucket}.`);
    this.client = createS3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      forcePathStyle: false,
    });
  }
}

/** Cloudflare R2 */
export class R2Provider extends S3StorageProvider {
  protected readonly client: S3Client;
  protected readonly bucket: string;
  protected readonly publicBaseUrl: string;

  constructor() {
    super();
    const unified = readUnifiedStorageEnv();
    const cfg = mergeStorageEnv(
      {
        accessKeyId: first(process.env.R2_ACCESS_KEY),
        secretAccessKey: first(process.env.R2_SECRET_KEY),
        endpoint: first(process.env.R2_ENDPOINT),
        bucket: first(process.env.R2_BUCKET),
        region: "auto",
        publicBaseUrl: first(process.env.R2_PUBLIC_BASE_URL),
      },
      unified
    );

    if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.endpoint || !cfg.bucket) {
      throw new Error(
        "R2 配置不完整，请设置 STORAGE_* 或 R2_ACCESS_KEY / R2_SECRET_KEY / R2_ENDPOINT / R2_BUCKET"
      );
    }

    this.bucket = cfg.bucket;
    this.publicBaseUrl = cfg.publicBaseUrl || cfg.endpoint;
    this.client = createS3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      forcePathStyle: true,
    });
  }
}

/** 腾讯云 COS（S3 兼容 API） */
export class COSProvider extends S3StorageProvider {
  protected readonly client: S3Client;
  protected readonly bucket: string;
  protected readonly publicBaseUrl: string;

  constructor() {
    super();
    const unified = readUnifiedStorageEnv();
    const cfg = mergeStorageEnv(
      {
        accessKeyId: first(process.env.COS_ACCESS_KEY, process.env.COS_SECRET_ID),
        secretAccessKey: first(process.env.COS_SECRET_KEY, process.env.COS_SECRET),
        endpoint: first(process.env.COS_ENDPOINT),
        bucket: first(process.env.COS_BUCKET),
        region: first(process.env.COS_REGION) || "ap-guangzhou",
        publicBaseUrl: first(process.env.COS_PUBLIC_BASE_URL),
      },
      unified
    );

    if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.endpoint || !cfg.bucket) {
      throw new Error(
        "COS 配置不完整，请设置 STORAGE_* 或 COS_ACCESS_KEY / COS_SECRET_KEY / COS_ENDPOINT / COS_BUCKET"
      );
    }

    this.bucket = cfg.bucket;
    this.publicBaseUrl =
      cfg.publicBaseUrl || cfg.endpoint.replace(/^https?:\/\//, `https://${cfg.bucket}.`);
    this.client = createS3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      forcePathStyle: false,
    });
  }
}
