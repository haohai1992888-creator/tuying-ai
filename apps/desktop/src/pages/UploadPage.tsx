import { FormEvent, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { upload, type UploadedFile } from "../api/upload";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  result?: UploadedFile;
}

let uploadCounter = 0;

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const next = Array.from(fileList).map((file) => ({
      id: `upload-${++uploadCounter}`,
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setItems((prev) => [...prev, ...next]);
    next.forEach((item) => {
      void uploadOne(item);
    });
  }, []);

  async function uploadOne(item: UploadItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i))
    );

    try {
      const result = await upload(item.file);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "success", progress: 100, result } : i
        )
      );
    } catch (error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: "error",
                error: error instanceof Error ? error.message : "上传失败",
                progress: 0,
              }
            : i
        )
      );
    }
  }

  function retry(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "pending", error: undefined, progress: 0 } : i))
    );
    void uploadOne({ ...item, status: "pending", progress: 0, error: undefined });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function onFileInput(e: FormEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (files?.length) addFiles(files);
  }

  return (
    <main className="container">
      <div className="card">
        <h1>上传中心</h1>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <p>拖拽图片到此处，或选择文件</p>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={onFileInput} />
        </div>

        {items.map((item) => (
          <div key={item.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{item.file.name}</span>
              <span>
                {item.status === "success" ? "完成" : item.status === "error" ? "失败" : `${item.progress}%`}
              </span>
            </div>
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4, marginTop: 8 }}>
              <div
                style={{
                  width: `${item.progress}%`,
                  height: "100%",
                  background: item.status === "error" ? "#dc2626" : "#2563eb",
                  borderRadius: 4,
                }}
              />
            </div>
            {item.error && (
              <p style={{ color: "#dc2626", fontSize: 13 }}>
                {item.error}{" "}
                <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => retry(item.id)}>
                  重试
                </button>
              </p>
            )}
            {item.result && (
              <p style={{ fontSize: 13, color: "#64748b" }}>
                {item.result.url} · <Link to="/files">查看文件</Link>
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
