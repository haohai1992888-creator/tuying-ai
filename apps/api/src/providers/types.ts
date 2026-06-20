export interface AIProvider {
  generate(prompt: string, inputUrl?: string): Promise<{ url?: string; buffer?: Buffer; mock?: boolean }>;
}
