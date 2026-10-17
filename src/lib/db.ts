import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton (global cache pattern) so dev-server reloads and
 * concurrent route handlers share one connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
