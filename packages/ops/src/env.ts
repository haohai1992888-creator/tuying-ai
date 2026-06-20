import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export type AppEnv = "development" | "test" | "production";

export function resolveAppEnv(): AppEnv {
  const raw = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development").toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "test" || raw === "testing") return "test";
  return "development";
}

/** Load `.env`, then `.env.{APP_ENV}` when present (repo root). */
export function loadEnv(cwd = process.cwd()): AppEnv {
  const appEnv = resolveAppEnv();
  const candidates = [
    path.join(cwd, ".env"),
    path.join(cwd, `.env.${appEnv}`),
    path.join(cwd, "..", "..", ".env"),
    path.join(cwd, "..", "..", `.env.${appEnv}`),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false });
    }
  }

  process.env.APP_ENV = appEnv;
  return appEnv;
}

export function isProduction(): boolean {
  return resolveAppEnv() === "production";
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}
