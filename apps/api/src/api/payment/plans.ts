import type { Request, Response } from "express";
import { RECHARGE_PLANS } from "../../config/price";

export async function listPlans(_req: Request, res: Response): Promise<void> {
  res.json(
    RECHARGE_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      points: plan.points,
    }))
  );
}
