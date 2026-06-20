import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACS Admin",
  description: "AI Commerce Studio 管理后台 — Phase 2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
