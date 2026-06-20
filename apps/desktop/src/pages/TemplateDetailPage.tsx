import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ImagePreview from "../components/ImagePreview";
import { upload } from "../api/upload";
import {
  favoriteTemplate,
  unfavoriteTemplate,
  fetchTemplateDetail,
  generateFromTemplate,
  type TemplateItem,
} from "../api/template";
import { trackBehavior } from "../services/beta";

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<TemplateItem | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({
    product: "保温杯",
    style: "商业广告",
    scene: "现代厨房",
  });
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchTemplateDetail(id)
      .then((t) => {
        setTemplate(t);
        void trackBehavior("TEMPLATE_CLICK", "templates", { templateId: id, name: t.name });
        const vars: Record<string, string> = { ...variables };
        for (const key of t.promptVariables ?? ["product"]) {
          if (!vars[key]) vars[key] = "";
        }
        setVariables(vars);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, [id]);

  async function onUpload(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await upload(file);
      setUploadUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function onToggleFavorite() {
    if (!template) return;
    try {
      if (template.favorited) {
        await unfavoriteTemplate(template.id);
      } else {
        await favoriteTemplate(template.id);
      }
      const updated = await fetchTemplateDetail(template.id);
      setTemplate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "收藏操作失败");
    }
  }

  async function onGenerate() {
    if (!template || !uploadUrl) {
      setError("请上传商品图");
      return;
    }

    setGenerating(true);
    setError("");
    setOutputUrl(null);

    try {
      const { task } = await generateFromTemplate({
        templateId: template.id,
        inputUrl: uploadUrl,
        variables,
      });
      setTaskStatus(task.status);
      setOutputUrl(task.outputUrl);
      if (task.error) setError(task.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  if (!template) {
    return (
      <main className="container">
        <div className="card">
          <p>{error || "加载中…"}</p>
          <Link to="/templates">返回模板市场</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <Link to="/templates" style={{ fontSize: 14 }}>
          ← 返回模板市场
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
          <div>
            <img
              src={template.cover || template.coverUrl}
              alt={template.title}
              style={{ width: "100%", borderRadius: 8, maxHeight: 360, objectFit: "cover" }}
            />
          </div>
          <div>
            <h1>{template.title || template.name}</h1>
            <p style={{ color: "#64748b" }}>{template.description}</p>
            <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
              <li>模型：{template.model}</li>
              <li>消耗积分：{template.points}</li>
              <li>生成次数：{template.usageCount}</li>
              <li>收藏数：{template.favoriteCount}</li>
              <li>分类：{template.category}</li>
            </ul>
            <button className="btn btn-secondary" onClick={() => void onToggleFavorite()}>
              {template.favorited ? "取消收藏" : "收藏模板"}
            </button>
          </div>
        </div>

        {template.prompt && (
          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Prompt 模板</summary>
            <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, marginTop: 8, whiteSpace: "pre-wrap" }}>
              {template.prompt}
            </pre>
          </details>
        )}

        <section style={{ marginTop: 24 }}>
          <h2>一键生成</h2>
          {(template.promptVariables ?? ["product"]).map((key) => (
            <label key={key} style={{ display: "block", marginTop: 8 }}>
              {key}
              <input
                className="input"
                value={variables[key] ?? ""}
                onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                style={{ marginTop: 4, width: "100%" }}
              />
            </label>
          ))}

          <div style={{ marginTop: 12 }}>
            <label>上传商品图</label>
            <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
          </div>

          {uploadUrl && (
            <img src={uploadUrl} alt="商品图" style={{ marginTop: 12, maxHeight: 120, borderRadius: 6 }} />
          )}

          {error && <p style={{ color: "#dc2626", marginTop: 8 }}>{error}</p>}

          <button className="btn" style={{ marginTop: 12 }} disabled={generating || uploading} onClick={() => void onGenerate()}>
            {generating ? "生成中…" : "立即生成"}
          </button>

          {taskStatus && <p style={{ marginTop: 12 }}>任务状态：{taskStatus}</p>}
          {outputUrl && (
            <div style={{ marginTop: 16 }}>
              <ImagePreview src={outputUrl} alt="生成结果" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
