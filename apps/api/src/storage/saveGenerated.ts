import { getStorageProvider } from "@acs/storage";

export async function saveGeneratedImage(buffer: Buffer, userId: string): Promise<string> {
  const filename = `${Date.now()}.png`;
  const objectName = `results/${userId}/${filename}`;
  const storage = getStorageProvider();
  return storage.upload(buffer, objectName, "image/png");
}
