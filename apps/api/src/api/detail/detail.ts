import type { Request, Response } from "express";
import { DETAIL_PLATFORM_WIDTH } from "@acs/shared";
import { detailService } from "@acs/detail";
import {
  buildModulesFromBlocks,
  exportHtml,
  exportPsdStructure,
} from "../../utils/exportHtml";

export async function getDetail(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ message: "无效的任务 ID" });
      return;
    }

    const task = await detailService.getTask(userId, id);
    if (!task) {
      res.status(404).json({ message: "任务不存在" });
      return;
    }

    const modules = buildModulesFromBlocks(
      task.blocks ?? [],
      task.productName,
      task.sellingPoints
    );

    res.json({
      task,
      modules,
      content: {
        productName: task.productName,
        sellingPoint: task.sellingPoints.join("、"),
        modules,
        cover: task.blocks?.[0]?.imageUrl ?? task.resultUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取详情失败",
    });
  }
}

export async function exportHtmlRoute(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = id ? await detailService.getTask(userId, id) : null;
    if (!task) {
      res.status(404).json({ message: "任务不存在" });
      return;
    }

    const modules = buildModulesFromBlocks(
      task.blocks ?? [],
      task.productName,
      task.sellingPoints
    );

    const html = exportHtml({
      title: task.productName,
      sellingPoint: task.sellingPoints.join("、"),
      modules,
      cover: task.resultUrl,
      resultUrl: task.resultUrl,
      width: DETAIL_PLATFORM_WIDTH[task.platform] ?? 790,
    });

    res.type("text/html").send(html);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "导出 HTML 失败",
    });
  }
}

export async function exportPsdRoute(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = id ? await detailService.getTask(userId, id) : null;
    if (!task) {
      res.status(404).json({ message: "任务不存在" });
      return;
    }

    const modules = buildModulesFromBlocks(
      task.blocks ?? [],
      task.productName,
      task.sellingPoints
    );

    res.json(
      exportPsdStructure({
        title: task.productName,
        sellingPoint: task.sellingPoints.join("、"),
        modules,
        cover: task.resultUrl,
        width: DETAIL_PLATFORM_WIDTH[task.platform] ?? 790,
      })
    );
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "导出 PSD 结构失败",
    });
  }
}

export async function regenerateBlock(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const blockId = Array.isArray(req.params.blockId) ? req.params.blockId[0] : req.params.blockId;

    if (!taskId || !blockId) {
      res.status(400).json({ message: "参数无效" });
      return;
    }

    const task = await detailService.regenerateBlock(userId, taskId, blockId);
    res.json({ task });
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "重新生成失败",
    });
  }
}
