import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Execute SQLite pragmas for WAL mode and concurrent performance
// Note: PRAGMA queries return rows in SQLite, so use $queryRawUnsafe
(async () => {
  try {
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
  } catch {
    // Safe fallback if called during early build or db push
  }
})();
