import { FormEvent, useState } from "react";
import { submitIssueReport } from "../services/beta";
import type { FailureContext } from "../hooks/useGenerationFailure";

interface FeedbackDialogProps {
  context: FailureContext;
  onClose: () => void;
}

export default function FeedbackDialog({ context, onClose }: FeedbackDialogProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitIssueReport({
      content: content.trim() || "生成失败，请协助排查",
      taskId: context.taskId,
      model: context.model,
      error: context.error ?? context.errorMessage,
      prompt: context.prompt,
    });
    setMessage(res.success ? "问题已提交，感谢反馈！" : (res.message ?? "提交失败"));
    setSubmitting(false);
    if (res.success) {
      setTimeout(onClose, 1200);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      }}
    >
      <div className="card" style={{ width: 480, padding: 24, maxWidth: "90vw" }}>
        <h2>生成失败</h2>
        <p style={{ color: "#dc2626", marginTop: 8 }}>{context.errorMessage}</p>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 12 }}>
          {context.taskId && <p>Task: {context.taskId}</p>}
          {context.model && <p>Model: {context.model}</p>}
          {context.prompt && <p>Prompt: {context.prompt.slice(0, 120)}</p>}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <textarea
            className="input"
            rows={3}
            placeholder="补充说明（可选）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              关闭
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "提交中…" : "提交问题"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
