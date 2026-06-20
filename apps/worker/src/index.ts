/**
 * Independent worker process (Sprint 18 RC).
 * Production: node apps/worker/dist/index.js
 * Development: npm run dev -w @acs/worker
 */
import path from "node:path";
import { createRequire } from "node:module";
import { loadEnv, logger, initMonitoring, captureException } from "@acs/ops";
import {
  startTaskWorker,
  closeRedisConnection,
  isMemoryQueueEnabled,
  isQueueEnabled,
  isRedisQueueEnabled,
} from "@acs/queue";

loadEnv(path.resolve(__dirname, "../../.."));

type ExecuteTask = (taskId: string) => Promise<string>;

function loadExecuteTask(): ExecuteTask {
  const require = createRequire(__filename);
  const runnerPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "../../api/dist/services/taskRunner.js")
      : path.resolve(__dirname, "../../api/src/services/taskRunner.ts");
  return require(runnerPath).executeTask as ExecuteTask;
}

async function main(): Promise<void> {
  await initMonitoring();
  logger.info("ACS worker starting", {
    mode: isRedisQueueEnabled() ? "bullmq" : isMemoryQueueEnabled() ? "memory" : "none",
  });

  if (!isQueueEnabled()) {
    logger.error("Worker not started — set USE_REDIS_QUEUE=true (prod) or USE_MEMORY_QUEUE=true (dev)");
    process.exit(1);
  }

  if (isMemoryQueueEnabled() && !isRedisQueueEnabled()) {
    logger.warn("Memory queue in worker process — for dev, prefer API inline handler or use Redis+BullMQ");
  }

  const executeTask = loadExecuteTask();

  const worker = startTaskWorker(async (taskId) => {
    try {
      await executeTask(taskId);
    } catch (error) {
      captureException(error, { taskId });
      throw error;
    }
  });

  if (!worker && !isMemoryQueueEnabled()) {
    logger.error("BullMQ worker failed to start — check REDIS_URL and USE_REDIS_QUEUE=true");
    process.exit(1);
  }

  logger.info("ACS worker ready");

  const shutdown = async (signal: string) => {
    logger.info("Worker shutting down", { signal });
    if (worker) await worker.close();
    await closeRedisConnection();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Worker fatal", { error });
  process.exit(1);
});
