import { FormEvent, useState } from "react";
import ModelSelect, { type ModelOption } from "../components/ModelSelect";
import { createTask, getTask, runTask, type TaskRecord } from "../api/task";
import { useGenerationFailure } from "../hooks/useGenerationFailure";
import { trackBehavior } from "../services/beta";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("现代厨房场景");
  const [model, setModel] = useState<ModelOption>("auto");
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { showFailure, failureDialog } = useGenerationFailure();

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    let created: TaskRecord | null = null;

    try {
      void trackBehavior("IMAGE_GENERATE", "generate", { model, prompt });
      created = await createTask({
        type: "scene",
        model,
        prompt,
      });
      setTask(created);

      const run = await runTask(created.id);
      setResult(run.result);
      setTask(run.task ?? (await getTask(created.id)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "生成失败";
      setError(errorMessage);
      showFailure({
        errorMessage,
        taskId: created?.id,
        model: String(model),
        error: errorMessage,
        prompt,
      });
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
      {failureDialog}
      <div className="card">
        <h1>多模型 AI 生成</h1>
        <form onSubmit={handleGenerate}>
          <ModelSelect value={model} onChange={setModel} />
          <textarea
            className="input"
            rows={4}
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "生成中..." : "创建并生成"}
          </button>
        </form>

        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        {task && (
          <div className="card" style={{ marginTop: 16, padding: 12 }}>
            <p>模型: {task.model}</p>
            <p>状态: {task.status}</p>
            {task.outputUrl && (
              <p>
                结果:{" "}
                <a href={task.outputUrl} target="_blank" rel="noreferrer">
                  {task.outputUrl}
                </a>
              </p>
            )}
            {task.outputUrl && !task.outputUrl.startsWith("mock://") && (
              <img src={task.outputUrl} alt="生成结果" style={{ maxWidth: "100%", marginTop: 12 }} />
            )}
            {result && <p>返回: {result}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
