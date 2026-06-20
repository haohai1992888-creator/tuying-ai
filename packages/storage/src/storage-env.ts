/** Unified CDN credentials (Sprint 22). Provider-specific vars remain as fallback. */
export interface StorageEnvConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  region: string;
  publicBaseUrl: string;
}

function first(...values: Array<string | undefined>): string {
  for (const v of values) {
    const trimmed = v?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function readUnifiedStorageEnv(): Partial<StorageEnvConfig> {
  return {
    accessKeyId: first(process.env.STORAGE_ACCESS_KEY, process.env.STORAGE_ACCESS_KEY_ID),
    secretAccessKey: first(process.env.STORAGE_SECRET, process.env.STORAGE_SECRET_KEY),
    endpoint: first(process.env.STORAGE_ENDPOINT, process.env.STORAGE_S3_ENDPOINT),
    bucket: first(process.env.STORAGE_BUCKET),
    region: first(process.env.STORAGE_REGION),
    publicBaseUrl: first(
      process.env.STORAGE_PUBLIC_BASE_URL,
      process.env.DOWNLOAD_BASE_URL,
      process.env.CDN_PUBLIC_BASE_URL
    ),
  };
}

export function mergeStorageEnv(
  provider: Partial<StorageEnvConfig>,
  unified: Partial<StorageEnvConfig>
): StorageEnvConfig {
  return {
    accessKeyId: first(unified.accessKeyId, provider.accessKeyId),
    secretAccessKey: first(unified.secretAccessKey, provider.secretAccessKey),
    endpoint: first(unified.endpoint, provider.endpoint),
    bucket: first(unified.bucket, provider.bucket),
    region: first(unified.region, provider.region) || "auto",
    publicBaseUrl: first(unified.publicBaseUrl, provider.publicBaseUrl),
  };
}
