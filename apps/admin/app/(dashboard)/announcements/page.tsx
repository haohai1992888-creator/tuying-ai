"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  enabled: boolean;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await apiFetch<Announcement[]>("/api/admin/beta/announcements");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setItems(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function create() {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400000);
    const res = await apiFetch("/api/admin/beta/announcements", {
      method: "POST",
      body: JSON.stringify({
        title,
        content,
        startAt: now.toISOString(),
        endAt: end.toISOString(),
      }),
    });
    setMessage(res.success ? "已发布" : (res.message ?? "失败"));
    setTitle("");
    setContent("");
    load();
  }

  async function toggle(id: string, enabled: boolean) {
    await apiFetch(`/api/admin/beta/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !enabled }),
    });
    load();
  }

  return (
    <div>
      <h1>系统公告</h1>
      {message && <p>{message}</p>}
      <div style={{ display: "grid", gap: 8, marginTop: 16, maxWidth: 480 }}>
        <input className="input" placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input" rows={3} placeholder="内容" value={content} onChange={(e) => setContent(e.target.value)} />
        <button className="btn" onClick={create}>发布公告</button>
      </div>
      {items.map((a) => (
        <div key={a.id} className="card" style={{ marginTop: 16, padding: 16 }}>
          <strong>{a.title}</strong>
          <p>{a.content}</p>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {new Date(a.startAt).toLocaleDateString()} — {new Date(a.endAt).toLocaleDateString()}
            · {a.enabled ? "启用" : "停用"}
          </p>
          <button className="btn btn-secondary" onClick={() => toggle(a.id, a.enabled)}>
            {a.enabled ? "停用" : "启用"}
          </button>
        </div>
      ))}
    </div>
  );
}
