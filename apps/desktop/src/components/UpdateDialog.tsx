import type { UpdateInfo } from "../services/updateService";
import { snoozeUpdate } from "../store/update";

interface UpdateDialogProps {
  info: UpdateInfo;
  force?: boolean;
  downloading: boolean;
  progress: number;
  onUpdate: () => void;
  onLater: () => void;
}

export default function UpdateDialog({
  info,
  force,
  downloading,
  progress,
  onUpdate,
  onLater,
}: UpdateDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div className="card" style={{ width: 420, padding: 24, maxWidth: "90vw" }}>
        <h2>{force ? "必须更新" : "发现新版本"}</h2>
        <p style={{ marginTop: 8 }}>
          <strong>v{info.version}</strong> — {info.title}
        </p>
        <p style={{ color: "#64748b", marginTop: 8, whiteSpace: "pre-wrap" }}>{info.description}</p>
        {info.releaseNotes && info.releaseNotes.length > 0 && (
          <ul style={{ marginTop: 12, paddingLeft: 20, color: "#475569" }}>
            {info.releaseNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
        {downloading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ background: "#e2e8f0", borderRadius: 4, height: 8 }}>
              <div style={{ width: `${progress}%`, background: "#2563eb", height: "100%", borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>下载中 {progress}%</p>
          </div>
        )}
        <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {!force && (
            <button className="btn btn-secondary" disabled={downloading} onClick={() => { snoozeUpdate(); onLater(); }}>
              稍后提醒
            </button>
          )}
          <button className="btn" disabled={downloading} onClick={onUpdate}>
            {downloading ? "下载中…" : "立即更新"}
          </button>
        </div>
      </div>
    </div>
  );
}
