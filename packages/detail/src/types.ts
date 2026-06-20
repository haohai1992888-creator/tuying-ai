import type { DetailBlockType } from "@acs/shared";

export interface DetailTemplateDto {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  blockTypes: DetailBlockType[];
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface DetailBlockDto {
  id: string;
  detailTaskId: string;
  blockType: DetailBlockType;
  sortOrder: number;
  status: string;
  imageUrl: string | null;
  prompt: string | null;
  provider: string | null;
  error: string | null;
  createdAt: string;
}

export interface DetailTaskDto {
  id: string;
  userId: string;
  templateId: string | null;
  productName: string;
  inputUrl: string;
  platform: string;
  sellingPoints: string[];
  status: string;
  resultUrl: string | null;
  cost: number;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  blocks?: DetailBlockDto[];
}

export interface DetailGenerateInput {
  userId: string;
  inputUrl: string;
  productName: string;
  templateId?: string;
  platform?: string;
  sellingPoints?: string[];
  preferredProvider?: string;
  blockTypes?: DetailBlockType[];
  cost?: number;
}

export interface SellingPointExtractInput {
  productName: string;
  userPoints?: string[];
  ocrText?: string;
}
