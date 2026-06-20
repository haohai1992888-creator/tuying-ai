-- Phase 11: Auto Update System

CREATE TYPE "ReleaseChannel" AS ENUM ('STABLE', 'BETA');
CREATE TYPE "ClientPlatform" AS ENUM ('WINDOWS', 'MACOS', 'LINUX');

CREATE TABLE "app_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "download_url" TEXT NOT NULL,
    "download_url_win" TEXT,
    "download_url_mac" TEXT,
    "force_update" BOOLEAN NOT NULL DEFAULT false,
    "channel" "ReleaseChannel" NOT NULL DEFAULT 'STABLE',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_versions_version_channel_key" ON "app_versions"("version", "channel");
CREATE INDEX "app_versions_channel_published_idx" ON "app_versions"("channel", "published");

CREATE TABLE "release_notes" (
    "id" TEXT NOT NULL,
    "version_id" TEXT,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "release_notes_version_idx" ON "release_notes"("version");

ALTER TABLE "release_notes" ADD CONSTRAINT "release_notes_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "app_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "download_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "version" TEXT NOT NULL,
    "platform" TEXT,
    "channel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "download_logs_version_idx" ON "download_logs"("version");
CREATE INDEX "download_logs_created_at_idx" ON "download_logs"("created_at");
