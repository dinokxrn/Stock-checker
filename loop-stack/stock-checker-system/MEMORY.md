# Loop Memory
Updated continuously by all agents as they discover things.
## Learnings
- [Task 1 / G1] In Prisma with SQLite, `PRAGMA journal_mode = WAL;` returns a result row causing `$executeRawUnsafe` to throw 'Execute returned results'—use `$queryRawUnsafe` or set it persistently via `sqlite3` CLI.
- [Task 3 / G2 Master Data] Next.js 15 `revalidatePath` throws `Invariant: static generation store missing` when invoked in non-request contexts (such as tsx test scripts or CLI execution). Wrapping `revalidatePath` in a safe handler allows actions to run cleanly both in HTTP requests and standalone automated test suites.
- [Task 3 / G2 Master Data] Web Crypto `crypto.subtle.verify` in TypeScript 5.8 requires `BufferSource` which is `ArrayBufferView<ArrayBuffer> | ArrayBuffer`; casting `sigBytes as unknown as BufferSource` satisfies strict TypeScript verification without runtime overhead.
- [Task 2 / G2 PIN Auth & Navigation] Separating session token signing/verification (pure Web Crypto in `src/lib/session.ts`) from PIN hashing (Node `crypto` in `src/lib/auth.ts`) prevents Edge Runtime warnings in Next.js `middleware.ts` while keeping Server Actions and seed scripts fully compatible.
- [Task 2 / G2 PIN Auth & Navigation] Next.js 15 requires `await cookies()` in Server Actions. Storing 30-day HttpOnly HMAC-signed session cookies provides persistent login on store mobile devices without external auth bloat.
- [Task 2 / G2 PIN Auth & Navigation] Replacing root `src/app/page.tsx` with `src/app/(main)/page.tsx` avoids Next.js route group collisions on `/` and ensures the main stock checker renders wrapped in `AppHeader` and `BottomNav`.
