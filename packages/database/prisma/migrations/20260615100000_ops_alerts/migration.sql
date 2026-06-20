-- Phase 13: Operations alerts

CREATE TABLE IF NOT EXISTS "alerts" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alerts_resolved_idx" ON "alerts"("resolved");
CREATE INDEX IF NOT EXISTS "alerts_created_at_idx" ON "alerts"("created_at");
