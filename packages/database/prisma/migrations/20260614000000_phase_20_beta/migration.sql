-- Sprint 20: Beta internal testing system

CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'SUGGESTION', 'MODEL_ISSUE', 'FEATURE_REQUEST');
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'REPLIED', 'CLOSED');

ALTER TABLE "users" ADD COLUMN "beta_user" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "beta_expire_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "beta_points" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "users_beta_user_idx" ON "users"("beta_user");

CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "max_count" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

CREATE TABLE "invite_code_usages" (
    "id" TEXT NOT NULL,
    "invite_code_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_code_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invite_code_usages_invite_code_id_idx" ON "invite_code_usages"("invite_code_id");
CREATE INDEX "invite_code_usages_user_id_idx" ON "invite_code_usages"("user_id");

ALTER TABLE "invite_code_usages" ADD CONSTRAINT "invite_code_usages_invite_code_id_fkey" FOREIGN KEY ("invite_code_id") REFERENCES "invite_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invite_code_usages" ADD CONSTRAINT "invite_code_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "admin_reply" TEXT,
    "task_id" TEXT,
    "model" TEXT,
    "error" TEXT,
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedbacks_user_id_idx" ON "feedbacks"("user_id");
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");
CREATE INDEX "feedbacks_category_idx" ON "feedbacks"("category");
CREATE INDEX "feedbacks_created_at_idx" ON "feedbacks"("created_at");

ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_start_at_end_at_idx" ON "announcements"("start_at", "end_at");
CREATE INDEX "announcements_enabled_idx" ON "announcements"("enabled");
