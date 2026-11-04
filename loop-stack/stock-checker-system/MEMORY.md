# Loop Memory
Updated continuously by all agents as they discover things.
## Learnings
### Task [G1] Learnings
- **Prisma & SQLite Pragmas:** `PRAGMA journal_mode = WAL;` returns a row (`wal`), so in `@prisma/client` it must be called with `prisma.$queryRawUnsafe(...)` instead of `$executeRawUnsafe`, which throws `Execute returned results, which is not allowed in SQLite`.
- **Persistent SQLite WAL Mode:** Running `sqlite3 prisma/dev.db "PRAGMA journal_mode = WAL;"` stores the WAL mode persistently into the database file header.
- **Next.js 15 outputFileTracingRoot:** Explicitly defining `outputFileTracingRoot: path.join(__dirname)` in `next.config.ts` suppresses parent lockfile tracing warnings.

