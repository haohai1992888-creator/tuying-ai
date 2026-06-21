import { useEffect, useState } from "react";
import { ReleaseNotes } from "../components/ReleaseNotes";
import type { DownloadPageInfo } from "../types/download";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_UPDATE_API_BASE ??
  "http://localhost:3001";

function formatBytes(size: number): string {
  if (!size || size <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detectRecommended(): "windows" | "mac" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac") || ua.includes("darwin")) return "mac";
  return "windows";
}

export default function DownloadPage() {
  const [info, setInfo] = useState<DownloadPageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recommended = info?.recommended ?? detectRecommended();

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/download/info`);
        if (!res.ok) throw new Error("无法加载下载信息");
        const body = (await res.json()) as { success?: boolean; data?: DownloadPageInfo };
        setInfo(body.data ?? (body as unknown as DownloadPageInfo));
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    })();
  }, []);

  const version = info?.version ?? "1.0.0";
  const winHref =
    info?.windows.url ?? `${API_BASE}/download/windows/AI-Commerce-Setup.exe`;
  const macHref = info?.mac.url ?? `${API_BASE}/download/mac/AI-Commerce.dmg`;
  const winReady = (info?.windows.size ?? 0) > 0;
  const macReady = (info?.mac.size ?? 0) > 0;

  return (
    <main className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>下载 AI Commerce 桌面客户端</h1>
        <p>{info?.description ?? "Windows 64-bit · macOS Universal Binary"}</p>
        <p style={{ color: "#64748b" }}>
          下载源：<code>{API_BASE}/download</code>
        </p>
        <p style={{ color: "#64748b" }}>
          当前版本：v{version}
          {" · "}
          更新时间：{formatDate(info?.pubDate)}
        </p>

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {!winReady && !macReady && (
          <p style={{ color: "#b45309", marginTop: 12 }}>
            请先在本地启动 API（npm run dev:api），并将安装包放入 download/windows 与 download/mac。
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
          <a
            className={`btn${recommended === "windows" ? "" : " btn-secondary"}`}
            href={winHref}
            download={winReady ? "AI-Commerce-Setup.exe" : undefined}
            style={recommended === "windows" ? { boxShadow: "0 0 0 2px #2563eb" } : undefined}
          >
            下载 Windows
          </a>
          <a
            className={`btn${recommended === "mac" ? "" : " btn-secondary"}`}
            href={macHref}
            download={macReady ? "AI-Commerce.dmg" : undefined}
            style={recommended === "mac" ? { boxShadow: "0 0 0 2px #2563eb" } : undefined}
          >
            下载 macOS
          </a>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 24, fontSize: 14, color: "#475569" }}>
          <div>
            <strong>Windows 64 位</strong>
            {" · "}
            {info?.windows.filename ?? "AI-Commerce-Setup.exe"}
            {" · "}
            {formatBytes(info?.windows.size ?? 0)}
          </div>
          <div>
            <strong>macOS Universal</strong>
            {" · "}
            {info?.mac.filename ?? "AI-Commerce.dmg"}
            {" · "}
            {formatBytes(info?.mac.size ?? 0)}
          </div>
        </div>
      </div>

      <ReleaseNotes notes={info?.releaseNotes ?? [
        { version: "1.0.1", items: ["新增模板市场"] },
        { version: "1.1.0", items: ["新增详情页"] },
      ]} />
    </main>
  );
}
