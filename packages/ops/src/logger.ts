import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import { resolveAppEnv } from "./env";

const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), "logs");

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

const appEnv = resolveAppEnv();
const isProd = appEnv === "production";

ensureLogDir();

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME ?? "acs-api", env: appEnv },
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "app.log"),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

if (!isProd) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}
