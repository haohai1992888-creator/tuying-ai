import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
