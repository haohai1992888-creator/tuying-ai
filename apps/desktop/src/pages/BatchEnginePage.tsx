import { FormEvent, useState } from "react";
import { createBatch, getBatch, runBatch, type BatchRecord } from "../api/batch";

const DEFAULT_PROMPTS = ["厨房场景", "客厅场景", "卧室场景"];

export default function BatchEnginePage() {
  const [promptText, setPromptText] = useState(DEFAULT_PROMPTS.join("\n"));
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress =
    batch && batch.total > 0 ? Math.round(((batch.completed + batch.failed) / batch.total) * 100) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const prompts = promptText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      const created = await createBatch(prompts);
      setBatch(created);

      const run = await runBatch(created.id);
      setBatch(run.batch ?? (await getBatch(created.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "批量执行失败");
      if (batch?.id) {
        try {
          setBatch(await getBatch(batch.id));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <div className="card">
        <h1>批量生成（Batch Engine）</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            className="input"
            rows={6}
            placeholder="每行一个 Prompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "执行中..." : "创建并执行批量任务"}
          </button>
        </form>

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {batch && (
          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <p>Batch ID: {batch.id}</p>
            <p>
              进度: {batch.completed + batch.failed}/{batch.total}（成功 {batch.completed}，失败 {batch.failed}）
            </p>
            <p>状态: {batch.status}</p>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, marginTop: 8 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#2563eb",
                  borderRadius: 4,
                }}
              />
            </div>
            {batch.tasks && (
              <ul style={{ marginTop: 12, fontSize: 13 }}>
                {batch.tasks.map((task) => (
                  <li key={task.id}>
                    {task.prompt} — {task.status}
                    {task.outputUrl ? ` · ${task.outputUrl}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
