import type { WorkflowDefinition } from "@acs/shared";
import type { Workflow, WorkflowNodeDefinition } from "./types";

const STANDARD_NODE_CHAIN: Record<string, { type: string; name: string }> = {
  input: { type: "input", name: "Input" },
  analysis: { type: "image_analysis", name: "Image Analysis" },
  ocr: { type: "ocr", name: "OCR" },
  prompt: { type: "prompt_builder", name: "Prompt Builder" },
  router: { type: "router", name: "Router" },
  generate: { type: "generate", name: "Generate" },
  save: { type: "save_file", name: "Save File" },
  points: { type: "deduct_points", name: "Deduct Points" },
  output: { type: "output", name: "Output" },
};

export function parseWorkflowDefinition(raw: WorkflowDefinition): Workflow {
  const nodes = normalizeNodes(raw.nodes);
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    version: raw.version ?? "1.0.0",
    nodes,
  };
}

function normalizeNodes(
  nodes: WorkflowDefinition["nodes"]
): WorkflowNodeDefinition[] {
  if (Array.isArray(nodes) && nodes.length > 0 && typeof nodes[0] === "string") {
    const ids = nodes as string[];
    return ids.map((id, index) => {
      const meta = STANDARD_NODE_CHAIN[id] ?? { type: id, name: id };
      return {
        id,
        type: meta.type,
        name: meta.name,
        next: index < ids.length - 1 ? ids[index + 1] : null,
      };
    });
  }

  return (nodes as WorkflowNodeDefinition[]).map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name ?? node.id,
    config: node.config,
    next: node.next ?? null,
    skipOnError: node.skipOnError,
    timeoutMs: node.timeoutMs,
    maxRetries: node.maxRetries,
  }));
}
