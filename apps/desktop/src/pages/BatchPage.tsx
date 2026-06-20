import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

const BATCH_TYPES = [
  { value: "batch_scene_image", label: "批量场景图 (5积分/张)" },
  { value: "batch_white_background", label: "批量白底图 (2积分/张)" },
  { value: "batch_poster", label: "批量海报 (10积分/张)" },
  { value: "batch_model_image", label: "批量模特图 (8积分/张)" },
];

interface BatchProgress {
  total: number;
  success: number;
  failed: number;
  processing: number;
  etaSeconds?: number;
}

interface BatchTask {
  id: string;
  taskType: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  resultZipUrl: string | null;
  paused: boolean;
  progress?: BatchProgress;
}

function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return "计算中…";
  if (seconds < 60) return `约 ${seconds} 秒`;
  return `约 ${Math.ceil(seconds / 60)} 分钟`;
}

export default function BatchPage() {
  const [taskType, setTaskType] = useState(BATCH_TYPES[0].value);
  const [posterTemplate, setPosterTemplate] = useState("618");
  const [sceneStyle, setSceneStyle] = useState("现代办公");
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Array<{ inputUrl: string; name?: string }>>([]);
  const [batch, setBatch] = useState<BatchTask | null>(null);
  const [batches, setBatches] = useState<BatchTask[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshBatch = useCallback(async (id: string) => {
    const res = await apiFetch<BatchTask>(`/api/batch/${id}`);
    if (res.data) setBatch(res.data);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await apiFetch<BatchTask[]>("/api/batch");
    if (res.data) setBatches(res.data);
  }, []);

  useEffect(() => {
    loadHistory();
    return () => stopPolling();
  }, [loadHistory, stopPolling]);

  useEffect(() => {
    if (!batch?.id) return;
    const terminal = ["SUCCESS", "PARTIAL_SUCCESS", "FAILED", "CANCELLED"];
    if (terminal.includes(batch.status)) {
      stopPolling();
      loadHistory();
      return;
    }
    stopPolling();
    pollRef.current = setInterval(() => void refreshBatch(batch.id), 3000);
    return () => stopPolling();
  }, [batch?.id, batch?.status, refreshBatch, loadHistory, stopPolling]);

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    setError("");
    const list = Array.from(files);
    const formData = new FormData();

    if (list.length === 1 && list[0].name.endsWith(".zip")) {
      formData.append("zip", list[0]);
    } else {
      for (const file of list) formData.append("files", file);
    }

    const token = getAccessToken();
    try {
      const res = await fetch(`${API_BASE}/api/batch/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "上传失败");
        return;
      }
      setItems((prev) => [...prev, ...(json.data.items as typeof items)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function onSpreadsheet(e: FormEvent<HTMLTextAreaElement>) {
    const text = e.currentTarget.value.trim();
    if (!text) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("spreadsheet", text);
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_BASE}/api/batch/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "解析失败");
        return;
      }
      setItems(json.data.items as typeof items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setUploading(false);
    }
  }

  async function createBatch() {
    if (items.length === 0) {
      setError("请先上传图片");
      return;
    }
    setCreating(true);
    setError("");
    const options: Record<string, unknown> = {};
    if (taskType === "batch_poster") options.posterTemplate = posterTemplate;
    if (taskType === "batch_scene_image") options.sceneStyle = sceneStyle;

    const res = await apiFetch<BatchTask>("/api/batch", {
      method: "POST",
      body: JSON.stringify({
        taskType,
        items: items.map((i) => ({ inputUrl: i.inputUrl })),
        options,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      setError(res.error ?? "创建失败");
      return;
    }
    setBatch(res.data ?? null);
    setItems([]);
  }

  async function batchAction(action: "pause" | "resume" | "cancel" | "retry-failed") {
    if (!batch?.id) return;
    const res = await apiFetch(`/api/batch/${batch.id}/${action}`, { method: "POST" });
    if (!res.ok) {
      setError(res.error ?? "操作失败");
      return;
    }
    await refreshBatch(batch.id);
  }

  const progress = batch?.progress;
  const pct = progress
    ? Math.round(((progress.success + progress.failed) / Math.max(progress.total, 1)) * 100)
    : 0;

  return (
    <div className="page">
      <h1>批量生成中心</h1>
      <p style={{ color: "#64748b" }}>支持拖拽、多选、ZIP 与 Excel/CSV 导入，统一经 Batch Engine 调度</p>

      <section style={{ marginTop: 24 }}>
        <label>
          批量类型
          <select value={taskType} onChange={(e) => setTaskType(e.target.value)} style={{ marginLeft: 8 }}>
            {BATCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        {taskType === "batch_poster" && (
          <label style={{ marginLeft: 16 }}>
            海报模板
            <select value={posterTemplate} onChange={(e) => setPosterTemplate(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="618">618</option>
              <option value="新品">新品</option>
              <option value="折扣">折扣</option>
            </select>
          </label>
        )}
        {taskType === "batch_scene_image" && (
          <label style={{ marginLeft: 16 }}>
            场景风格
            <select value={sceneStyle} onChange={(e) => setSceneStyle(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="现代办公">现代办公</option>
              <option value="温馨家居">温馨家居</option>
              <option value="户外自然">户外自然</option>
            </select>
          </label>
        )}
      </section>

      <div
        ref={dropRef}
        className="card"
        style={{
          marginTop: 16,
          padding: 32,
          border: "2px dashed #cbd5e1",
          textAlign: "center",
          cursor: "pointer",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("batch-file-input")?.click()}
      >
        <p>{uploading ? "上传中…" : "拖拽图片或 ZIP 到此处，或点击选择"}</p>
        <input
          id="batch-file-input"
          type="file"
          multiple
          accept="image/*,.zip"
          style={{ display: "none" }}
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Excel / CSV 导入（每行一个 URL）</label>
        <textarea
          rows={3}
          placeholder="inputUrl 或 url 列…"
          style={{ width: "100%", marginTop: 8 }}
          onBlur={onSpreadsheet}
        />
      </div>

      {items.length > 0 && (
        <p style={{ marginTop: 12 }}>已选 {items.length} 张图片</p>
      )}

      {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}

      <button className="btn" style={{ marginTop: 16 }} disabled={creating || uploading} onClick={() => void createBatch()}>
        {creating ? "创建中…" : "开始批量生成"}
      </button>

      {batch && (
        <section className="card" style={{ marginTop: 24, padding: 16 }}>
          <h2>当前任务</h2>
          <p>ID: {batch.id}</p>
          <p>状态: {batch.status}{batch.paused ? " (已暂停)" : ""}</p>
          {progress && (
            <>
              <p>
                进度: {progress.success} 成功 / {progress.failed} 失败 / {progress.processing} 处理中 / 共 {progress.total}
              </p>
              <div style={{ background: "#e2e8f0", borderRadius: 4, height: 8, marginTop: 8 }}>
                <div style={{ width: `${pct}%`, background: "#2563eb", height: "100%", borderRadius: 4 }} />
              </div>
              <p style={{ marginTop: 8, color: "#64748b" }}>预计剩余: {formatEta(progress.etaSeconds)}</p>
            </>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => void batchAction("pause")}>暂停</button>
            <button className="btn btn-secondary" onClick={() => void batchAction("resume")}>继续</button>
            <button className="btn btn-secondary" onClick={() => void batchAction("retry-failed")}>重试失败</button>
            <button className="btn btn-secondary" onClick={() => void batchAction("cancel")}>取消</button>
            {batch.resultZipUrl && (
              <a className="btn" href={batch.resultZipUrl} target="_blank" rel="noreferrer">下载 result.zip</a>
            )}
          </div>
        </section>
      )}

      {batches.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>历史批量任务</h2>
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>数量</th>
                <th>成功</th>
                <th>失败</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((row) => (
                <tr key={row.id}>
                  <td>{row.taskType}</td>
                  <td>{row.totalCount}</td>
                  <td>{row.successCount}</td>
                  <td>{row.failedCount}</td>
                  <td>{row.status}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => setBatch(row)}>查看</button>
                    {row.resultZipUrl && (
                      <a href={row.resultZipUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>ZIP</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
