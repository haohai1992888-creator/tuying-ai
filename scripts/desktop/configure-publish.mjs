#!/usr/bin/env node
/**
 * Apply publish-time Tauri updater endpoint + Vite env from CI/release settings.
 * Falls back to GitHub Releases HTTPS URLs (Tauri updater requires https).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveReleaseUrls, resolveVersion } from "./release-urls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const confPath = path.join(root, "apps/desktop/src-tauri/tauri.conf.json");
const publishPath = path.join(root, "apps/desktop/publish.config.json");
const viteEnvPath = path.join(root, "apps/desktop/.env.production.local");

const version = resolveVersion();
const urls = resolveReleaseUrls(version);

const conf = JSON.parse(readFileSync(confPath, "utf8"));
conf.plugins ??= {};
conf.plugins.updater ??= {};
conf.plugins.updater.active = true;
conf.plugins.updater.endpoints = [urls.updateJsonUrl];
conf.plugins.updater.dialog = false;

writeFileSync(confPath, `${JSON.stringify(conf, null, 2)}\n`, "utf8");

const publish = {
  version,
  updaterEndpoint: urls.updateJsonUrl,
  downloadBaseUrl: urls.downloadBaseUrl,
  artifacts: {
    windows: "AI-Commerce-Setup.exe",
    mac: "AI-Commerce.dmg",
    updateJson: "update.json",
  },
};

writeFileSync(publishPath, `${JSON.stringify(publish, null, 2)}\n`, "utf8");

const viteEnv = [
  `VITE_UPDATE_JSON_URL=${urls.updateJsonUrl}`,
  `VITE_DOWNLOAD_BASE_URL=${urls.downloadBaseUrl}`,
  `VITE_GITHUB_RELEASES_URL=${urls.githubReleasesUrl}`,
].join("\n");

writeFileSync(viteEnvPath, `${viteEnv}\n`, "utf8");

console.log(`Release URLs (${urls.mode}) for v${version}:`);
console.log(`  updater -> ${urls.updateJsonUrl}`);
console.log(`  windows -> ${urls.winUrl}`);
console.log(`  mac     -> ${urls.macUrl}`);
