import type { Request, Response } from "express";
import { packageService } from "@acs/payment";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function listPackages(_req: Request, res: Response): Promise<void> {
  try {
    const packages = await packageService.listAll();
    jsonSuccess(res, packages);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取套餐列表失败", undefined, 500);
  }
}

export async function createPackage(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    name?: string;
    points?: number;
    price?: number;
    enabled?: boolean;
    sortOrder?: number;
  };

  if (!body?.name || body.points == null || body.price == null) {
    jsonFail(res, "请填写套餐名称、积分和价格");
    return;
  }

  try {
    const pkg = await packageService.create({
      name: body.name,
      points: Number(body.points),
      price: Number(body.price),
      enabled: body.enabled,
      sortOrder: body.sortOrder,
    });
    jsonSuccess(res, pkg);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "创建失败");
  }
}

export async function updatePackage(req: Request, res: Response): Promise<void> {
  const id = paramString(req, "id");
  const body = req.body as {
    name?: string;
    points?: number;
    price?: number;
    enabled?: boolean;
    sortOrder?: number;
  };

  try {
    const pkg = await packageService.update(id, {
      name: body?.name,
      points: body?.points != null ? Number(body.points) : undefined,
      price: body?.price != null ? Number(body.price) : undefined,
      enabled: body?.enabled,
      sortOrder: body?.sortOrder,
    });
    jsonSuccess(res, pkg);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "更新失败");
  }
}
