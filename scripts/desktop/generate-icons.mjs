#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const desktopDir = path.join(root, "apps/desktop");
const iconSrc = path.join(desktopDir, "branding/app-icon.svg");

console.log("Generating Tauri icons from branding/app-icon.svg ...");

const result = spawnSync("npm", ["run", "tauri", "--", "icon", iconSrc], {
  cwd: desktopDir,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  console.error("tauri icon failed");
  process.exit(result.status ?? 1);
}

const required = [
  "icons/icon.ico",
  "icons/icon.icns",
  "icons/32x32.png",
  "icons/128x128.png",
  "icons/128x128@2x.png",
];

for (const file of required) {
  const full = path.join(desktopDir, "src-tauri", file);
  if (!existsSync(full)) {
    console.error(`Missing generated icon: ${file}`);
    process.exit(1);
  }
}

console.log("Icons generated successfully.");
