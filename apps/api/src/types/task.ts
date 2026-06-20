export enum TaskType {
  SCENE_IMAGE = "scene",
  MODEL_IMAGE = "model",
  POSTER = "poster",
  DETAIL_PAGE = "detail",
  VIDEO = "video",
}

const TO_DB: Record<TaskType, string> = {
  [TaskType.SCENE_IMAGE]: "scene_image",
  [TaskType.MODEL_IMAGE]: "model_image",
  [TaskType.POSTER]: "poster",
  [TaskType.DETAIL_PAGE]: "detail_page",
  [TaskType.VIDEO]: "product_video",
};

const FROM_DB: Record<string, TaskType> = {
  scene_image: TaskType.SCENE_IMAGE,
  model_image: TaskType.MODEL_IMAGE,
  poster: TaskType.POSTER,
  detail_page: TaskType.DETAIL_PAGE,
  product_video: TaskType.VIDEO,
  scene: TaskType.SCENE_IMAGE,
  model: TaskType.MODEL_IMAGE,
  detail: TaskType.DETAIL_PAGE,
  video: TaskType.VIDEO,
};

export function toDbTaskType(type: string): string {
  if (type in TO_DB) return TO_DB[type as TaskType];
  return type;
}

export function fromDbTaskType(taskType: string): string {
  return FROM_DB[taskType] ?? taskType;
}

export interface TaskMeta {
  prompt: string;
  error: string | null;
  model: string;
}

export function encodeTaskMeta(
  prompt: string,
  error: string | null = null,
  model: string = "auto"
): string {
  return JSON.stringify({ prompt, error, model });
}

export function decodeTaskMeta(modelName: string | null): TaskMeta {
  if (!modelName) return { prompt: "", error: null, model: "auto" };
  try {
    const parsed = JSON.parse(modelName) as Partial<TaskMeta>;
    return {
      prompt: typeof parsed.prompt === "string" ? parsed.prompt : modelName,
      error: typeof parsed.error === "string" ? parsed.error : null,
      model: typeof parsed.model === "string" ? parsed.model : "auto",
    };
  } catch {
    return { prompt: modelName, error: null, model: "auto" };
  }
}
