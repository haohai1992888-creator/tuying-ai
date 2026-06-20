import type { Response } from "express";

export function jsonSuccess(res: Response, data: unknown): void {
  res.json({ success: true, data });
}

export function jsonFail(res: Response, message: string, code?: string, status = 400): void {
  const body: { success: false; message: string; code?: string } = { success: false, message };
  if (code !== undefined) {
    body.code = code;
  }
  res.status(status).json(body);
}
