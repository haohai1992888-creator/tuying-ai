-- Phase 6: Payment + PointPackage

CREATE TABLE IF NOT EXISTS "point_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_packages_pkey" PRIMARY KEY ("id")
);

-- Extend orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_no" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "external_trade_no" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

-- Backfill order_no for existing rows
UPDATE "orders" SET "order_no" = 'ACS' || "id" WHERE "order_no" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "order_no" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_no_key" ON "orders"("order_no");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_external_trade_no_key" ON "orders"("external_trade_no");
CREATE INDEX IF NOT EXISTS "orders_order_no_idx" ON "orders"("order_no");

ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_fkey"
    FOREIGN KEY ("package_id") REFERENCES "point_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- OrderStatus: FAILED -> CLOSED
ALTER TYPE "OrderStatus" RENAME VALUE 'FAILED' TO 'CLOSED';
