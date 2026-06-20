import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";
import { createAiTask } from "../services/tasks";
import ImagePreview from "../components/ImagePreview";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

const MODEL_TEMPLATES = [
  { key: "womenswear", label: "女装" },
  { key: "menswear", label: "男装" },
  { key: "kidswear", label: "童装" },
  { key: "shoes_bags", label: "鞋包" },
  { key: "accessories", label: "饰品" },
];

interface TaskResult {
  id: string;
  status: string;
  cost: number;
  outputUrl: string | null;
  modelName: string | null;
  workflowRun?: { status: string; error: string | null } | null;
}

export default function ModelImagePage() {
  const [category, setCategory] = useState("连衣裙");
  const [modelTemplateKey, setModelTemplateKey] = useState("womenswear");
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
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

  async function uploadFile(file: File, target: "product" | "reference") {
    const setUploading = target === "product" ? setUploadingProduct : setUploadingRef;
    const setUrl = target === "product" ? setProductUrl : setReferenceUrl;
    setUploading(true);
    setError("");

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
      setUrl(json.data.url as string);
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
    if (!productUrl) {
      setError("请先上传商品图");
      return;
    }

    setGenerating(true);
    setError("");
    setTask(null);
    stopPolling();

    const res = await createAiTask<TaskResult>({
      taskType: "model_image",
      inputUrl: productUrl,
      modelReferenceUrl: referenceUrl ?? undefined,
      category,
      modelTemplateKey,
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
        <h1>AI 模特图</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          上传商品图与模特参考图，选择风格，通过 Seedream 生成模特展示图（消耗 8 积分）
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品图</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => e.currentTarget.files?.[0] && void uploadFile(e.currentTarget.files[0], "product")}
              disabled={uploadingProduct}
            />
            {productUrl && (
              <img src={productUrl} alt="商品" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
            )}

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>模特参考图（可选）</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => e.currentTarget.files?.[0] && void uploadFile(e.currentTarget.files[0], "reference")}
              disabled={uploadingRef}
            />
            {referenceUrl && (
              <img src={referenceUrl} alt="参考" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品类别</label>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>模特风格</label>
            <select className="input" value={modelTemplateKey} onChange={(e) => setModelTemplateKey(e.target.value)}>
              {MODEL_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>

            <button className="btn" style={{ marginTop: 20, width: "100%" }} onClick={onGenerate} disabled={generating || !productUrl}>
              {generating ? "生成中..." : "生成模特图（8 积分）"}
            </button>
            {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
          </div>
        </div>

        {task?.outputUrl && task.status === "SUCCESS" && (
          <div style={{ marginTop: 24 }}>
            <h2>生成结果</h2>
            <ImagePreview src={task.outputUrl} alt="模特图结果" />
          </div>
        )}
      </div>
    </main>
  );
}
