import { useEffect, useState } from "react";
import { getAccessToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

interface Profile {
  id: string;
  email: string | null;
  nickname: string | null;
  points: number;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError("未登录");
      return;
    }

    fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = (await res.json()) as {
          id?: string;
          email?: string | null;
          nickname?: string | null;
          balance?: number;
          points?: number;
          role?: string;
          message?: string;
        };
        if (!res.ok || !json.id) {
          setError(json.message ?? "加载失败");
          return;
        }
        setProfile({
          id: json.id,
          email: json.email ?? null,
          nickname: json.nickname ?? json.email ?? null,
          points: json.balance ?? json.points ?? 0,
          role: json.role ?? "USER",
        });
      })
      .catch(() => {
        setError(`无法连接 API（${API_BASE}），请先运行 npm run dev:api`);
      });
  }, []);

  if (error) {
    return (
      <main className="container">
        <div className="card">
          <p style={{ color: "#dc2626" }}>{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) return <main className="container">加载中...</main>;

  return (
    <main className="container">
      <div className="card">
        <h1>个人中心</h1>
        <p>邮箱: {profile.email ?? "-"}</p>
        <p>昵称: {profile.nickname ?? "-"}</p>
        <p>角色: {profile.role}</p>
        <p>积分: {profile.points}</p>
      </div>
    </main>
  );
}
