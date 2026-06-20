#!/usr/bin/env node
/**
 * Apply publish-time Tauri updater endpoint from env.
 * DOWNLOAD_BASE_URL / VITE_UPDATE_JSON_URL → plugins.updater.endpoints
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const confPath = path.join(root, "apps/desktop/src-tauri/tauri.conf.json");
const publishPath = path.join(root, "apps/desktop/publish.config.json");

const downloadBase = (process.env.DOWNLOAD_BASE_URL ?? "").replace(/\/$/, "");
const updateUrl =
  process.env.VITE_UPDATE_JSON_URL?.trim() ||
  (downloadBase ? `${downloadBase}/update.json` : "http://localhost:3001/update.json");

const conf = JSON.parse(readFileSync(confPath, "utf8"));
conf.plugins ??= {};
conf.plugins.updater ??= {};
conf.plugins.updater.endpoints = [updateUrl];

writeFileSync(confPath, `${JSON.stringify(conf, null, 2)}\n`, "utf8");

const publish = {
  updaterEndpoint: updateUrl,
  downloadBaseUrl: downloadBase || "http://localhost:3001/download",
  artifacts: {
    windows: "AI-Commerce-Setup.exe",
    mac: "AI-Commerce.dmg",
    updateJson: "update.json",
  },
};

writeFileSync(publishPath, `${JSON.stringify(publish, null, 2)}\n`, "utf8");
console.log(`Tauri updater endpoint -> ${updateUrl}`);
