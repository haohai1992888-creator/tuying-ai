import type { Request, Response } from "express";
import { DETAIL_CATEGORIES } from "@acs/shared";

export async function categories(_req: Request, res: Response): Promise<void> {
  res.json({ categories: [...DETAIL_CATEGORIES] });
}
