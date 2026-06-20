/** Phase 8 / Phase 14: Task → Redis Queue (BullMQ) → Worker → Workflow */
import { enqueueTask, isQueueEnabled } from "@acs/queue";

export const taskQueue = {
  async enqueue(taskId: string, userId?: string): Promise<boolean> {
    if (!isQueueEnabled()) return false;
    return enqueueTask(taskId, userId);
  },
};
