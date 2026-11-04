# Loop Memory
Updated continuously by all agents as they discover things.
## Learnings
- [Task 1 / G1] In Prisma with SQLite, `PRAGMA journal_mode = WAL;` returns a result row causing `$executeRawUnsafe` to throw 'Execute returned results'—use `$queryRawUnsafe` or set it persistently via `sqlite3` CLI.
- [Task 3 / G2 Master Data] Next.js 15 `revalidatePath` throws `Invariant: static generation store missing` when invoked in non-request contexts (such as tsx test scripts or CLI execution). Wrapping `revalidatePath` in a safe handler allows actions to run cleanly both in HTTP requests and standalone automated test suites.
- [Task 3 / G2 Master Data] Web Crypto `crypto.subtle.verify` in TypeScript 5.8 requires `BufferSource` which is `ArrayBufferView<ArrayBuffer> | ArrayBuffer`; casting `sigBytes as unknown as BufferSource` satisfies strict TypeScript verification without runtime overhead.
