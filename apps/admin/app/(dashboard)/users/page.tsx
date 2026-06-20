"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface UserRow {
  id: string;
  email: string | null;
  nickname: string | null;
  role: string;
  points: number;
  status: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const res = await apiFetch<UserRow[]>("/api/admin/users");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setUsers(res.data ?? []);
  }

  useEffect(() => {
    loadUsers();
  }, [router]);

  async function patchUser(id: string, body: Record<string, unknown>) {
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setMessage(res.success ? "已更新" : (res.message ?? "更新失败"));
    loadUsers();
  }

  return (
    <div>
      <h1>用户管理</h1>
      {message && <p>{message}</p>}
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>昵称</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>积分</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.nickname ?? "-"}</td>
              <td>{user.email ?? "-"}</td>
              <td>{user.role}</td>
              <td>{user.points}</td>
              <td>{user.status}</td>
              <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" onClick={() => patchUser(user.id, { status: "BANNED" })}>
                  封禁
                </button>
                <button className="btn btn-secondary" onClick={() => patchUser(user.id, { status: "ACTIVE" })}>
                  解封
                </button>
                <button className="btn btn-secondary" onClick={() => patchUser(user.id, { pointsDelta: 50 })}>
                  +50 积分
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    patchUser(user.id, {
                      role: "VIP",
                      vipExpireAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                    })
                  }
                >
                  设 VIP
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
