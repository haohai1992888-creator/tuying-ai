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

export interface DesktopUpdateJson {
  version: string;
  pub_date: string;
  title: string;
  description: string;
  notes: string[];
  releaseNotes: ReleaseNoteEntry[];
  downloads: {
    windows: DownloadFileInfo;
    mac: DownloadFileInfo;
  };
  platforms?: Record<string, { signature: string; url: string }>;
}
