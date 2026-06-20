import { getToken } from "../store/auth";

const FILE_API_BASE =
  import.meta.env.VITE_FILE_API_BASE ??
  import.meta.env.VITE_API_BASE ??
  "http://localhost:3001";

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

export async function upload(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);

  const token = getToken();
  const res = await fetch(`${FILE_API_BASE}/api/file/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const json = (await res.json()) as UploadedFile & { message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "上传失败");
  }

  return json;
}

export async function listFiles(): Promise<UploadedFile[]> {
  const token = getToken();
  const res = await fetch(`${FILE_API_BASE}/api/file/list`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const json = (await res.json()) as UploadedFile[] & { message?: string };
  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? "获取文件列表失败");
  }

  return json as UploadedFile[];
}

export async function deleteUploadedFile(id: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${FILE_API_BASE}/api/file/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const json = (await res.json()) as { success?: boolean; message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? "删除失败");
  }
}
