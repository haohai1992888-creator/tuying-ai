-- Phase 14: AI Video Engine

CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "VideoTemplateType" AS ENUM ('PRODUCT_ROTATE', 'SCENE_PUSH', 'ZOOM_IN', 'UNBOXING', 'MARKETING');

CREATE TABLE "video_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "template_type" "VideoTemplateType" NOT NULL,
    "cover_url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "input_url" TEXT NOT NULL,
    "product_name" TEXT,
    "provider" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "prompt" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL DEFAULT 20,
    "video_url" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "video_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "video_templates_enabled_idx" ON "video_templates"("enabled");
CREATE INDEX "video_templates_template_type_idx" ON "video_templates"("template_type");

CREATE INDEX "video_tasks_user_id_idx" ON "video_tasks"("user_id");
CREATE INDEX "video_tasks_status_idx" ON "video_tasks"("status");
CREATE INDEX "video_tasks_created_at_idx" ON "video_tasks"("created_at");

ALTER TABLE "video_tasks" ADD CONSTRAINT "video_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_tasks" ADD CONSTRAINT "video_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "video_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
