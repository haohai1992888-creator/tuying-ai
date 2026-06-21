import { Link } from "react-router-dom";
import { logout } from "../../services/api";

interface TopBarProps {
  points?: number;
  userName?: string;
}

export function TopBar({ points = 12450, userName = "小智电商" }: TopBarProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__spacer" />
      <Link to="/membership" className="app-topbar__upgrade">
        升级会员
      </Link>
      <div className="app-topbar__points">
        <span>积分</span>
        <strong>{points.toLocaleString("zh-CN")}</strong>
      </div>
      <button type="button" className="app-topbar__upgrade" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
        🔔
      </button>
      <div className="app-topbar__user">
        <div className="app-topbar__avatar">{userName.slice(0, 1)}</div>
        <div>
          <div>{userName}</div>
          <span className="app-topbar__vip">VIP</span>
        </div>
      </div>
      <button
        type="button"
        className="app-topbar__upgrade"
        style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}
        onClick={() => {
          logout();
          window.location.href = "/login";
        }}
      >
        退出
      </button>
    </header>
  );
}
