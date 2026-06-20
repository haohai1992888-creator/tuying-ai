import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";
import { createAiTask } from "../services/tasks";
import ImagePreview from "../components/ImagePreview";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

const POSTER_TEMPLATES = [
  { key: "618", label: "618促销" },
  { key: "new_product", label: "新品上市" },
  { key: "discount", label: "限时折扣" },
  { key: "buy_one_get_one", label: "买一送一" },
  { key: "brand", label: "品牌宣传" },
];

interface TaskResult {
  id: string;
  status: string;
  cost: number;
  outputUrl: string | null;
  modelName: string | null;
  workflowRun?: { status: string; error: string | null } | null;
}

export default function PosterPage() {
  const [category, setCategory] = useState("保温杯");
  const [templateKey, setTemplateKey] = useState("618");
  const [sellingPoints, setSellingPoints] = useState("保温24小时,316不锈钢,限时特惠");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [task, setTask] = useState<TaskResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function onUpload(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setTask(null);
    setUploadUrl(null);

    const formData = new FormData();
    formData.append("file", file);
    const token = getAccessToken();

    try {
      const res = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "上传失败");
        return;
      }
      setUploadUrl(json.data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function pollTask(taskId: string) {
    const res = await apiFetch<TaskResult>(`/api/tasks/${taskId}`);
    if (!res.data) return;
    setTask(res.data);
    if (res.data.status === "SUCCESS" || res.data.status === "FAILED") {
      stopPolling();
      setGenerating(false);
      if (res.data.status === "FAILED") {
        setError(res.data.workflowRun?.error ?? "生成失败");
      }
    }
  }

  async function onGenerate() {
    if (!uploadUrl) {
      setError("请先上传商品图");
      return;
    }

    setGenerating(true);
    setError("");
    setTask(null);
    stopPolling();

    const res = await createAiTask<TaskResult>({
      taskType: "poster",
      inputUrl: uploadUrl,
      category,
      templateKey,
      sellingPoints,
    });

    if (!res.ok || !res.data) {
      setGenerating(false);
      setError(res.error ?? "创建任务失败");
      return;
    }

    setTask(res.data);
    pollRef.current = setInterval(() => void pollTask(res.data!.id), 2000);
    void pollTask(res.data.id);
  }

  return (
    <main className="container">
      <div className="card">
        <h1>AI 海报</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          上传商品图，选择海报模板，输入卖点，通过 Seedream 生成营销海报（消耗 10 积分）
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品图</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onUpload} disabled={uploading} />
            {uploadUrl && (
              <img src={uploadUrl} alt="商品图" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品类别</label>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>海报模板</label>
            <select className="input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
              {POSTER_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>卖点文案</label>
            <textarea
              className="input"
              rows={3}
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              placeholder="多个卖点用逗号分隔"
            />

            <button className="btn" style={{ marginTop: 20, width: "100%" }} onClick={onGenerate} disabled={generating || !uploadUrl}>
              {generating ? "生成中..." : "生成海报（10 积分）"}
            </button>
            {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
          </div>
        </div>

        {task?.outputUrl && task.status === "SUCCESS" && (
          <div style={{ marginTop: 24 }}>
            <h2>生成结果</h2>
            <ImagePreview src={task.outputUrl} alt="海报结果" />
          </div>
        )}
      </div>
    </main>
  );
}
