import { useEffect, useState } from "react";
import { ReleaseNotes } from "../components/ReleaseNotes";
import type { DownloadPageInfo } from "../types/download";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_UPDATE_API_BASE ??
  "http://localhost:3001";

const GITHUB_RELEASES_URL =
  import.meta.env.VITE_GITHUB_RELEASES_URL ??
  "https://github.com/haohai1992888-creator/tuying-ai/releases";

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
  const winReady = (info?.windows.size ?? 0) > 0;
  const macReady = (info?.mac.size ?? 0) > 0;
  const winHref = winReady
    ? (info?.windows.url ?? `${API_BASE}/download/windows/AI-Commerce-Setup.exe`)
    : GITHUB_RELEASES_URL;
  const macHref = macReady
    ? (info?.mac.url ?? `${API_BASE}/download/mac/AI-Commerce.dmg`)
    : GITHUB_RELEASES_URL;

  return (
    <main className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>下载 AI Commerce 桌面客户端</h1>
        <p>{info?.description ?? "Windows 64-bit · macOS Universal Binary"}</p>
        <p style={{ color: "#64748b" }}>
          当前版本：v{version}
          {" · "}
          更新时间：{formatDate(info?.pubDate)}
        </p>

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {!winReady && !macReady && (
          <p style={{ color: "#b45309", marginTop: 12 }}>
            本地尚未放置安装包（GitHub Actions 构建完成后可从 Releases 下载，或手动放入 download/windows 与 download/mac）。
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
          <a
            className={`btn${recommended === "windows" ? "" : " btn-secondary"}`}
            href={winHref}
            download={winReady}
            target={winReady ? undefined : "_blank"}
            rel={winReady ? undefined : "noreferrer"}
            style={recommended === "windows" ? { boxShadow: "0 0 0 2px #2563eb" } : undefined}
          >
            {winReady ? "下载 Windows" : "前往 GitHub 下载 Windows"}
          </a>
          <a
            className={`btn${recommended === "mac" ? "" : " btn-secondary"}`}
            href={macHref}
            download={macReady}
            target={macReady ? undefined : "_blank"}
            rel={macReady ? undefined : "noreferrer"}
            style={recommended === "mac" ? { boxShadow: "0 0 0 2px #2563eb" } : undefined}
          >
            {macReady ? "下载 macOS" : "前往 GitHub 下载 macOS"}
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
