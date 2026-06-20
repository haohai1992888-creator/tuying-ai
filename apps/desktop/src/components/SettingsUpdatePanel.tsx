import { useState } from "react";
import {
  checkUpdate,
  downloadAndInstallUpdate,
  getCurrentVersion,
  restartAfterUpdate,
} from "../update";
import type { UpdateInfo } from "../services/updateService";
import UpdateDialog from "../components/UpdateDialog";

export function SettingsUpdatePanel() {
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function onCheckUpdate() {
    setChecking(true);
    setMessage("");
    setInfo(null);
    try {
      const latest = await checkUpdate();
      if (!latest?.hasUpdate) {
        setMessage("当前已是最新版本");
        return;
      }
      setInfo(latest);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "检查更新失败");
    } finally {
      setChecking(false);
    }
  }

  async function handleUpdate() {
    if (!info) return;
    setDownloading(true);
    try {
      const mode = await downloadAndInstallUpdate(info, setProgress);
      if (mode === "tauri") {
        await restartAfterUpdate("tauri");
        return;
      }
      setMessage(`v${info.version} 安装包已下载，请运行安装程序后重启。`);
      setInfo(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "更新失败");
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }

  return (
    <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
      <h2 style={{ fontSize: 18 }}>应用更新</h2>
      <p style={{ color: "#64748b", marginTop: 8 }}>
        当前版本：<strong>v{getCurrentVersion()}</strong>
      </p>
      <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => void onCheckUpdate()} disabled={checking}>
        {checking ? "检查中…" : "检查更新"}
      </button>
      {message && <p style={{ marginTop: 12, color: message.includes("最新") ? "#16a34a" : "#475569" }}>{message}</p>}

      {info && (
        <UpdateDialog
          info={info}
          force={info.forceUpdate}
          downloading={downloading}
          progress={progress}
          onUpdate={() => void handleUpdate()}
          onLater={() => setInfo(null)}
        />
      )}
    </section>
  );
}
