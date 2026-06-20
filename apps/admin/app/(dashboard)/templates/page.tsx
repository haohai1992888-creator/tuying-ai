"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  isVip: boolean;
  usageCount: number;
  createdAt: string;
}

interface TemplateStats {
  totalUsages: number;
  hotTemplates: Array<{ id: string; name: string; usageCount: number; category: string }>;
  topCategories: Array<{ category: string; count: number }>;
}

const CATEGORIES = ["厨房用品", "家居用品", "美妆护肤", "服装鞋包", "宠物用品", "母婴用品", "节日营销"];

export default function TemplatesAdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: CATEGORIES[0],
    coverUrl: "https://picsum.photos/seed/template/400/300",
    taskType: "scene_image",
    workflowId: "scene-image-workflow",
    promptContent: "将{{product}}放置于{{scene}}，{{style}}，自然光，高端电商摄影，突出商品主体，商业广告风格。",
    isVip: false,
  });

  async function load() {
    const [tRes, sRes] = await Promise.all([
      apiFetch<TemplateRow[]>("/api/admin/templates"),
      apiFetch<TemplateStats>("/api/admin/templates/stats"),
    ]);
    if (!tRes.success) {
      router.push("/login");
      return;
    }
    setRows(tRes.data ?? []);
    setStats(sRes.data ?? null);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/admin/templates", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        promptName: form.name,
        promptVariables: ["product", "scene", "style"],
      }),
    });
    setMessage(res.success ? "模板已创建" : res.message ?? "失败");
    if (res.success) load();
  }

  async function toggleEnabled(row: TemplateRow) {
    await apiFetch(`/api/admin/templates/${row.id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !row.enabled }),
    });
    load();
  }

  async function toggleVip(row: TemplateRow) {
    await apiFetch(`/api/admin/templates/${row.id}`, {
      method: "PUT",
      body: JSON.stringify({ isVip: !row.isVip }),
    });
    load();
  }

  return (
    <div>
      <h1>模板管理</h1>
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          <div className="card" style={{ padding: 12 }}>总使用：{stats.totalUsages}</div>
          <div className="card" style={{ padding: 12 }}>
            热门：{stats.hotTemplates[0]?.name ?? "—"} ({stats.hotTemplates[0]?.usageCount ?? 0})
          </div>
          <div className="card" style={{ padding: 12 }}>
            Top 分类：{stats.topCategories[0]?.category ?? "—"}
          </div>
        </div>
      )}

      <form className="card" style={{ marginTop: 24, display: "grid", gap: 8, maxWidth: 560 }} onSubmit={onCreate}>
        <h3>新增模板</h3>
        <input className="input" placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <textarea className="input" placeholder="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input className="input" placeholder="封面 URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Prompt 模板" value={form.promptContent} onChange={(e) => setForm({ ...form, promptContent: e.target.value })} />
        <label><input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} /> VIP 专属</label>
        <button className="btn" type="submit">创建</button>
        {message && <p>{message}</p>}
      </form>

      <table className="table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>名称</th>
            <th>分类</th>
            <th>VIP</th>
            <th>状态</th>
            <th>使用次数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.category}</td>
              <td>{row.isVip ? "是" : "否"}</td>
              <td>{row.enabled ? "上架" : "下架"}</td>
              <td>{row.usageCount}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => void toggleEnabled(row)}>
                  {row.enabled ? "下架" : "上架"}
                </button>
                <button className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => void toggleVip(row)}>
                  VIP
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
