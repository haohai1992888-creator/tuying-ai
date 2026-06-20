import { getPointCostForModel } from "../config/price";

export interface TemplateRowInput {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  workflowId: string;
  taskType: string;
  enabled?: boolean;
  isVip: boolean;
  usageCount: number;
  sortOrder?: number;
  createdAt: string;
  favorited?: boolean;
  promptVariables?: string[];
  prompt?: string;
  favoriteCount?: number;
}

export interface MarketplaceTemplate {
  id: string;
  title: string;
  name: string;
  description: string;
  category: string;
  cover: string;
  coverUrl: string;
  prompt?: string;
  model: string;
  points: number;
  taskType: string;
  workflowId: string;
  usageCount: number;
  favoriteCount: number;
  favorited?: boolean;
  isVip: boolean;
  promptVariables?: string[];
  createdAt: string;
}

export function getModelForTemplate(input: { taskType: string; workflowId: string }): string {
  if (input.taskType === "poster" || input.taskType === "model_image") return "gpt";
  if (input.taskType === "scene_image") return "seedream";
  if (input.taskType === "detail_page") return "gemini";
  if (input.taskType === "product_video") return "seedream";
  if (input.workflowId.includes("gpt")) return "gpt";
  return "auto";
}

export function toMarketplaceTemplate(row: TemplateRowInput): MarketplaceTemplate {
  const model = getModelForTemplate({ taskType: row.taskType, workflowId: row.workflowId });
  return {
    id: row.id,
    title: row.name,
    name: row.name,
    description: row.description,
    category: row.category,
    cover: row.coverUrl,
    coverUrl: row.coverUrl,
    prompt: row.prompt,
    model,
    points: getPointCostForModel(model),
    taskType: row.taskType,
    workflowId: row.workflowId,
    usageCount: row.usageCount,
    favoriteCount: row.favoriteCount ?? 0,
    favorited: row.favorited,
    isVip: row.isVip,
    promptVariables: row.promptVariables,
    createdAt: row.createdAt,
  };
}
