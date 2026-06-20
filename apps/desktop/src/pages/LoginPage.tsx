import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveTokens } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export default function LoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.trim(), password }),
      });
      const json = (await res.json()) as {
        token?: string;
        message?: string;
      };

      if (!res.ok || !json.token) {
        setError(json.message ?? "登录失败");
        return;
      }

      saveTokens(json.token, json.token);
      navigate("/profile");
    } catch {
      setError(`无法连接 API（${API_BASE}）。请先运行：npm run dev:api`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h1>登录</h1>
        <form onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="邮箱"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className="input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
        {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
        <p style={{ marginTop: 12 }}>
          <Link to="/register">注册</Link>
        </p>
      </div>
    </main>
  );
}
