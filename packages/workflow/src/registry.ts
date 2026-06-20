import type { WorkflowDefinition } from "@acs/shared";
import sceneImageWorkflow from "../workflows/scene_image_workflow.json";
import sceneImage from "../workflows/scene_image.json";
import posterWorkflow from "../workflows/poster_workflow.json";
import modelWorkflow from "../workflows/model_workflow.json";
import poster from "../workflows/poster.json";
import whiteBackground from "../workflows/white_background.json";
import batchWhiteBackground from "../workflows/batch_white_background.json";
import productImage from "../workflows/product_image.json";
import modelImage from "../workflows/model_image.json";
import detailPageWorkflow from "../workflows/detail_page_workflow.json";
import videoWorkflow from "../workflows/video_workflow.json";
import { parseWorkflowDefinition } from "./loader";
import type { Workflow } from "./types";

const BUILTIN: WorkflowDefinition[] = [
  sceneImageWorkflow as WorkflowDefinition,
  sceneImage as WorkflowDefinition,
  posterWorkflow as WorkflowDefinition,
  modelWorkflow as WorkflowDefinition,
  poster as WorkflowDefinition,
  whiteBackground as WorkflowDefinition,
  batchWhiteBackground as WorkflowDefinition,
  productImage as WorkflowDefinition,
  modelImage as WorkflowDefinition,
  detailPageWorkflow as WorkflowDefinition,
  videoWorkflow as WorkflowDefinition,
];

/** taskType → workflowId 映射（JSON 配置，禁止硬编码 if） */
const TASK_WORKFLOW_MAP: Record<string, string> = {
  scene_image: "scene-image-workflow",
  poster: "poster-workflow",
  white_background: "white-background",
  batch_white_background: "batch-white-background",
  main_image_optimize: "product-image",
  batch_product_image: "product-image",
  model_image: "model-workflow",
  detail_page: "detail-page-workflow",
  product_video: "video-workflow",
  prompt: "scene-image",
};

export class WorkflowRegistry {
  private readonly workflows = new Map<string, Workflow>();

  constructor() {
    for (const def of BUILTIN) {
      this.register(parseWorkflowDefinition(def));
    }
  }

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  get(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  list(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  resolveWorkflowId(taskType: string): string {
    return TASK_WORKFLOW_MAP[taskType] ?? taskType;
  }

  getByTaskType(taskType: string): Workflow | undefined {
    const workflowId = this.resolveWorkflowId(taskType);
    return this.get(workflowId);
  }
}

export const workflowRegistry = new WorkflowRegistry();
