export interface StorageProvider {
  upload(file: Buffer, path: string, contentType?: string): Promise<string>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): Promise<string>;
}
