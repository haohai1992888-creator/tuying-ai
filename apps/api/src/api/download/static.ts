import express, { type Express } from "express";
import type { Request, Response } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDownloadRoot } from "@acs/distribution";
import { normalizeUpdateJson } from "@acs/distribution";

export function registerDownloadStatic(app: Express): void {
  const root = getDownloadRoot();
  const router = express.static(root, { maxAge: "1h", fallthrough: true });

  app.use("/download", (_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, router);
}

export function sendUpdateJson(res: Response): void {
  const file = path.join(getDownloadRoot(), "update", "update.json");
  res.setHeader("Cache-Control", "public, max-age=120");
  readFile(file, "utf8")
    .then((raw) => {
      res.json(normalizeUpdateJson(JSON.parse(raw)));
    })
    .catch(() => {
      res.status(404).json({
        success: false,
        message: "update.json 不存在，请运行 npm run release:desktop",
      });
    });
}

export async function downloadUpdateJson(_req: Request, res: Response): Promise<void> {
  sendUpdateJson(res);
}
