import { prisma } from "@acs/database";
import { TaskStatus } from "@acs/shared";
import { workflowQueueWorker, workflowRegistry } from "@acs/workflow";

export interface TaskDto {
  id: string;
  userId: string;
  taskType: string;
  status: TaskStatus;
  cost: number;
  inputUrl: string | null;
  outputUrl: string | null;
  modelName: string | null;
  createdAt: string;
  workflowRun?: WorkflowRunDto | null;
}

export interface WorkflowRunDto {
  id: string;
  workflowId: string;
  status: string;
  error: string | null;
  startedAt: string;
  endedAt: string | null;
  nodeRuns?: WorkflowNodeRunDto[];
}

export interface WorkflowNodeRunDto {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  error: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface AiTaskDto extends TaskDto {
  workflowId: string | null;
  durationMs: number | null;
  pointsCost: number;
  userLabel: string;
}

export class TaskService {
  /**
   * Phase 4: 创建任务 → 进入 workflow-queue → 执行工作流
   */
  async createTask(input: {
    userId: string;
    taskType: string;
    cost?: number;
    inputUrl?: string;
    modelName?: string;
    prompt?: string;
    category?: string;
    style?: string;
    sceneStyle?: string;
    templateKey?: string;
    posterTemplate?: string;
    modelTemplateKey?: string;
    modelStyle?: string;
    sellingPoints?: string;
    modelReferenceUrl?: string;
    referenceUrl?: string;
    preferredProvider?: string;
    useTemplatePrompt?: boolean;
  }): Promise<TaskDto> {
    const workflow = workflowRegistry.getByTaskType(input.taskType);
    if (!workflow) {
      throw new Error(`未找到 taskType 对应的工作流: ${input.taskType}`);
    }

    const { getPointCost } = await import("@acs/shared");
    const cost =
      input.cost ??
      getPointCost(input.taskType as import("@acs/shared").TaskType);

    const task = await prisma.task.create({
      data: {
        userId: input.userId,
        taskType: input.taskType,
        cost,
        inputUrl: input.inputUrl ?? null,
        modelName: input.modelName ?? null,
        status: TaskStatus.PENDING,
      },
    });

    await workflowQueueWorker.enqueue({
      taskId: task.id,
      userId: input.userId,
      workflowId: workflow.id,
      input: {
        taskType: input.taskType,
        inputUrl: input.inputUrl,
        cost,
        prompt: input.prompt,
        category: input.category,
        style: input.style ?? input.sceneStyle,
        sceneStyle: input.sceneStyle ?? input.style,
        templateKey: input.templateKey ?? input.posterTemplate,
        posterTemplate: input.posterTemplate ?? input.templateKey,
        modelTemplateKey: input.modelTemplateKey ?? input.modelStyle,
        modelStyle: input.modelStyle ?? input.modelTemplateKey,
        sellingPoints: input.sellingPoints,
        modelReferenceUrl: input.modelReferenceUrl ?? input.referenceUrl,
        referenceUrl: input.referenceUrl ?? input.modelReferenceUrl,
        preferredProvider: input.preferredProvider ?? "auto",
        useTemplatePrompt: input.useTemplatePrompt ?? false,
      },
    });

    void workflowQueueWorker.processNext();

    return mapTask(task);
  }

  async listTasks(userId: string, limit = 50): Promise<TaskDto[]> {
    const rows = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const dto = mapTask(row);
        dto.workflowRun = await this.getLatestWorkflowRun(row.id);
        return dto;
      })
    );
    return enriched;
  }

  async getTask(userId: string, taskId: string): Promise<TaskDto | null> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) return null;
    const dto = mapTask(task);
    dto.workflowRun = await this.getLatestWorkflowRun(taskId);
    return dto;
  }

  async getTaskById(taskId: string): Promise<TaskDto | null> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return null;
    const dto = mapTask(task);
    dto.workflowRun = await this.getLatestWorkflowRun(taskId);
    return dto;
  }

  async getLatestWorkflowRun(taskId: string): Promise<WorkflowRunDto | null> {
    const run = await prisma.workflowRun.findFirst({
      where: { taskId },
      orderBy: { startedAt: "desc" },
      include: { nodeRuns: { orderBy: { startedAt: "asc" } } },
    });
    if (!run) return null;
    return {
      id: run.id,
      workflowId: run.workflowId,
      status: run.status,
      error: run.error,
      startedAt: run.startedAt.toISOString(),
      endedAt: run.endedAt?.toISOString() ?? null,
      nodeRuns: run.nodeRuns.map((n) => ({
        id: n.id,
        nodeId: n.nodeId,
        nodeType: n.nodeType,
        status: n.status,
        error: n.error,
        startedAt: n.startedAt.toISOString(),
        endedAt: n.endedAt?.toISOString() ?? null,
      })),
    };
  }

  async listAllTasks(limit = 100): Promise<TaskDto[]> {
    const rows = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapTask);
  }

  /** Phase 5 — Admin AI 任务列表（含工作流、耗时、积分） */
  async listAiTasks(limit = 100): Promise<AiTaskDto[]> {
    const rows = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, phone: true, nickname: true } },
        workflowRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    return rows.map((row) => {
      const run = row.workflowRuns[0];
      const durationMs =
        run?.startedAt && run.endedAt
          ? run.endedAt.getTime() - run.startedAt.getTime()
          : run?.startedAt && run.status === "RUNNING"
            ? Date.now() - run.startedAt.getTime()
            : null;

      const userLabel =
        row.user.nickname?.trim() ||
        row.user.email?.trim() ||
        row.user.phone?.trim() ||
        row.userId.slice(0, 8);

      return {
        ...mapTask(row),
        workflowId: run?.workflowId ?? null,
        durationMs,
        pointsCost: row.cost,
        userLabel,
      };
    });
  }
}

function mapTask(row: {
  id: string;
  userId: string;
  taskType: string;
  status: string;
  cost: number;
  inputUrl: string | null;
  outputUrl: string | null;
  modelName: string | null;
  createdAt: Date;
}): TaskDto {
  return {
    id: row.id,
    userId: row.userId,
    taskType: row.taskType,
    status: row.status as TaskStatus,
    cost: row.cost,
    inputUrl: row.inputUrl,
    outputUrl: row.outputUrl,
    modelName: row.modelName,
    createdAt: row.createdAt.toISOString(),
  };
}

export const taskService = new TaskService();
