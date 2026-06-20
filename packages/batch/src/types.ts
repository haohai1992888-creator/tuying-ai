import { TaskType } from "@acs/shared";

export interface BatchItemInput {
  inputUrl: string;
  category?: string;
  sellingPoints?: string;
}

export interface BatchCreateInput {
  userId: string;
  taskType: string;
  items: BatchItemInput[];
  options?: Record<string, unknown>;
  sourceType?: string;
}

export interface BatchProgress {
  total: number;
  success: number;
  failed: number;
  processing: number;
  status: string;
  resultZipUrl?: string | null;
  etaSeconds?: number;
}

export interface BatchQueuePayload {
  batchTaskId: string;
  userId: string;
}

export interface ImageGeneratePayload {
  batchTaskId: string;
  batchItemId: string;
  userId: string;
}

export const BATCH_WORKFLOW_MAP: Record<
  string,
  { workflowTaskType: TaskType; label: string }
> = {
  [TaskType.BATCH_SCENE_IMAGE]: { workflowTaskType: TaskType.SCENE_IMAGE, label: "批量场景图" },
  [TaskType.BATCH_WHITE_BACKGROUND]: {
    workflowTaskType: TaskType.WHITE_BACKGROUND,
    label: "批量白底图",
  },
  [TaskType.BATCH_POSTER]: { workflowTaskType: TaskType.POSTER, label: "批量海报" },
  [TaskType.BATCH_MODEL_IMAGE]: { workflowTaskType: TaskType.MODEL_IMAGE, label: "批量模特图" },
};

export const BATCH_TYPE_OPTIONS = [
  { value: TaskType.BATCH_SCENE_IMAGE, label: "批量场景图 (5积分/张)" },
  { value: TaskType.BATCH_WHITE_BACKGROUND, label: "批量白底图 (2积分/张)" },
  { value: TaskType.BATCH_POSTER, label: "批量海报 (10积分/张)" },
  { value: TaskType.BATCH_MODEL_IMAGE, label: "批量模特图 (8积分/张)" },
];
