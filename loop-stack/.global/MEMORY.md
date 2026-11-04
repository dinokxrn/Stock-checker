# Global Loop Memory
Shared across all loops in this project.
## Learnings
- [stock-checker-system, task 1] In Prisma with SQLite, `PRAGMA journal_mode = WAL;` returns a result row causing `$executeRawUnsafe` to throw 'Execute returned results'; use `$queryRawUnsafe` or set WAL directly via `sqlite3` CLI.
- [stock-checker-system, task 3] In Next.js 15, calling server actions directly from CLI scripts or non-request contexts causes `revalidatePath` to throw 'Invariant: static generation store missing'; wrap `revalidatePath` in a try/catch to run actions safely in both HTTP requests and standalone automated test suites.
- [stock-checker-system, task 4] Sanitizing stock count status mutations by clearing `ordered` quantity when items transition to IN_STOCK or LOW_STOCK avoids phantom order totals in wholesale replenishment aggregation.
- [stock-checker-system, task 5] Using `https://line.me/R/msg/text/?${encodeURIComponent(text)}` paired with a `navigator.clipboard` fallback enables zero-dependency, cross-platform messaging export (iOS/Android/desktop) without external SDKs or bot API credentials.
