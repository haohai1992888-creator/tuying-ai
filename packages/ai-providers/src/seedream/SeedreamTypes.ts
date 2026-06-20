export interface SeedreamGenerateRequest {
  prompt: string;
  negativePrompt?: string;
  size?: string;
  referenceImage?: Buffer;
  referenceMime?: string;
  referenceImages?: Array<{ buffer: Buffer; mime: string }>;
}

export interface SeedreamEditRequest {
  prompt: string;
  image: Buffer;
  imageMime?: string;
  size?: string;
}

export interface SeedreamGenerateResponse {
  buffers: Buffer[];
  model: string;
  revisedPrompt?: string;
}

export interface SeedreamApiResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string; code?: string };
}
