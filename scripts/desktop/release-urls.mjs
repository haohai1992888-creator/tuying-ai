#!/usr/bin/env node

const DEFAULT_REPO = "haohai1992888-creator/tuying-ai";

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
