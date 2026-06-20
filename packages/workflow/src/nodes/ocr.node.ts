import { TaskType } from "@acs/shared";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class OCRNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const taskType = String(context.input.taskType ?? "");
    const inputUrl = String(context.input.inputUrl ?? "");
    const userSellingPoints = String(
      context.input.sellingPoints ?? context.input.prompt ?? ""
    );

    let text = "MOCK OCR TEXT";
    let sellingPoints: string[] = [];

    if (userSellingPoints) {
      sellingPoints = userSellingPoints
        .split(/[,，、\n|]/)
        .map((s) => s.trim())
        .filter(Boolean);
      text = sellingPoints.join("，") || userSellingPoints;
    } else if (taskType === TaskType.POSTER || taskType === TaskType.DETAIL_PAGE) {
      sellingPoints = ["高品质", "热销爆款", "限时优惠"];
      text = sellingPoints.join("，");
    }

    const ocr = {
      text,
      sellingPoints,
      language: "zh",
      confidence: userSellingPoints ? 0.98 : 0.85,
      sourceUrl: inputUrl,
      mock: !userSellingPoints,
    };

    return this.setVariable(context, "ocr", ocr);
  }
}
