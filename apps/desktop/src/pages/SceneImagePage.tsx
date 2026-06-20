import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";
import { createAiTask } from "../services/tasks";
import ImagePreview from "../components/ImagePreview";
import { useGenerationFailure } from "../hooks/useGenerationFailure";
import { trackBehavior } from "../services/beta";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

const SCENE_OPTIONS = [
  { value: "现代办公", label: "现代办公场景" },
  { value: "温馨家居", label: "温馨家居场景" },
  { value: "户外自然", label: "户外自然场景" },
];

interface TaskResult {
  id: string;
  status: string;
  cost: number;
  outputUrl: string | null;
  modelName: string | null;
  workflowRun?: { status: string; error: string | null } | null;
}

export default function SceneImagePage() {
  const [category, setCategory] = useState("保温杯");
  const [style, setStyle] = useState(SCENE_OPTIONS[0].value);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [task, setTask] = useState<TaskResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showFailure, failureDialog } = useGenerationFailure();

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
      setUploadName(file.name);
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
        const errorMessage = res.data.workflowRun?.error ?? "生成失败";
        setError(errorMessage);
        showFailure({
          errorMessage,
          taskId: res.data.id,
          model: res.data.modelName ?? undefined,
          error: errorMessage,
        });
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

    void trackBehavior("IMAGE_GENERATE", "scene-image", { category, style });
    const res = await createAiTask<TaskResult>({
      taskType: "scene_image",
      inputUrl: uploadUrl,
      category,
      style,
      sceneStyle: style,
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

  function downloadResult() {
    if (!task?.outputUrl) return;
    void trackBehavior("IMAGE_EXPORT", "scene-image", { taskId: task.id });
    const link = document.createElement("a");
    link.href = task.outputUrl;
    link.download = `scene-${task.id.slice(0, 8)}.png`;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="container">
      {failureDialog}
      <div className="card">
        <h1>商品场景图</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          上传商品图，选择场景风格，通过工作流调用 GPT Image 生成场景图（消耗 5 积分）
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品图</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onUpload} disabled={uploading} />
            {uploading && <p style={{ fontSize: 13, color: "#64748b" }}>上传中...</p>}
            {uploadUrl && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, marginBottom: 8 }}>{uploadName}</p>
                <img
                  src={uploadUrl}
                  alt="商品图"
                  style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品类别</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例如：保温杯"
            />

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>场景风格</label>
            <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
              {SCENE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              className="btn"
              style={{ marginTop: 20, width: "100%" }}
              onClick={onGenerate}
              disabled={generating || !uploadUrl}
            >
              {generating ? "生成中..." : "生成场景图（5 积分）"}
            </button>

            {error && <p style={{ color: "#dc2626", marginTop: 12, fontSize: 14 }}>{error}</p>}

            {task && (
              <div style={{ marginTop: 16, fontSize: 14 }}>
                <p>
                  任务状态：<strong>{task.status}</strong>
                  {task.modelName ? ` · 模型 ${task.modelName}` : ""}
                </p>
                {generating && <p style={{ color: "#64748b" }}>工作流执行中，请稍候...</p>}
              </div>
            )}
          </div>
        </div>

        {task?.outputUrl && task.status === "SUCCESS" && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>生成结果</h2>
              <button className="btn btn-secondary" onClick={downloadResult}>
                下载图片
              </button>
            </div>
            <ImagePreview src={task.outputUrl} alt="场景图结果" />
          </div>
        )}
      </div>
    </main>
  );
}
