import { OSSProvider, R2Provider, COSProvider } from "./s3.providers";
import { readUnifiedStorageEnv } from "./storage-env";
import { LocalStorageProvider } from "./local.provider";
import type { StorageProvider } from "./types";

let cachedProvider: StorageProvider | null = null;

function hasUnifiedStorage(): boolean {
  const u = readUnifiedStorageEnv();
  return !!(u.accessKeyId && u.secretAccessKey && u.endpoint && u.bucket);
}

function createDriver(name: string): StorageProvider {
  switch (name) {
    case "r2":
      return new R2Provider();
    case "cos":
      return new COSProvider();
    case "oss":
      return new OSSProvider();
    case "local":
      return new LocalStorageProvider();
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${name}`);
  }
}

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  const driver = (process.env.STORAGE_DRIVER ?? "auto").toLowerCase();

  if (driver !== "auto") {
    cachedProvider = createDriver(driver);
    return cachedProvider;
  }

  if (hasUnifiedStorage()) {
    cachedProvider = createDriver(process.env.STORAGE_PROVIDER?.toLowerCase() || "r2");
    return cachedProvider;
  }

  for (const name of ["r2", "cos", "oss"] as const) {
    try {
      cachedProvider = createDriver(name);
      return cachedProvider;
    } catch {
      // try next configured provider
    }
  }

  cachedProvider = new LocalStorageProvider();
  return cachedProvider;
}

export function isLocalStorage(provider: StorageProvider): provider is LocalStorageProvider {
  return provider instanceof LocalStorageProvider;
}

export { OSSProvider, R2Provider, COSProvider, LocalStorageProvider };
export type { StorageProvider };
