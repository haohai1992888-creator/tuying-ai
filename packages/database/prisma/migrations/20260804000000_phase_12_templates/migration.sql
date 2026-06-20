-- Phase 12: Template Marketplace

CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cover_url" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "templates_category_idx" ON "templates"("category");
CREATE INDEX "templates_enabled_idx" ON "templates"("enabled");
CREATE INDEX "templates_usage_count_idx" ON "templates"("usage_count");

ALTER TABLE "templates" ADD CONSTRAINT "templates_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompt_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "favorite_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_templates_user_id_template_id_key" ON "favorite_templates"("user_id", "template_id");
CREATE INDEX "favorite_templates_user_id_idx" ON "favorite_templates"("user_id");

ALTER TABLE "favorite_templates" ADD CONSTRAINT "favorite_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_templates" ADD CONSTRAINT "favorite_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "template_usages" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "template_usages_template_id_idx" ON "template_usages"("template_id");
CREATE INDEX "template_usages_user_id_idx" ON "template_usages"("user_id");
CREATE INDEX "template_usages_created_at_idx" ON "template_usages"("created_at");

ALTER TABLE "template_usages" ADD CONSTRAINT "template_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "template_usages" ADD CONSTRAINT "template_usages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "recent_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recent_templates_user_id_template_id_key" ON "recent_templates"("user_id", "template_id");
CREATE INDEX "recent_templates_user_id_used_at_idx" ON "recent_templates"("user_id", "used_at");

ALTER TABLE "recent_templates" ADD CONSTRAINT "recent_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recent_templates" ADD CONSTRAINT "recent_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
