export * from "./types";
export { extractSellingPoints } from "./selling-point-extractor";
export { buildDetailBlockPrompt } from "./detail-prompt-builder";
export { composeDetailLongImage } from "./detail-composer";
export { generateDetailBlock } from "./block-generator";
export { DetailWorkflow, detailWorkflow } from "./detail-workflow";
export { DetailService, detailService } from "./detail.service";

/** DetailComposer 别名 */
export { composeDetailLongImage as DetailComposer } from "./detail-composer";
