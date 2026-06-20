import { fetchImageBuffer, saveGeneratedResult } from "@acs/files";
import type { WorkflowContext } from "../types";
import { BaseNode } from "./base-node";

export class SaveFileNode extends BaseNode {
  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    const generate = context.variables.generate as {
      urls?: string[];
      buffers?: Buffer[];
      mock?: boolean;
    } | undefined;

    let buffer: Buffer;
    if (generate?.buffers?.[0]) {
      buffer = generate.buffers[0];
    } else if (generate?.urls?.[0] && !generate.urls[0].startsWith("mock://")) {
      buffer = await fetchImageBuffer(generate.urls[0]);
    } else {
      buffer = Buffer.from(
        JSON.stringify({ mock: true, taskId: context.taskId }),
        "utf-8"
      );
    }

    const thumbnailSizes = (this.config.thumbnailSizes as number[] | undefined) ?? [400, 800];
    const isRealImage = generate?.buffers?.[0] || (generate?.mock === false);

    if (!isRealImage) {
      const { getStorageProvider } = await import("@acs/storage");
      const { buildUserStoragePath, FileCategory } = await import("@acs/shared");
      const { randomUUID } = await import("node:crypto");
      const storage = getStorageProvider();
      const storagePath = buildUserStoragePath("results", context.userId, `${randomUUID()}.json`);
      const publicUrl = await storage.upload(buffer, storagePath, "application/json");
      return mergeOutput(context, {
        storagePath,
        publicUrl,
        category: FileCategory.GENERATED,
        mock: true,
      });
    }

    const saved = await saveGeneratedResult({
      userId: context.userId,
      buffer,
      fileName: `${context.taskId}.png`,
      thumbnailSizes,
    });

    return mergeOutput(context, {
      fileId: saved.fileId,
      storagePath: saved.storagePath,
      publicUrl: saved.publicUrl,
      thumbnails: saved.thumbnails,
      mock: false,
    });
  }
}

function mergeOutput(context: WorkflowContext, saved: Record<string, unknown>): WorkflowContext {
  return {
    ...context,
    variables: { ...context.variables, saved, outputUrl: saved.publicUrl },
    output: {
      ...context.output,
      url: saved.publicUrl,
      storagePath: saved.storagePath,
      fileId: saved.fileId,
      mock: saved.mock ?? false,
    },
  };
}
