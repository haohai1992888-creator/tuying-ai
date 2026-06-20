import type { WorkflowNode, WorkflowNodeDefinition } from "../types";
import { DeductPointsNode } from "./deduct-points.node";
import { GenerateNode } from "./generate.node";
import { ImageAnalysisNode } from "./image-analysis.node";
import { InputNode } from "./input.node";
import { OCRNode } from "./ocr.node";
import { OutputNode } from "./output.node";
import { PromptBuilderNode } from "./prompt-builder.node";
import { RouterNode } from "./router.node";
import { SaveFileNode } from "./save-file.node";

const TYPE_ALIASES: Record<string, string> = {
  input: "input",
  analysis: "image_analysis",
  image_analysis: "image_analysis",
  ocr: "ocr",
  prompt: "prompt_builder",
  prompt_builder: "prompt_builder",
  router: "router",
  generate: "generate",
  save: "save_file",
  save_file: "save_file",
  points: "deduct_points",
  deduct_points: "deduct_points",
  output: "output",
};

export function createNode(def: WorkflowNodeDefinition): WorkflowNode {
  const normalizedType = TYPE_ALIASES[def.type] ?? def.type;

  switch (normalizedType) {
    case "input":
      return new InputNode(def.id, def.type, def.name, def.config ?? {});
    case "image_analysis":
      return new ImageAnalysisNode(def.id, def.type, def.name, def.config ?? {});
    case "ocr":
      return new OCRNode(def.id, def.type, def.name, def.config ?? {});
    case "prompt_builder":
      return new PromptBuilderNode(def.id, def.type, def.name, def.config ?? {});
    case "router":
      return new RouterNode(def.id, def.type, def.name, def.config ?? {});
    case "generate":
      return new GenerateNode(def.id, def.type, def.name, def.config ?? {});
    case "save_file":
      return new SaveFileNode(def.id, def.type, def.name, def.config ?? {});
    case "deduct_points":
      return new DeductPointsNode(def.id, def.type, def.name, def.config ?? {});
    case "output":
      return new OutputNode(def.id, def.type, def.name, def.config ?? {});
    default:
      throw new Error(`Unknown node type: ${def.type}`);
  }
}
