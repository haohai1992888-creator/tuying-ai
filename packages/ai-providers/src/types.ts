import { AIProviderId } from "@acs/shared";

export interface GenerateInput {
  prompt: string;
  referenceUrls?: string[];
  referenceBuffer?: Buffer;
  referenceMime?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}

export interface GenerateOutput {
  urls: string[];
  buffers?: Buffer[];
  provider: AIProviderId;
  model?: string;
  mock?: boolean;
  revisedPrompt?: string;
}

export interface EditInput {
  imageUrl: string;
  imageBuffer?: Buffer;
  imageMime?: string;
  prompt: string;
}

export interface EditOutput {
  url: string;
  buffer?: Buffer;
  provider: AIProviderId;
  model?: string;
  mock?: boolean;
}

export interface BatchGenerateInput {
  items: GenerateInput[];
}

export interface BatchGenerateOutput {
  results: GenerateOutput[];
}

export interface AIProvider {
  readonly id: AIProviderId;
  generate(input: GenerateInput): Promise<GenerateOutput>;
  edit(input: EditInput): Promise<EditOutput>;
  batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateOutput>;
}
