import { mkdir, unlink, access, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./types";

/** 本地存储 — 开发环境 fallback，禁止业务代码直接读写磁盘 */
export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.rootDir = process.env.STORAGE_LOCAL_DIR?.trim() || path.join(process.cwd(), ".storage");
    const apiBase = process.env.API_PUBLIC_URL?.trim() || "http://localhost:3000";
    this.publicBaseUrl = `${apiBase}/api/storage`;
  }

  private resolvePath(storagePath: string): string {
    const normalized = path.normalize(storagePath).replace(/^(\.\.[/\\])+/, "");
    const full = path.join(this.rootDir, normalized);
    if (!full.startsWith(this.rootDir)) {
      throw new Error("非法存储路径");
    }
    return full;
  }

  async upload(file: Buffer, storagePath: string): Promise<string> {
    const fullPath = this.resolvePath(storagePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file);
    return this.getUrl(storagePath);
  }

  async delete(storagePath: string): Promise<boolean> {
    try {
      await unlink(this.resolvePath(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await access(this.resolvePath(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(storagePath: string): Promise<string> {
    const encoded = storagePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${this.publicBaseUrl}/${encoded}`;
  }

  async read(storagePath: string): Promise<Buffer> {
    return readFile(this.resolvePath(storagePath));
  }
}
