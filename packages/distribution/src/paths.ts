import path from "node:path";

export const WIN_INSTALLER = "AI-Commerce-Setup.exe";
export const MAC_DMG = "AI-Commerce.dmg";
export const UPDATE_JSON = "update.json";

export function getDownloadRoot(): string {
  return process.env.DOWNLOAD_DIR?.trim() || path.join(process.cwd(), "download");
}

export function getDownloadBaseUrl(): string {
  return (
    process.env.DOWNLOAD_BASE_URL?.trim() ||
    process.env.CDN_PUBLIC_BASE_URL?.trim() ||
    `${process.env.API_PUBLIC_BASE?.trim() || process.env.PUBLIC_API_URL?.trim() || "http://localhost:3001"}/download`
  ).replace(/\/$/, "");
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
