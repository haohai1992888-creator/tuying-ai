"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, saveTokens } from "@/lib/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState("admin@acs.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await apiFetch<{
      tokens: { accessToken: string; refreshToken: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ account, password }),
    });

    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "登录失败");
      return;
    }

    saveTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    router.push("/");
  }

  return (
    <main className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="card">
        <h1>管理后台登录</h1>
        <form onSubmit={handleSubmit}>
          <input
            className="input"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="管理员邮箱"
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
