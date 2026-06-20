-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT');
CREATE TYPE "WorkflowNodeRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_node_runs" (
    "id" TEXT NOT NULL,
    "workflow_run_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "status" "WorkflowNodeRunStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "workflow_node_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workflow_runs_task_id_idx" ON "workflow_runs"("task_id");
CREATE INDEX "workflow_runs_workflow_id_idx" ON "workflow_runs"("workflow_id");
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs"("status");
CREATE INDEX "workflow_node_runs_workflow_run_id_idx" ON "workflow_node_runs"("workflow_run_id");
CREATE INDEX "workflow_node_runs_status_idx" ON "workflow_node_runs"("status");

ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_node_runs" ADD CONSTRAINT "workflow_node_runs_workflow_run_id_fkey" FOREIGN KEY ("workflow_run_id") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
