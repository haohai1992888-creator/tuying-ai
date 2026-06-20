"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface VersionRow {
  id: string;
  version: string;
  title: string;
  description: string;
  downloadUrl: string;
  forceUpdate: boolean;
  channel: string;
  published: boolean;
  downloadCount: number;
  createdAt: string;
}

interface VersionStats {
  totalDownloads: number;
  upgradeRate: number;
  activeVersions: string[];
  versionDownloads: Array<{ version: string; count: number }>;
}

export default function VersionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    version: "1.0.1",
    title: "",
    description: "",
    downloadUrl: "",
    downloadUrlWin: "",
    downloadUrlMac: "",
    forceUpdate: false,
    channel: "STABLE",
    releaseNote: "",
  });

  async function load() {
    const [vRes, sRes] = await Promise.all([
      apiFetch<VersionRow[]>("/api/admin/versions"),
      apiFetch<VersionStats>("/api/admin/versions/stats"),
    ]);
    if (!vRes.success) {
      router.push("/login");
      return;
    }
    setRows(vRes.data ?? []);
    setStats(sRes.data ?? null);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await apiFetch<VersionRow>("/api/admin/versions", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setMessage(res.success ? "版本已创建（待发布）" : res.message ?? "失败");
    if (res.success) load();
  }

  async function publish(id: string) {
    const res = await apiFetch(`/api/admin/versions/${id}/publish`, { method: "POST" });
    setMessage(res.success ? "已发布" : res.message ?? "失败");
    if (res.success) load();
  }

  return (
    <div>
      <h1>版本管理</h1>
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          <div className="card" style={{ padding: 12 }}>总下载：{stats.totalDownloads}</div>
          <div className="card" style={{ padding: 12 }}>升级率：{stats.upgradeRate}%</div>
          <div className="card" style={{ padding: 12 }}>活跃版本：{stats.activeVersions.join(", ") || "—"}</div>
        </div>
      )}

      <form className="card" style={{ marginTop: 24, display: "grid", gap: 8, maxWidth: 560 }} onSubmit={onCreate}>
        <h3>新增版本</h3>
        <input className="input" placeholder="版本号 1.0.1" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} required />
        <input className="input" placeholder="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="input" placeholder="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        <input className="input" placeholder="下载地址（通用）" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} required />
        <input className="input" placeholder="Windows 安装包 URL" value={form.downloadUrlWin} onChange={(e) => setForm({ ...form, downloadUrlWin: e.target.value })} />
        <input className="input" placeholder="macOS 安装包 URL" value={form.downloadUrlMac} onChange={(e) => setForm({ ...form, downloadUrlMac: e.target.value })} />
        <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
          <option value="STABLE">stable 正式版</option>
          <option value="BETA">beta 测试版</option>
        </select>
        <label><input type="checkbox" checked={form.forceUpdate} onChange={(e) => setForm({ ...form, forceUpdate: e.target.checked })} /> 强制更新</label>
        <textarea className="input" placeholder="更新日志" value={form.releaseNote} onChange={(e) => setForm({ ...form, releaseNote: e.target.value })} rows={3} />
        <button className="btn" type="submit">创建版本</button>
        {message && <p>{message}</p>}
      </form>

      <table className="table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>版本</th>
            <th>标题</th>
            <th>渠道</th>
            <th>强制</th>
            <th>状态</th>
            <th>下载次数</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.version}</td>
              <td>{row.title}</td>
              <td>{row.channel}</td>
              <td>{row.forceUpdate ? "是" : "否"}</td>
              <td>{row.published ? "已发布" : "草稿"}</td>
              <td>{row.downloadCount}</td>
              <td>{new Date(row.createdAt).toLocaleString()}</td>
              <td>
                {!row.published && (
                  <button className="btn btn-secondary" onClick={() => void publish(row.id)}>发布</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
