export interface ReleaseNoteEntry {
  version: string;
  date?: string;
  items: string[];
}

export interface DownloadFileInfo {
  url: string;
  filename: string;
  size: number;
  sha256?: string;
}

export interface DesktopUpdateJson {
  version: string;
  pub_date: string;
  title: string;
  description: string;
  notes: string | string[];
  releaseNotes: ReleaseNoteEntry[];
  downloads: {
    windows: DownloadFileInfo;
    mac: DownloadFileInfo;
  };
  /** Tauri updater compatible platform map */
  platforms?: Record<string, { signature: string; url: string }>;
}

export interface DownloadPageInfo {
  version: string;
  title: string;
  description: string;
  pubDate: string;
  releaseNotes: ReleaseNoteEntry[];
  windows: DownloadFileInfo;
  mac: DownloadFileInfo;
  recommended: "windows" | "mac";
}
