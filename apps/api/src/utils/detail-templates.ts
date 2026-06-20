import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { DetailBlockType } from "@acs/shared";

export interface JsonDetailTemplate {
  id: string;
  name: string;
  category: string;
  blocks: string[];
  style?: string;
}

export function loadJsonDetailTemplates(): JsonDetailTemplate[] {
  const candidates = [
    path.join(__dirname, "../config/detail-templates"),
    path.join(process.cwd(), "apps/api/src/config/detail-templates"),
    path.join(process.cwd(), "src/config/detail-templates"),
  ];

  for (const dir of candidates) {
    try {
      return readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((file) => {
          const raw = readFileSync(path.join(dir, file), "utf-8");
          return JSON.parse(raw) as JsonDetailTemplate;
        });
    } catch {
      continue;
    }
  }
  return [];
}

export function resolveBlockTypes(templateId?: string): DetailBlockType[] | undefined {
  if (!templateId) return undefined;
  const json = loadJsonDetailTemplates().find((t) => t.id === templateId);
  if (!json) return undefined;
  return json.blocks as DetailBlockType[];
}
