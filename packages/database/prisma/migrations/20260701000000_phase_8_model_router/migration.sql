-- Phase 8: Model Usage monitoring

CREATE TABLE IF NOT EXISTS "model_usage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "task_id" TEXT,
    "user_id" TEXT,
    "success" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_usage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "model_usage_provider_idx" ON "model_usage"("provider");
CREATE INDEX IF NOT EXISTS "model_usage_task_type_idx" ON "model_usage"("task_type");
CREATE INDEX IF NOT EXISTS "model_usage_success_idx" ON "model_usage"("success");
CREATE INDEX IF NOT EXISTS "model_usage_created_at_idx" ON "model_usage"("created_at");
