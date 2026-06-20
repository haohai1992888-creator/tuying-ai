import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __acsPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__acsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__acsPrisma = prisma;
}

export { PrismaClient };
export * from "@prisma/client";
