import type { ReleaseNoteEntry } from "../types/download";

interface ReleaseNotesProps {
  notes: ReleaseNoteEntry[];
}

export function ReleaseNotes({ notes }: ReleaseNotesProps) {
  if (!notes.length) return null;

  return (
    <section className="card" style={{ marginTop: 24 }}>
      <h2 style={{ marginTop: 0 }}>更新日志</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {notes.map((entry) => (
          <div key={entry.version}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>v{entry.version}</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
