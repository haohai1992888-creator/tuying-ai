-- Phase 13: AI Detail Page Engine

CREATE TYPE "DetailTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
CREATE TYPE "DetailBlockType" AS ENUM ('BANNER', 'FEATURE', 'SIZE', 'DETAIL', 'SCENE', 'PARAMETER', 'BRAND', 'REASON');
CREATE TYPE "DetailPlatform" AS ENUM ('TAOBAO', 'PINDUODUO', 'DOUYIN', 'XIAOHONGSHU', 'OZON', 'AMAZON');

CREATE TABLE "detail_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover_url" TEXT NOT NULL,
    "block_types" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detail_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detail_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "product_name" TEXT NOT NULL,
    "input_url" TEXT NOT NULL,
    "platform" "DetailPlatform" NOT NULL DEFAULT 'TAOBAO',
    "selling_points" JSONB,
    "status" "DetailTaskStatus" NOT NULL DEFAULT 'PENDING',
    "result_url" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 20,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "detail_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detail_blocks" (
    "id" TEXT NOT NULL,
    "detail_task_id" TEXT NOT NULL,
    "block_type" "DetailBlockType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "image_url" TEXT,
    "prompt" TEXT,
    "provider" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detail_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "detail_templates_category_idx" ON "detail_templates"("category");
CREATE INDEX "detail_templates_enabled_idx" ON "detail_templates"("enabled");

CREATE INDEX "detail_tasks_user_id_idx" ON "detail_tasks"("user_id");
CREATE INDEX "detail_tasks_status_idx" ON "detail_tasks"("status");
CREATE INDEX "detail_tasks_created_at_idx" ON "detail_tasks"("created_at");

CREATE INDEX "detail_blocks_detail_task_id_idx" ON "detail_blocks"("detail_task_id");
CREATE INDEX "detail_blocks_block_type_idx" ON "detail_blocks"("block_type");

ALTER TABLE "detail_tasks" ADD CONSTRAINT "detail_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detail_tasks" ADD CONSTRAINT "detail_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "detail_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "detail_blocks" ADD CONSTRAINT "detail_blocks_detail_task_id_fkey" FOREIGN KEY ("detail_task_id") REFERENCES "detail_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
