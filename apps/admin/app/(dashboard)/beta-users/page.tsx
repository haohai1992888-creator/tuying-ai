"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface BetaUser {
  id: string;
  email: string | null;
  nickname: string | null;
  points: number;
  betaPoints: number;
  betaExpireAt: string | null;
  status: string;
}

export default function BetaUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await apiFetch<BetaUser[]>("/api/admin/beta/users");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setUsers(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function addUser() {
    const res = await apiFetch("/api/admin/beta/users", {
      method: "POST",
      body: JSON.stringify({ email, expireDays: 30 }),
    });
    setMessage(res.success ? "已添加内测用户" : (res.message ?? "添加失败"));
    if (res.success) {
      setEmail("");
      load();
    }
  }

  async function removeUser(userId: string) {
    const res = await apiFetch(`/api/admin/beta/users/${userId}`, { method: "DELETE" });
    setMessage(res.success ? "已移除" : (res.message ?? "失败"));
    load();
  }

  async function extendUser(userId: string, days: number) {
    const res = await apiFetch(`/api/admin/beta/users/${userId}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
    setMessage(res.success ? `已延长 ${days} 天` : (res.message ?? "失败"));
    load();
  }

  async function gift(userId: string, amount: number) {
    const res = await apiFetch(`/api/admin/beta/users/${userId}/gift`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    setMessage(res.success ? `已赠送 ${amount} 积分` : (res.message ?? "失败"));
    load();
  }

  return (
    <div>
      <h1>Beta Users</h1>
      <p style={{ color: "#64748b" }}>内测用户管理 · 添加 / 删除 / 延长 / 赠送积分</p>
      {message && <p>{message}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          className="input"
          placeholder="用户邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" onClick={addUser}>添加内测用户</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>用户</th>
            <th>积分</th>
            <th>内测积分</th>
            <th>到期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.nickname ?? u.email ?? u.id.slice(0, 8)}</td>
              <td>{u.points}</td>
              <td>{u.betaPoints}</td>
              <td>{u.betaExpireAt ? new Date(u.betaExpireAt).toLocaleDateString() : "-"}</td>
              <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={() => extendUser(u.id, 30)}>+30天</button>
                <button className="btn btn-secondary" onClick={() => gift(u.id, 100)}>+100</button>
                <button className="btn btn-secondary" onClick={() => gift(u.id, 500)}>+500</button>
                <button className="btn btn-secondary" onClick={() => gift(u.id, 1000)}>+1000</button>
                <button className="btn btn-secondary" onClick={() => removeUser(u.id)}>移除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
