import type { Request, Response } from "express";
import { orderService } from "@acs/payment";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listOrders(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const orders = await orderService.listAllOrders(limit);
    jsonSuccess(res, orders);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取订单列表失败", undefined, 500);
  }
}
