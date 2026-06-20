import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("BETA2026");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("请填写邮箱和密码");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, inviteCode: inviteCode.trim() }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };

      if (!res.ok || !json.success) {
        setError(json.message ?? "注册失败");
        return;
      }

      setMessage("注册成功，请登录。内测邀请码已自动兑换。");
      setTimeout(() => navigate("/login"), 800);
    } catch {
      setError(`无法连接 API（${API_BASE}）。请先运行：npm run dev:api`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h1>内测注册</h1>
        <form onSubmit={onSubmit}>
          <input
            className="input"
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <input
            className="input"
            placeholder="邀请码（如 BETA2026）"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "注册中…" : "注册并加入内测"}
          </button>
        </form>
        {error && <p style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
        {message && <p style={{ color: "#16a34a", marginTop: 12 }}>{message}</p>}
        <p style={{ marginTop: 12 }}>
          <Link to="/login">登录</Link>
        </p>
      </div>
    </main>
  );
}
