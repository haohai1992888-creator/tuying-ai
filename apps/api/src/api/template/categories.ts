import type { Request, Response } from "express";
import { CATEGORY } from "../../config/category";

export async function categories(_req: Request, res: Response): Promise<void> {
  res.json([...CATEGORY]);
}
