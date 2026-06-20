import { TaskType } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

/** 卖点提取 — 基于 OCR 结果整理营销要点 */
export class ImageAnalysisNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const inputUrl = String(context.input.inputUrl ?? context.variables.inputUrl ?? "");
    const ocr = context.variables.ocr as { sellingPoints?: string[]; text?: string } | undefined;

    const sellingPoints =
      ocr?.sellingPoints?.length
        ? ocr.sellingPoints
        : String(context.input.sellingPoints ?? "")
            .split(/[,，、\n|]/)
            .map((s) => s.trim())
            .filter(Boolean);

    const analysis = {
      url: inputUrl,
      width: 1024,
      height: 1024,
      format: inputUrl.endsWith(".png") ? "png" : "jpeg",
      hasAlpha: inputUrl.includes("png"),
      sellingPoints,
      headline: sellingPoints[0] ?? "品质好物",
      subheadline: sellingPoints.slice(1).join(" · ") || "限时特惠",
      analyzedAt: new Date().toISOString(),
      mock: !inputUrl,
    };

    return this.setVariable(context, "analysis", analysis);
  }
}
