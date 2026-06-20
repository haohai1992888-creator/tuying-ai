import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getAccessToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

const TEMPLATE_LABELS: Record<string, string> = {
  PRODUCT_ROTATE: "商品旋转",
  SCENE_PUSH: "场景推进",
  ZOOM_IN: "镜头拉近",
  UNBOXING: "开箱展示",
  MARKETING: "营销广告",
};

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  templateType: string;
  coverUrl: string;
}

interface VideoTask {
  id: string;
  status: string;
  progress: number;
  duration: number;
  cost: number;
  provider: string;
  videoUrl: string | null;
  error: string | null;
  estimatedSeconds?: number;
}

export default function VideoPage() {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [durationCosts, setDurationCosts] = useState<Record<number, number>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [duration, setDuration] = useState(5);
  const [productName, setProductName] = useState("");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [task, setTask] = useState<VideoTask | null>(null);
  const [loop, setLoop] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    apiFetch<{ templates: VideoTemplate[]; durationCosts: Record<number, number> }>(
      "/api/video/templates"
    ).then((res) => {
      setTemplates(res.data?.templates ?? []);
      setDurationCosts(res.data?.durationCosts ?? { 5: 20, 8: 30, 10: 40 });
      if (res.data?.templates?.[0]) setSelectedTemplate(res.data.templates[0]);
    });
  }, []);

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
    const res = await apiFetch<{ task: VideoTask }>(`/api/video/${taskId}`);
    if (!res.data?.task) return;
    setTask(res.data.task);
    if (res.data.task.status === "SUCCESS" || res.data.task.status === "FAILED") {
      stopPolling();
      setGenerating(false);
      if (res.data.task.status === "FAILED") {
        setError(res.data.task.error ?? "生成失败");
      }
    }
  }

  async function onGenerate() {
    if (!uploadUrl) {
      setError("请先上传商品图");
      return;
    }
    if (!selectedTemplate) {
      setError("请选择视频模板");
      return;
    }

    setGenerating(true);
    setError("");
    setTask(null);
    stopPolling();

    const res = await apiFetch<{ task: VideoTask }>("/api/video/generate", {
      method: "POST",
      body: JSON.stringify({
        inputUrl: uploadUrl,
        templateId: selectedTemplate.id,
        duration,
        productName: productName.trim() || undefined,
      }),
    });

    if (!res.ok || !res.data?.task) {
      setGenerating(false);
      setError(res.error ?? "创建任务失败");
      return;
    }

    setTask(res.data.task);
    pollRef.current = setInterval(() => void pollTask(res.data!.task.id), 2000);
    void pollTask(res.data.task.id);
  }

  const cost = durationCosts[duration] ?? 20;
  const estimated = task?.estimatedSeconds ?? (duration === 5 ? 30 : duration === 8 ? 45 : 60);

  return (
    <main className="container">
      <div className="card">
        <h1>AI 商品视频</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          上传商品图 → 选择镜头模板 → 生成 MP4 视频（图转视频）
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品图</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onUpload} disabled={uploading} />
            {uploadUrl && (
              <img src={uploadUrl} alt="商品图" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
            )}

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>产品名称（可选）</label>
            <input
              className="input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="如：厨房刀架"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>视频模板</label>
            <div style={{ display: "grid", gap: 8, maxHeight: 180, overflowY: "auto" }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  className="btn"
                  style={{
                    textAlign: "left",
                    background: selectedTemplate?.id === t.id ? "#6366f1" : undefined,
                    color: selectedTemplate?.id === t.id ? "#fff" : undefined,
                  }}
                  onClick={() => setSelectedTemplate(t)}
                >
                  {t.name} — {TEMPLATE_LABELS[t.templateType] ?? t.templateType}
                </button>
              ))}
            </div>

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>视频时长</label>
            <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={5}>5 秒（{durationCosts[5] ?? 20} 积分）</option>
              <option value={8}>8 秒（{durationCosts[8] ?? 30} 积分）</option>
              <option value={10}>10 秒（{durationCosts[10] ?? 40} 积分）</option>
            </select>

            <button
              className="btn"
              style={{ marginTop: 20, width: "100%" }}
              onClick={onGenerate}
              disabled={generating || !uploadUrl}
            >
              {generating ? "生成中..." : `开始生成（${cost} 积分）`}
            </button>
            {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
          </div>
        </div>

        {task && (
          <div style={{ marginTop: 24 }}>
            <h2>生成进度</h2>
            <p>
              状态：{task.status} · 进度：{task.progress}% · Provider：{task.provider}
            </p>
            {generating && (
              <p style={{ color: "#64748b" }}>预计剩余约 {estimated} 秒</p>
            )}
            <div
              style={{
                marginTop: 8,
                height: 8,
                background: "#e2e8f0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${task.progress}%`,
                  height: "100%",
                  background: "#6366f1",
                  transition: "width 0.3s",
                }}
              />
            </div>

            {task.videoUrl && task.status === "SUCCESS" && (
              <div style={{ marginTop: 24 }}>
                <h2>视频预览</h2>
                <video
                  src={task.videoUrl}
                  controls
                  loop={loop}
                  style={{ maxWidth: "100%", borderRadius: 8, background: "#000" }}
                />
                <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                  <label>
                    <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> 循环播放
                  </label>
                  <a href={task.videoUrl} download className="btn">
                    下载 MP4
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
