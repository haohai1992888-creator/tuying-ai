import path from "node:path";

export const WIN_INSTALLER = "AI-Commerce-Setup.exe";
export const MAC_DMG = "AI-Commerce.dmg";
export const UPDATE_JSON = "update.json";

export function getDownloadRoot(): string {
  return process.env.DOWNLOAD_DIR?.trim() || path.join(process.cwd(), "download");
}

const DEFAULT_GITHUB_REPO = "haohai1992888-creator/tuying-ai";

export function getReleaseTag(version?: string): string {
  const raw =
    version?.trim() ||
    process.env.VERSION?.trim() ||
    process.env.GITHUB_REF_NAME?.replace(/^v/i, "") ||
    "1.0.0";
  const normalized = raw.replace(/^v/i, "");
  return `v${normalized}`;
}

export function getGithubReleaseBase(_version?: string): string | null {
  // 默认走本地 API 下载中心；仅当显式设置 USE_GITHUB_RELEASES=true 时使用 GitHub Releases
  if (process.env.USE_GITHUB_RELEASES !== "true") return null;
  const repo = process.env.GITHUB_REPOSITORY?.trim() || DEFAULT_GITHUB_REPO;
  return `https://github.com/${repo}/releases/download/${getReleaseTag(_version)}`;
}

export function getDownloadBaseUrl(): string {
  const explicit =
    process.env.DOWNLOAD_BASE_URL?.trim() ||
    process.env.CDN_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const github = getGithubReleaseBase();
  if (github) return github;

  const api =
    process.env.API_PUBLIC_BASE?.trim() ||
    process.env.PUBLIC_API_URL?.trim() ||
    "http://localhost:3001";
  return `${api.replace(/\/$/, "")}/download`;
}

export function getPublicArtifactUrls(version?: string): {
  windows: string;
  mac: string;
  updateJson: string;
} {
  const github = getGithubReleaseBase(version);
  if (github) {
    return {
      windows: `${github}/${WIN_INSTALLER}`,
      mac: `${github}/${MAC_DMG}`,
      updateJson: `${github}/${UPDATE_JSON}`,
    };
  }

  const base = getDownloadBaseUrl();
  const apiBase = base.replace(/\/download$/, "");
  return {
    windows: `${base}/windows/${WIN_INSTALLER}`,
    mac: `${base}/mac/${MAC_DMG}`,
    updateJson: `${apiBase}/update/${UPDATE_JSON}`,
  };
}

export function windowsDir(root = getDownloadRoot()): string {
  return path.join(root, "windows");
}

export function macDir(root = getDownloadRoot()): string {
  return path.join(root, "mac");
}

export function updateDir(root = getDownloadRoot()): string {
  return path.join(root, "update");
}
