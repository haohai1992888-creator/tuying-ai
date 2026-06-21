#!/usr/bin/env node

const DEFAULT_REPO = "haohai1992888-creator/tuying-ai";
/** Baked into desktop release when no VITE_API_BASE secret is set. */
const DEFAULT_PRODUCTION_API = "https://tuyingai.top";

export function resolveVersion(inputVersion) {
  const refName = process.env.GITHUB_REF_NAME?.trim() || "";
  return (
    process.env.VERSION?.trim() ||
    inputVersion?.trim() ||
    (refName.startsWith("v") ? refName.slice(1) : refName || "1.0.0")
  );
}

export function getGithubRepo() {
  return process.env.GITHUB_REPOSITORY?.trim() || DEFAULT_REPO;
}

export function getReleaseTag(version) {
  const normalized = String(version ?? resolveVersion()).replace(/^v/i, "");
  return `v${normalized}`;
}

export function getGithubReleaseBase(version) {
  const repo = getGithubRepo();
  const tag = getReleaseTag(version);
  return `https://github.com/${repo}/releases/download/${tag}`;
}

/** Resolve HTTPS download/update URLs for CI release builds. */
export function resolveReleaseUrls(version = resolveVersion()) {
  const cdnBase =
    process.env.DOWNLOAD_BASE_URL?.trim()?.replace(/\/$/, "") ||
    process.env.CDN_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "");

  if (cdnBase) {
    return {
      mode: "cdn",
      downloadBaseUrl: cdnBase,
      updateJsonUrl:
        process.env.VITE_UPDATE_JSON_URL?.trim() || `${cdnBase}/update.json`,
      winUrl: `${cdnBase}/windows/AI-Commerce-Setup.exe`,
      macUrl: `${cdnBase}/mac/AI-Commerce.dmg`,
      githubReleasesUrl: `https://github.com/${getGithubRepo()}/releases`,
    };
  }

  const githubBase = getGithubReleaseBase(version);
  return {
    mode: "github",
    downloadBaseUrl: githubBase,
    updateJsonUrl:
      process.env.VITE_UPDATE_JSON_URL?.trim() || `${githubBase}/update.json`,
    winUrl: `${githubBase}/AI-Commerce-Setup.exe`,
    macUrl: `${githubBase}/AI-Commerce.dmg`,
    githubReleasesUrl: `https://github.com/${getGithubRepo()}/releases`,
  };
}

/** API base URL baked into desktop production build (Vite). */
export function resolveApiBaseUrl() {
  const explicit =
    process.env.VITE_API_BASE?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.API_PUBLIC_BASE?.trim() ||
    process.env.PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const downloadBase =
    process.env.DOWNLOAD_BASE_URL?.trim()?.replace(/\/$/, "") ||
    process.env.CDN_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "");
  if (downloadBase && !downloadBase.includes("github.com")) {
    return downloadBase.replace(/\/download$/, "") || downloadBase;
  }

  if (process.env.CI === "true") {
    return DEFAULT_PRODUCTION_API;
  }

  return "http://localhost:3001";
}
