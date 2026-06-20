#!/usr/bin/env node
import { appendFileSync } from "node:fs";

const inputVersion = process.argv[2]?.trim();
const refName = process.env.GITHUB_REF_NAME?.trim() || "";
const version =
  inputVersion ||
  (refName.startsWith("v") ? refName.slice(1) : refName || "1.0.0");

const githubEnv = process.env.GITHUB_ENV;
if (!githubEnv) {
  console.log(`VERSION=${version}`);
  process.exit(0);
}

appendFileSync(githubEnv, `VERSION=${version}\n`, "utf8");
console.log(`Resolved version: ${version}`);
