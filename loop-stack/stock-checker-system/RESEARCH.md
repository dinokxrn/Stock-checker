# Research Findings: Stock Checker & Supplier Order System

## Architecture & Tech Stack
- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS with mobile-first utilities (`min-h-[48px]`, `touch-manipulation`, high contrast badges, Lucide React icons)
- **Database & ORM:** SQLite with Prisma ORM (`file:./prisma/dev.db`), enabling WAL mode (`PRAGMA journal_mode = WAL;`) for concurrent read/write across mobile and desktop devices. Prisma avoids native C++ compilation issues observed with `better-sqlite3` on Python 3.14.
- **State & Server Integration:**
  - Client Components with optimistic state for 0ms latency stock checking.
  - Server Actions (`src/actions/...`) for mutations (auth, item updates, supplier CRUD, weekly snapshot reset).
- **Authentication:** 4-6 digit numeric PIN with on-screen touch keypad and HttpOnly session cookies.
- **Deployment:** Single-server local deployment on port 3000 accessible via LAN Wi-Fi (`0.0.0.0:3000`) or standard hosting.

## Requirements & Data Models
- **Database Schema (Prisma):**
  - `Setting`: `key` (PK), `value`, `updatedAt` (stores hashed app PIN, default '1234')
  - `Supplier`: `id` (cuid), `name`, `contactPhone`, `note`, `minOrderAmount` (Float), `items` relation
  - `Item`: `id` (cuid), `name`, `unit` (default 'ชิ้น'), `unitPrice` (Float, editable anytime), `note`, `status` ('NONE', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'), `remain` (Float), `ordered` (Float), `supplierId`, `createdAt`, `updatedAt`
  - `SnapshotArchive`: `id` (cuid), `snapshotDate`, `note`, `totalItemsChecked`, `totalOutOfStock`, `totalOrderAmount`, `createdAt`
  - `SnapshotItem`: `id` (cuid), `snapshotId`, `supplierName`, `itemName`, `unit`, `unitPrice`, `status`, `remain`, `ordered`, `lineTotal`
- **Weekly Reset & Snapshot Logic:**
  - "Reset All to None" triggers confirmation modal.
  - System executes an atomic transaction archiving current stock check as an immutable snapshot in `SnapshotArchive` and `SnapshotItem` tables.
  - Live item records reset to `status: "NONE", remain: null, ordered: null`.
  - History view allows viewing and exporting previous snapshots.

## UI/UX & Mobile Interactions
- **Mobile-First Design (375px - 430px):**
  - Minimum 48px touch targets for all interactive buttons and keypad keys.
  - `touch-manipulation` and font-size >= 16px to prevent iOS auto-zoom.
  - Sticky header with search bar and supplier filter tabs.
  - Sticky bottom summary bar showing selected supplier progress, total, and "Copy to LINE" button.
- **4-State Segmented Toggles:**
  - `NONE`: ยังไม่นับ (Gray/Slate)
  - `IN_STOCK`: มีพอ (Emerald Green) -> reveals Remain input
  - `LOW_STOCK`: ใกล้หมด (Amber Orange) -> reveals Remain input
  - `OUT_OF_STOCK`: สินค้าหมด (Rose Red) -> reveals mandatory Ordered Quantity input
- **Real-Time Line Total:**
  - $\text{Line Total} = \text{Unit Price} \times \text{Ordered Quantity}$
  - Real-time client-side calculation formatted in Thai Baht (`฿#,##0.00`).
- **Real-Time Minimum Order Progress Bar:**
  - Tracks sum of `OUT_OF_STOCK` items for each supplier against `minOrderAmount`.
  - Color tiers: Red (<50%), Amber (50-99%), Green (>=100%).
  - Text badge displays current order vs minimum and remaining shortfall (e.g., "ยอดสั่ง 3,450 / ขั้นต่ำ 5,000 บาท (ขาดอีก 1,550 บาท)").
- **Touch Numeric Keypad for PIN Login:**
  - 3x4 grid (1-9, C, 0, Backspace) with 72px touch buttons.
  - 4-6 animated PIN dots, error shake animation on invalid PIN.
- **LINE Message Export:**
  - Dedicated "Copy to LINE" button per supplier with formatted plain text including emojis, item breakdown, line totals, grand total, and minimum threshold status.

## Verification Criteria
- [ ] Next.js app builds cleanly (`npm run build`) without TypeScript or runtime errors.
- [ ] Prisma SQLite database initializes with default seed data (Suppliers, Items, default PIN).
- [ ] Keypad PIN login works with session persistence in cookies.
- [ ] 4-state toggle updates item status and dynamically switches between Remain and Ordered inputs.
- [ ] Order dashboard calculates supplier order totals in real-time, displays color-coded progress bars, and alerts when below minimum.
- [ ] "Copy to LINE" formats and copies order text for the chosen supplier.
- [ ] "Reset All to None" creates a persistent snapshot archive before resetting states to NONE.
- [ ] Supplier & Item management allows CRUD and editing prices anytime.


## Task-Specific Research — [G1] Next.js 15 App Setup & Prisma SQLite
- **Directory Conflict Resolution:** Avoid `create-next-app` directly in workspace as it aborts when seeing existing files (`SRS.md`, `loop-stack/`). Instead, write `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, and `src/app/` directly, then run `npm install`.
- **Prisma SQLite Configuration:**
  - Create `prisma/schema.prisma` with models: `Setting`, `Supplier`, `Item`, `SnapshotArchive`, `SnapshotItem`.
  - SQLite URL: `env("DATABASE_URL")` with `DATABASE_URL="file:./dev.db"` in `.env`.
  - Create `src/lib/prisma.ts` with singleton pattern and WAL mode pragma.
- **Seed Script (`prisma/seed.ts`):**
  - Hash default PIN (`1234`) using Node.js built-in `crypto.createHash('sha256')` with salt and store in `Setting`.
  - Seed 5 authentic Thai suppliers (Makro Wholesale, Boon Rawd, Mama/Thai President Foods, Osotspa, Unilever) with minimum order amounts (1,500 - 3,000 THB).
  - Seed 30 items with realistic Thai retail/wholesale units (ลัง, แพ็ค, ถาด, ถุง, ขวด) and realistic prices.
- **Verification Criteria for Task [G1]:**
  - `npm install` completes cleanly.
  - `npx prisma db push` generates database tables in `prisma/dev.db`.
  - `npx tsx prisma/seed.ts` seeds 5 suppliers and 30 items.
  - `npm run build` succeeds without errors.

## Audit Report — [G1]
- **Audited Task:** [G1] Initialize Next.js 15 App with TypeScript and Tailwind CSS, configure Prisma SQLite schema with WAL mode (Setting, Supplier, Item, SnapshotArchive, SnapshotItem), and seed sample store data.
- **Verdict:** CLEAN
- **Audit Findings:**
  1. **Next.js 15 & Toolchain Setup:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, and `eslint.config.mjs` are configured cleanly without redundant dependencies. Both `npm run build` and `npm run lint` pass with 0 errors and 0 warnings.
  2. **Prisma & SQLite Schema Completeness:** `prisma/schema.prisma` implements all 5 specified models (`Setting`, `Supplier`, `Item`, `SnapshotArchive`, `SnapshotItem`) with appropriate indexing (`@@index([supplierId])`, `@@index([snapshotId])`) and cascade delete rules.
  3. **Concurrency & WAL Mode:** Persistent WAL mode (`journal_mode = wal`) confirmed active on the SQLite database header. `src/lib/prisma.ts` correctly uses `prisma.$queryRawUnsafe` with error handling to enforce `PRAGMA synchronous = NORMAL;` and `PRAGMA journal_mode = WAL;` during connection initialization.
  4. **Security & PIN Storage:** Seed script secures the default PIN (`1234`) using SHA-256 with salt before persisting to the `Setting` model (`af559...`).
  5. **Data Quality & Coverage:** Seeded 5 authentic Thai suppliers and 30 items with appropriate Thai units (ลัง, แพ็ค, ถาด, ถุง, ขวด) and realistic pricing and minimum order amounts.
  6. **Code Cleanliness & Mobile Baseline:** No placeholders, TODOs, or mock hacks found. Viewport configuration prevents iOS touch zoom (`maximumScale: 1, userScalable: false`) and establishes mobile container layout with Tailwind CSS.
- **Recommendations for Next Tasks [G2-G4]:**
  - Extract `hashPin` into a dedicated auth helper (e.g. `src/lib/auth.ts`) so Server Actions in [G2] can share the exact salt and verification logic cleanly.

