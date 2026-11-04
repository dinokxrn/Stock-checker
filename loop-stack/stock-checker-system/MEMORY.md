# Loop Memory
Updated continuously by all agents as they discover things.
## Learnings
- [Task 1 / G1] In Prisma with SQLite, `PRAGMA journal_mode = WAL;` returns a result row causing `$executeRawUnsafe` to throw 'Execute returned results'—use `$queryRawUnsafe` or set it persistently via `sqlite3` CLI.
