-- Phase 11 patch: Tauri signatures, pub date, grey rollout

ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "update_signature_win" TEXT;
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "update_signature_mac" TEXT;
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "pub_date" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "version_rollouts" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "force" BOOLEAN NOT NULL DEFAULT false,
    "percent" INTEGER NOT NULL DEFAULT 100,
    "channel" "ReleaseChannel" NOT NULL DEFAULT 'STABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_rollouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "version_rollouts_version_channel_key" ON "version_rollouts"("version", "channel");
