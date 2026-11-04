# Global Loop Memory
Shared across all loops in this project.
## Learnings
- [stock-checker-system, task 1] In Prisma with SQLite, `PRAGMA journal_mode = WAL;` returns a result row causing `$executeRawUnsafe` to throw 'Execute returned results'; use `$queryRawUnsafe` or set WAL directly via `sqlite3` CLI.
