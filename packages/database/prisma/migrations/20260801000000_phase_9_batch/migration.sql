-- Phase 9: Batch Engine

CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'PAUSED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS "batch_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "options" JSONB,
    "source_type" TEXT,
    "result_zip_url" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "batch_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "batch_items" (
    "id" TEXT NOT NULL,
    "batch_task_id" TEXT NOT NULL,
    "input_url" TEXT NOT NULL,
    "output_url" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "item_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "batch_task_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "batch_item_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tasks_batch_item_id_key" ON "tasks"("batch_item_id");
CREATE INDEX IF NOT EXISTS "tasks_batch_task_id_idx" ON "tasks"("batch_task_id");
CREATE INDEX IF NOT EXISTS "batch_tasks_user_id_idx" ON "batch_tasks"("user_id");
CREATE INDEX IF NOT EXISTS "batch_tasks_status_idx" ON "batch_tasks"("status");
CREATE INDEX IF NOT EXISTS "batch_items_batch_task_id_idx" ON "batch_items"("batch_task_id");

ALTER TABLE "batch_tasks" ADD CONSTRAINT "batch_tasks_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_batch_task_id_fkey"
    FOREIGN KEY ("batch_task_id") REFERENCES "batch_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_batch_task_id_fkey"
    FOREIGN KEY ("batch_task_id") REFERENCES "batch_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_batch_item_id_fkey"
    FOREIGN KEY ("batch_item_id") REFERENCES "batch_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
