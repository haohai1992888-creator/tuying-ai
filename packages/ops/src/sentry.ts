import { logger } from "./logger";

type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
};

let sentry: SentryLike | null = null;

export async function initMonitoring(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const mod = await import("@sentry/node");
    mod.init({
      dsn,
      environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
    sentry = mod as unknown as SentryLike;
    logger.info("Sentry initialized");
  } catch {
    logger.warn("Sentry DSN set but @sentry/node not installed");
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(error, context);
    return;
  }
  logger.error("Unhandled exception", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
