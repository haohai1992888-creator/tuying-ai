"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface InviteCode {
  id: string;
  code: string;
  maxCount: number;
  usedCount: number;
  expiresAt: string | null;
  usages?: Array<{ userLabel: string; createdAt: string }>;
}

export default function InviteCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [code, setCode] = useState("BETA2026");
  const [maxCount, setMaxCount] = useState(20);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await apiFetch<InviteCode[]>("/api/admin/beta/invite-codes");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setCodes(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function create() {
    const res = await apiFetch("/api/admin/beta/invite-codes", {
      method: "POST",
      body: JSON.stringify({ code, maxCount }),
    });
    setMessage(res.success ? "已创建" : (res.message ?? "失败"));
    load();
  }

  async function remove(id: string) {
    const res = await apiFetch(`/api/admin/beta/invite-codes/${id}`, { method: "DELETE" });
    setMessage(res.success ? "已删除" : (res.message ?? "失败"));
    load();
  }

  return (
    <div>
      <h1>Invite Codes</h1>
      {message && <p>{message}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
        <input
          className="input"
          type="number"
          value={maxCount}
          onChange={(e) => setMaxCount(Number(e.target.value))}
          style={{ width: 100 }}
        />
        <button className="btn" onClick={create}>创建邀请码</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>邀请码</th>
            <th>使用</th>
            <th>到期</th>
            <th>最近使用</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.usedCount}/{c.maxCount}</td>
              <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "不限"}</td>
              <td>{c.usages?.[0]?.userLabel ?? "-"}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => remove(c.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
