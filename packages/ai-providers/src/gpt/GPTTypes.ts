export interface GPTGenerateRequest {
  prompt: string;
  referenceImage?: Buffer;
  referenceMime?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}

export interface GPTGenerateResponse {
  buffers: Buffer[];
  model: string;
  revisedPrompt?: string;
}

export interface GPTEditRequest {
  prompt: string;
  image: Buffer;
  imageMime: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}
