import {
  getDownloadBaseUrl,
  MAC_DMG,
  WIN_INSTALLER,
} from "./paths";
import type { DesktopUpdateJson, ReleaseNoteEntry } from "./types";

type RawUpdateJson = {
  version: string;
  notes?: string | string[];
  pub_date?: string;
  title?: string;
  description?: string;
  releaseNotes?: ReleaseNoteEntry[];
  downloads?: DesktopUpdateJson["downloads"];
  platforms?: DesktopUpdateJson["platforms"];
};

function notesToArray(notes: string | string[] | undefined): string[] {
  if (!notes) return [];
  if (typeof notes === "string") return [notes];
  return notes;
}

function notesToReleaseNotes(notes: string | string[] | undefined, version: string): ReleaseNoteEntry[] {
  const items = notesToArray(notes);
  if (!items.length) return [{ version, items: ["版本更新"] }];
  return [{ version, items }];
}

/** Accepts minimal `{ version, notes }` and full desktop update payloads. */
export function normalizeUpdateJson(raw: RawUpdateJson): DesktopUpdateJson {
  const base = getDownloadBaseUrl();
  const noteLines = notesToArray(raw.notes);
  const releaseNotes =
    raw.releaseNotes ??
    (noteLines.length
      ? [{ version: raw.version, items: noteLines }]
      : notesToReleaseNotes(raw.notes, raw.version));

  return {
    version: raw.version,
    pub_date: raw.pub_date ?? new Date().toISOString(),
    title: raw.title ?? `AI Commerce Desktop v${raw.version}`,
    description: raw.description ?? noteLines[0] ?? "Windows 64-bit · macOS Universal Binary",
    notes: noteLines.length ? noteLines : releaseNotes.flatMap((r) => r.items),
    releaseNotes,
    downloads: raw.downloads ?? {
      windows: {
        url: `${base}/windows/${WIN_INSTALLER}`,
        filename: WIN_INSTALLER,
        size: 0,
      },
      mac: {
        url: `${base}/mac/${MAC_DMG}`,
        filename: MAC_DMG,
        size: 0,
      },
    },
    platforms: raw.platforms,
  };
}
