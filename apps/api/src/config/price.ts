export const PRICE = {
  gpt: 10,
  seedream: 5,
  gemini: 2,
} as const;

export type PriceModel = keyof typeof PRICE;

export function getPointCostForModel(model: string): number {
  const key = model.toLowerCase() as PriceModel;
  return PRICE[key] ?? PRICE.gemini;
}

export const RECHARGE_PLANS = [
  { id: "plan-500", price: 39, points: 500, name: "500 积分" },
  { id: "plan-1500", price: 99, points: 1500, name: "1500 积分" },
  { id: "plan-3500", price: 199, points: 3500, name: "3500 积分" },
] as const;
