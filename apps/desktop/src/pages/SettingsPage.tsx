import { useEffect, useState } from "react";
import {
  getPreferredProvider,
  MODEL_OPTIONS,
  setPreferredProvider,
  type ModelPreference,
} from "../store/settings";
import {
  getReleaseChannel,
  setReleaseChannel,
  type ReleaseChannel,
} from "../store/update";
import { getCurrentVersion } from "../services/updateService";
import { SettingsUpdatePanel } from "../components/SettingsUpdatePanel";

export default function SettingsPage() {
  const [preference, setPreference] = useState<ModelPreference>("auto");
  const [channel, setChannel] = useState<ReleaseChannel>("STABLE");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreference(getPreferredProvider());
    setChannel(getReleaseChannel());
  }, []);

  function onSave() {
    setPreferredProvider(preference);
    setReleaseChannel(channel);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="container">
      <div className="card">
        <h1>高级设置</h1>
        <p style={{ color: "#64748b", marginBottom: 8 }}>当前客户端版本：v{getCurrentVersion()}</p>
        <p style={{ color: "#64748b", marginBottom: 20 }}>
          配置 AI 模型偏好。默认「自动选择」由智能路由根据任务类型、积分与用户等级决定。
        </p>

        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>模型偏好</label>
        <select
          className="input"
          value={preference}
          onChange={(e) => setPreference(e.target.value as ModelPreference)}
        >
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label style={{ display: "block", marginTop: 20, marginBottom: 8, fontWeight: 600 }}>更新渠道</label>
        <select
          className="input"
          value={channel}
          onChange={(e) => setChannel(e.target.value as ReleaseChannel)}
        >
          <option value="STABLE">正式版 (stable)</option>
          <option value="BETA">测试版 (beta)</option>
        </select>

        <button className="btn" style={{ marginTop: 16 }} onClick={onSave}>
          保存设置
        </button>
        {saved && <p style={{ color: "#16a34a", marginTop: 12 }}>已保存</p>}

        <SettingsUpdatePanel />

        <div style={{ marginTop: 32, fontSize: 14, color: "#64748b" }}>
          <h3 style={{ color: "#334155" }}>路由规则（自动模式）</h3>
          <ul>
            <li>场景图 → GPT Image 2</li>
            <li>中文海报 → Seedream</li>
            <li>模特图 → Seedream</li>
            <li>白底图 / 批量 → Gemini</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            积分不足时自动降级：GPT → Seedream → Gemini。单模型失败时自动故障转移。
          </p>
        </div>
      </div>
    </main>
  );
}
