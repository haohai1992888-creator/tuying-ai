export interface FileRecord {
  id: string;
  userId: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export function toFileRecord(input: {
  id: string;
  userId: string;
  fileName: string;
  publicUrl: string;
  fileSize: number;
  createdAt: Date | string;
}): FileRecord {
  return {
    id: input.id,
    userId: input.userId,
    filename: input.fileName,
    url: input.publicUrl,
    size: input.fileSize,
    createdAt: input.createdAt instanceof Date ? input.createdAt.toISOString() : input.createdAt,
  };
}
