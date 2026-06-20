-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('ORIGINAL', 'GENERATED', 'THUMBNAIL', 'TEMP');

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'ORIGINAL',
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_user_id_idx" ON "files"("user_id");
CREATE INDEX "files_category_idx" ON "files"("category");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
