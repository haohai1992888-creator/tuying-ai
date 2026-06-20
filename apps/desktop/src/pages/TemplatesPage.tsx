import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCategories,
  fetchHotTemplates,
  fetchRecentTemplates,
  fetchTemplates,
  favoriteTemplate,
  unfavoriteTemplate,
  type TemplateItem,
} from "../api/template";

const QUICK_CATEGORIES = ["厨房场景", "家居场景", "服饰模特", "食品摄影", "详情页", "海报"];

export default function TemplatesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "hot" | "recent" | "favorites">("all");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    try {
      setError("");
      if (tab === "hot") {
        setTemplates(await fetchHotTemplates());
        return;
      }
      if (tab === "recent") {
        setTemplates(await fetchRecentTemplates());
        return;
      }
      const list = await fetchTemplates({
        category: category || undefined,
        search: search || undefined,
        favorites: tab === "favorites",
      });
      setTemplates(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    }
  }, [tab, category, search]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "加载分类失败"));
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  async function toggleFavorite(t: TemplateItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (t.favorited) {
        await unfavoriteTemplate(t.id);
      } else {
        await favoriteTemplate(t.id);
      }
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h1>模板市场</h1>
        <p style={{ color: "#64748b" }}>选择模板 → 上传商品 → 一键生成，无需手写 Prompt</p>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {(["all", "hot", "recent", "favorites"] as const).map((t) => (
            <button
              key={t}
              className={tab === t ? "btn" : "btn btn-secondary"}
              onClick={() => setTab(t)}
            >
              {t === "all" ? "全部" : t === "hot" ? "🔥 热门" : t === "recent" ? "最近" : "收藏"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {QUICK_CATEGORIES.map((c) => (
            <button
              key={c}
              className={category === c ? "btn" : "btn btn-secondary"}
              onClick={() => setCategory(category === c ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="搜索模板…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {templates.map((t) => (
            <Link key={t.id} to={`/templates/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card" style={{ padding: 12, height: "100%" }}>
                <img
                  src={t.cover || t.coverUrl}
                  alt={t.title}
                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                />
                <h3 style={{ margin: "8px 0 4px", fontSize: 16 }}>{t.title || t.name}</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>{t.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#2563eb" }}>{t.points} 积分</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {t.usageCount} 次 · ♥ {t.favoriteCount}
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 8, fontSize: 12, width: "100%" }}
                  onClick={(e) => void toggleFavorite(t, e)}
                >
                  {t.favorited ? "取消收藏" : "收藏"}
                </button>
              </div>
            </Link>
          ))}
        </div>

        {templates.length === 0 && !error && (
          <p style={{ color: "#64748b", marginTop: 24 }}>暂无模板，请运行数据库 seed。</p>
        )}
      </div>
    </main>
  );
}
