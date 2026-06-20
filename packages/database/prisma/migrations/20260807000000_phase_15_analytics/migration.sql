-- Phase 15: Data Center Analytics

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "cost" DECIMAL(12,4),
    "revenue" DECIMAL(12,4),
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "generate_count" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_stats" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "fail" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "model_stats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature_stats" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "cost" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "feature_stats_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events"("user_id");
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");
CREATE INDEX "analytics_events_module_idx" ON "analytics_events"("module");
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

CREATE UNIQUE INDEX "user_stats_user_id_date_key" ON "user_stats"("user_id", "date");
CREATE INDEX "user_stats_date_idx" ON "user_stats"("date");

CREATE UNIQUE INDEX "model_stats_model_date_key" ON "model_stats"("model", "date");
CREATE INDEX "model_stats_date_idx" ON "model_stats"("date");

CREATE UNIQUE INDEX "feature_stats_module_date_key" ON "feature_stats"("module", "date");
CREATE INDEX "feature_stats_date_idx" ON "feature_stats"("date");

ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
