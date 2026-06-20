#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const version = process.argv[2] || process.env.VERSION || "1.0.0";

const pkgPath = path.join(root, "apps/desktop/package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = version;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

const tauriConfPath = path.join(root, "apps/desktop/src-tauri/tauri.conf.json");
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));
tauriConf.version = version;
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`, "utf8");

const cargoPath = path.join(root, "apps/desktop/src-tauri/Cargo.toml");
let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^version = "[^"]+"/m, `version = "${version}"`);
writeFileSync(cargoPath, cargo, "utf8");

console.log(`Synced desktop version -> ${version}`);
