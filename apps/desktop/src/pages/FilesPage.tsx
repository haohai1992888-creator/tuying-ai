import { useCallback, useEffect, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";
import ImagePreview from "../components/ImagePreview";

interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  publicUrl: string;
  width: number | null;
  height: number | null;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FileItem | null>(null);
  const authHeaders = { Authorization: `Bearer ${getAccessToken()}` };

  const loadFiles = useCallback(async (q?: string) => {
    const query = q ? `?search=${encodeURIComponent(q)}` : "";
    const res = await apiFetch<FileItem[]>(`/api/files${query}`);
    setFiles(res.data ?? []);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function handleDelete(id: string) {
    await apiFetch(`/api/files/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    loadFiles(search);
  }

  async function handleDownload(id: string, fileName: string) {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE ?? "http://localhost:3000"}/api/files/${id}/download`,
      { headers: authHeaders }
    );
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="container">
      <div className="card" style={{ marginBottom: 16 }}>
        <h1>文件管理</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            style={{ marginBottom: 0 }}
            placeholder="搜索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" onClick={() => loadFiles(search)}>搜索</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <table className="table">
            <thead>
              <tr><th>文件名</th><th>尺寸</th><th>操作</th></tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} style={{ cursor: "pointer", background: selected?.id === file.id ? "#f1f5f9" : undefined }}>
                  <td onClick={() => setSelected(file)}>{file.fileName}</td>
                  <td onClick={() => setSelected(file)}>{file.width}×{file.height}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", marginRight: 4 }} onClick={() => handleDownload(file.id, file.fileName)}>下载</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => handleDelete(file.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {selected ? (
            <ImagePreview
              src={`${import.meta.env.VITE_API_BASE ?? "http://localhost:3000"}/api/files/${selected.id}/download`}
              alt={selected.fileName}
              authHeaders={authHeaders}
              onDelete={() => handleDelete(selected.id)}
            />
          ) : (
            <p style={{ color: "#64748b" }}>选择文件预览</p>
          )}
        </div>
      </div>
    </main>
  );
}
