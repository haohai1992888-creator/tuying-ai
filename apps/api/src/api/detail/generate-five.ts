import type { Request, Response } from "express";
import { generate as detailGenerateHandler } from "./generate";

export async function generateFive(req: Request, res: Response): Promise<void> {
  req.body = { ...(req.body as object), mode: "five" };
  return detailGenerateHandler(req, res);
}
