"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface FileRow {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  category: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export default function AdminFilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileRow[]>([]);

  useEffect(() => {
    apiFetch<FileRow[]>("/api/admin/files").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setFiles(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>文件管理</h1>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>文件名</th>
            <th>用户</th>
            <th>分类</th>
            <th>尺寸</th>
            <th>大小</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.fileName}</td>
              <td>{file.userId.slice(0, 8)}...</td>
              <td>{file.category}</td>
              <td>{file.width}×{file.height}</td>
              <td>{(file.fileSize / 1024).toFixed(1)} KB</td>
              <td>{new Date(file.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
