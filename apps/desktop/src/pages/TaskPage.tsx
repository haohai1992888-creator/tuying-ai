import { FormEvent, useState } from "react";
import { createTask, getTask, runTask, type TaskRecord } from "../api/task";

export default function TaskPage() {
  const [prompt, setPrompt] = useState("现代厨房场景");
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    let created: TaskRecord | null = null;

    try {
      created = await createTask({
        type: "scene",
        prompt,
      });
      setTask(created);

      const run = await runTask(created.id);
      setResult(run.result);
      setTask(run.task ?? (await getTask(created.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "任务执行失败");
      if (created?.id) {
        try {
          setTask(await getTask(created.id));
        } catch {
          // ignore refresh error
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <h1>AI 任务 / Workflow</h1>
        <form onSubmit={handleCreate}>
          <input
            className="input"
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "执行中..." : "创建并执行"}
          </button>
        </form>

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {task && (
          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <p>ID: {task.id}</p>
            <p>类型: {task.type}</p>
            <p>状态: {task.status}</p>
            <p>Prompt: {task.prompt}</p>
            {task.outputUrl && <p>输出: {task.outputUrl}</p>}
            {task.error && <p style={{ color: "#dc2626" }}>错误: {task.error}</p>}
            {result && <p>结果: {result}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
