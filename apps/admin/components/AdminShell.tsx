"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/client";

const links = [
  { href: "/", label: "仪表盘" },
  { href: "/users", label: "用户管理" },
  { href: "/orders", label: "订单管理" },
  { href: "/packages", label: "套餐管理" },
  { href: "/points", label: "积分管理" },
  { href: "/tasks", label: "任务管理" },
  { href: "/ai-tasks", label: "AI 任务管理" },
  { href: "/model-monitor", label: "模型监控" },
  { href: "/batch-monitor", label: "批量监控" },
  { href: "/membership", label: "会员管理" },
  { href: "/versions", label: "版本管理" },
  { href: "/templates", label: "模板管理" },
  { href: "/video-tasks", label: "视频任务中心" },
  { href: "/data-center", label: "数据中心" },
  { href: "/beta-users", label: "Beta Users" },
  { href: "/invite-codes", label: "Invite Codes" },
  { href: "/feedback", label: "Feedback" },
  { href: "/cost-center", label: "Cost Center" },
  { href: "/system-health", label: "System Health" },
  { href: "/beta-report", label: "Beta Report" },
  { href: "/announcements", label: "系统公告" },
  { href: "/workflows", label: "工作流管理" },
  { href: "/workflow-runs", label: "运行记录" },
  { href: "/files", label: "文件管理" },
  { href: "/settings", label: "系统配置" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="nav">
        <span className="nav-brand">ACS Admin</span>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
        >
          退出
        </button>
      </nav>
      <div className="admin-layout">
        <aside className="sidebar">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </aside>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
