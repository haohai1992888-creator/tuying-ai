#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, "../../apps/desktop");
const iconSrc = path.join(desktopDir, "branding/app-icon.svg");

console.log("Generating Tauri icons from branding/app-icon.svg ...");
const result = spawnSync("npx", ["tauri", "icon", iconSrc], {
  cwd: desktopDir,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
