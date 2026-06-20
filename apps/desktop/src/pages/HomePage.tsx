import { Link } from "react-router-dom";
import { getCurrentVersion } from "../services/updateService";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>AI Commerce Studio Desktop</h1>
        <p>正式版 · v{getCurrentVersion()}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Link className="btn" to="/download">下载客户端</Link>
          <Link className="btn" to="/login">登录</Link>
          <Link className="btn" to="/tasks">我的任务</Link>
          <Link className="btn btn-secondary" to="/register">内测注册</Link>
        </div>
      </div>
    </main>
  );
}
