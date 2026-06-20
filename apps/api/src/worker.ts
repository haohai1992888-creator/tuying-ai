import path from "node:path";
import { loadEnv, logger, initMonitoring, captureException } from "@acs/ops";
import { startTaskWorker, closeRedisConnection, isMemoryQueueEnabled, isQueueEnabled } from "@acs/queue";
import { executeTask } from "./services/taskRunner";

loadEnv(path.resolve(__dirname, "../../.."));

async function main(): Promise<void> {
  await initMonitoring();
  logger.info("ACS API worker starting");

  if (!isQueueEnabled()) {
    logger.error("Worker not started — set USE_MEMORY_QUEUE=true or USE_REDIS_QUEUE=true");
    process.exit(1);
  }

  const worker = startTaskWorker(async (taskId) => {
    try {
      await executeTask(taskId);
    } catch (error) {
      captureException(error, { taskId });
      throw error;
    }
  });

  if (!worker && !isMemoryQueueEnabled()) {
    logger.error("Worker not started — set USE_REDIS_QUEUE=true and REDIS_URL");
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info("Worker shutting down", { signal });
    if (worker) {
      await worker.close();
    }
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
