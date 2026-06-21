import { Link, useLocation } from "react-router-dom";
import { SIDEBAR_NAV } from "./navItems";

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__logo">AI</div>
        <span>AI Commerce Studio</span>
      </div>

      <nav className="app-sidebar__nav">
        {SIDEBAR_NAV.map((item) => {
          const active =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-sidebar__link${active ? " active" : ""}`}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar__promo">
        <strong>邀请好友得积分</strong>
        每邀请 1 位好友注册，双方各得 500 积分
      </div>
    </aside>
  );
}
