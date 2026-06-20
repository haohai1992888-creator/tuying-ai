import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { upload } from "../api/upload";
import ImagePreview from "../components/ImagePreview";
import {
  DETAIL_PRICING,
  extractSellingPoints,
  exportHtmlUrl,
  fetchDetailCategories,
  fetchDetailTemplates,
  fetchPsdStructure,
  generateDetailPage,
  getDetailTask,
  regenerateDetailBlock,
  type DetailTask,
  type DetailTemplate,
} from "../api/detail";

const PLATFORMS = [
  { key: "TAOBAO", label: "淘宝 (790px)" },
  { key: "PINDUODUO", label: "拼多多 (750px)" },
  { key: "DOUYIN", label: "抖店 (750px)" },
  { key: "XIAOHONGSHU", label: "小红书 (750px)" },
];

const BLOCK_LABELS: Record<string, string> = {
  BANNER: "首屏海报",
  FEATURE: "产品卖点",
  SCENE: "场景展示",
  SIZE: "尺寸规格",
  PARAMETER: "参数展示",
  DETAIL: "使用说明",
  BRAND: "品牌信任",
  REASON: "购买理由",
};

export default function DetailPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [templates, setTemplates] = useState<DetailTemplate[]>([]);
  const [category, setCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DetailTemplate | null>(null);
  const [productName, setProductName] = useState("厨房刀架");
  const [sellingPoints, setSellingPoints] = useState("");
  const [platform, setPlatform] = useState("TAOBAO");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [mode, setMode] = useState<"full" | "five">("full");
  const [error, setError] = useState("");
  const [task, setTask] = useState<DetailTask | null>(null);
  const [regeneratingBlock, setRegeneratingBlock] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    fetchDetailCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDetailTemplates(category || undefined)
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [category]);

  async function onUpload(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setTask(null);
    setUploadUrl(null);
    try {
      const result = await upload(file);
      setUploadUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function onExtractSellingPoints() {
    if (!productName.trim()) {
      setError("请输入产品名称");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const userPoints = sellingPoints
        ? sellingPoints.split(/[,，、\n|]/).map((s) => s.trim()).filter(Boolean)
        : undefined;
      const points = await extractSellingPoints({
        productName: productName.trim(),
        sellingPoints: userPoints,
      });
      setSellingPoints(points.join("、"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "卖点提取失败");
    } finally {
      setExtracting(false);
    }
  }

  async function pollTask(taskId: string) {
    try {
      const next = await getDetailTask(taskId);
      setTask(next);
      if (next.status === "SUCCESS" || next.status === "FAILED") {
        stopPolling();
        setGenerating(false);
        if (next.status === "FAILED") setError(next.error ?? "生成失败");
      }
    } catch {
      /* ignore poll errors */
    }
  }

  async function onGenerate() {
    if (!uploadUrl) {
      setError("请先上传商品图");
      return;
    }
    if (!productName.trim()) {
      setError("请输入产品名称");
      return;
    }

    setGenerating(true);
    setError("");
    setTask(null);
    stopPolling();

    const points = sellingPoints
      ? sellingPoints.split(/[,，、\n|]/).map((s) => s.trim()).filter(Boolean)
      : undefined;

    try {
      const created = await generateDetailPage({
        inputUrl: uploadUrl,
        productName: productName.trim(),
        templateId: selectedTemplate?.id,
        platform,
        sellingPoints: points,
        mode,
      });
      setTask(created);
      pollRef.current = setInterval(() => void pollTask(created.id), 2000);
      void pollTask(created.id);
    } catch (err) {
      setGenerating(false);
      setError(err instanceof Error ? err.message : "创建任务失败");
    }
  }

  async function onRegenerateBlock(blockId: string) {
    if (!task) return;
    setRegeneratingBlock(blockId);
    setError("");
    try {
      const updated = await regenerateDetailBlock(task.id, blockId);
      setTask(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新生成失败");
    } finally {
      setRegeneratingBlock(null);
    }
  }

  async function onExportPsd() {
    if (!task) return;
    try {
      const structure = await fetchPsdStructure(task.id);
      const blob = new Blob([JSON.stringify(structure, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `detail-${task.id}-psd-structure.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出 PSD 结构失败");
    }
  }

  const cost =
    mode === "five" ? DETAIL_PRICING.fiveImages : DETAIL_PRICING.fullPage;

  return (
    <main className="container">
      <div className="card">
        <h1>AI 详情页</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          商品图 → 卖点分析 → 模块生成 → 长图组合 → 导出 HTML / PSD 结构
        </p>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>商品图</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onUpload} disabled={uploading} />
            {uploadUrl && (
              <img src={uploadUrl} alt="商品图" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
            )}

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>产品名称</label>
            <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} />

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>卖点（可选）</label>
            <textarea
              className="input"
              rows={2}
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              placeholder="留空可 AI 自动提取"
            />
            <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => void onExtractSellingPoints()} disabled={extracting}>
              {extracting ? "生成中..." : `AI 生成卖点（${DETAIL_PRICING.sellingPoints} 积分）`}
            </button>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>生成模式</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={mode === "full" ? "btn" : "btn btn-secondary"} onClick={() => setMode("full")}>
                完整详情页（{DETAIL_PRICING.fullPage} 积分）
              </button>
              <button className={mode === "five" ? "btn" : "btn btn-secondary"} onClick={() => setMode("five")}>
                五图生成（{DETAIL_PRICING.fiveImages} 积分）
              </button>
            </div>

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>电商平台</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>

            <label style={{ display: "block", marginTop: 16, marginBottom: 8, fontWeight: 600 }}>模板</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">全部分类</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div style={{ display: "grid", gap: 8, maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
              <button
                className="btn btn-secondary"
                style={{ textAlign: "left", background: !selectedTemplate ? "#6366f1" : undefined, color: !selectedTemplate ? "#fff" : undefined }}
                onClick={() => setSelectedTemplate(null)}
              >
                默认模板
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  className="btn btn-secondary"
                  style={{
                    textAlign: "left",
                    background: selectedTemplate?.id === t.id ? "#6366f1" : undefined,
                    color: selectedTemplate?.id === t.id ? "#fff" : undefined,
                  }}
                  onClick={() => setSelectedTemplate(t)}
                >
                  {t.name} — {t.category}
                </button>
              ))}
            </div>

            <button className="btn" style={{ marginTop: 20, width: "100%" }} onClick={() => void onGenerate()} disabled={generating || !uploadUrl}>
              {generating ? "生成中..." : `开始生成（${cost} 积分）`}
            </button>
            {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
          </div>
        </div>

        {task && (
          <div style={{ marginTop: 24 }}>
            <h2>生成进度 — {task.status}</h2>
            {task.blocks && task.blocks.length > 0 && (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", marginTop: 12 }}>
                {task.blocks.map((block) => (
                  <div key={block.id} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {BLOCK_LABELS[block.blockType] ?? block.blockType}
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b" }}>{block.status}</span>
                    </div>
                    {block.imageUrl && block.status === "SUCCESS" ? (
                      <img src={block.imageUrl} alt={block.blockType} style={{ width: "100%", borderRadius: 6 }} />
                    ) : (
                      <div style={{ height: 100, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        {block.status === "PROCESSING" ? "生成中..." : block.error ?? "等待中"}
                      </div>
                    )}
                    {block.status === "SUCCESS" && (
                      <button className="btn btn-secondary" style={{ marginTop: 8, width: "100%", fontSize: 12 }} onClick={() => void onRegenerateBlock(block.id)} disabled={regeneratingBlock === block.id}>
                        {regeneratingBlock === block.id ? "重新生成..." : "重新生成"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {task.resultUrl && task.status === "SUCCESS" && (
              <div style={{ marginTop: 24 }}>
                <h2>详情页长图（1080×长图）</h2>
                <ImagePreview src={task.resultUrl} alt="详情页长图" />
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <a href={task.resultUrl} target="_blank" rel="noreferrer" className="btn">导出长图</a>
                  <a href={exportHtmlUrl(task.id)} target="_blank" rel="noreferrer" className="btn btn-secondary">导出 HTML</a>
                  <button className="btn btn-secondary" onClick={() => void onExportPsd()}>导出 PSD 结构</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
