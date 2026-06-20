-- Phase 10: Membership / VIP System

CREATE TYPE "UserPlan" AS ENUM ('FREE', 'VIP', 'ENTERPRISE');
CREATE TYPE "SubscriptionOrderStatus" AS ENUM ('PENDING', 'PAID', 'CLOSED', 'REFUNDED');

ALTER TABLE "users" ADD COLUMN "plan" "UserPlan" NOT NULL DEFAULT 'FREE';

CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "points" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscription_plans_plan_code_idx" ON "subscription_plans"("plan_code");

CREATE TABLE "subscription_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "plan_code" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "SubscriptionOrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod",
    "external_trade_no" TEXT,
    "expire_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_orders_order_no_key" ON "subscription_orders"("order_no");
CREATE UNIQUE INDEX "subscription_orders_external_trade_no_key" ON "subscription_orders"("external_trade_no");
CREATE INDEX "subscription_orders_user_id_idx" ON "subscription_orders"("user_id");
CREATE INDEX "subscription_orders_status_idx" ON "subscription_orders"("status");
CREATE INDEX "subscription_orders_order_no_idx" ON "subscription_orders"("order_no");

ALTER TABLE "subscription_orders" ADD CONSTRAINT "subscription_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription_orders" ADD CONSTRAINT "subscription_orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TYPE "PointType" ADD VALUE IF NOT EXISTS 'SIGN_IN';
