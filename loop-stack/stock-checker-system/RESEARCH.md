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



## Task-Specific Research — PIN Auth & Navigation [G2]
- **Auth Strategy:**
  - Lightweight custom session cookie (`stock_session`, HttpOnly, 30-day maxAge) using Node.js crypto HMAC token, avoiding heavy third-party auth bloat.
  - Next.js 15 compliance: `await cookies()` in Server Actions.
  - Route guard in `src/middleware.ts` protecting main routes and redirecting unauthenticated users to `/login`.
- **PIN Keypad Component (`src/components/PinKeypad.tsx`):**
  - 3x4 grid with large touch buttons (min 64x64px), visual PIN dots indicator, and CSS `@keyframes shake` error animation.
  - Physical keyboard event listener (0-9, Backspace, Enter, Esc).
  - PIN Management modal to change PIN with current PIN verification.
- **Mobile Navigation:**
  - `BottomNav.tsx`: 4 tabs (Stock Count `/`, Order Dashboard `/dashboard`, Master Data `/master`, History `/history`).
  - `AppHeader.tsx`: Store branding, route title, settings trigger, and logout.

## Task-Specific Research — Master Data Management [G2]
- **Server Actions (`src/actions/master-data.ts`):**
  - Supplier CRUD: `createSupplier`, `updateSupplier`, `deleteSupplier` (with cascade warning).
  - Item CRUD: `createItem`, `updateItem`, `deleteItem`.
  - In-place price editor: `updateItemPrice(id, unitPrice)`.
- **UI Components:**
  - Segmented control between Items and Suppliers on `/master`.
  - Search bar + horizontal supplier filter pills.
  - In-place price editing via click on price badge with optimistic update and instant persistence.
  - Supplier cards with minimum order threshold badge and contact info.

## Audit Report — [G2] PIN Auth & Navigation
- **Audited Task:** [G2] Implement PIN Touch Keypad Authentication with session cookies, PIN management, and main mobile navigation layout.
- **Verdict:** CLEAN
- **Files Inspected:**
  - `src/lib/session.ts`
  - `src/lib/auth.ts`
  - `src/actions/auth.ts`
  - `src/middleware.ts`
  - `src/components/PinKeypad.tsx`
  - `src/components/BottomNav.tsx`
  - `src/components/AppHeader.tsx`
  - `src/components/PinSettingsModal.tsx`
  - `src/app/login/page.tsx`
  - `src/app/(main)/layout.tsx`
- **Key Audit Findings:**
  1. **Next.js 15 Async Cookies API Compliance:** All Server Actions in `src/actions/auth.ts` (`loginWithPin`, `logoutAction`, `changePinAction`, `checkAuth`) correctly use `await cookies()`, adhering to Next.js 15 specifications. In addition, `src/app/login/page.tsx` wraps the search-params dependent component with `<Suspense>` to avoid client-side bailout during static page generation.
  2. **Edge Runtime Compatibility:** `src/middleware.ts` imports solely from `src/lib/session.ts`, which relies strictly on standard W3C Web Crypto APIs (`crypto.subtle`, `TextEncoder`, `TextDecoder`, `btoa`, `atob`). The Node-specific `crypto` module (`createHash`) is isolated within `src/lib/auth.ts`, ensuring zero edge-bundle contamination or Node.js runtime crashes in Edge routes.
  3. **Robust Cookie Security Flags:** The session cookie (`stock_session`) is minted with `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`, and a 30-day `maxAge`, protecting against client-side script inspection while enabling persistent mobile authentication.
  4. **Keypad UX & Error Feedback:** `PinKeypad.tsx` implements responsive 3x4 touch targets (72px buttons, `touch-manipulation`), visual dot indicators (4-6 digits), physical keyboard binding (0-9, Backspace, Enter, Esc), Web Haptic vibration (`navigator.vibrate`), and animated `@keyframes shake` error triggering with automatic input reset.
  5. **PIN Management Flow:** `PinSettingsModal.tsx` handles PIN updates with current PIN verification against the database, 4-6 digit numeric validation, mismatch checking, duplicate rejection, and show/hide PIN toggles.
  6. **Mobile Layout & Navigation Hierarchy:** `BottomNav.tsx` presents 4 sticky touch tabs with active route highlighting. `AppHeader.tsx` includes branding, dynamic Thai Buddhist era date formatting, PIN modal toggle, and logout flow with user confirmation. `src/app/(main)/layout.tsx` correctly integrates header, content area with bottom padding (`pb-20`), and bottom nav.
  7. **Build & Lint Verification:** `npm run build` completed with code 0 (6/6 static routes, 34.6 kB Edge middleware), and `npm run lint` reported 0 warnings and 0 errors. Unit validation confirmed HMAC signature integrity, rejection of tampered tokens, and salted SHA-256 PIN matching.

## Audit Report — [G2] Master Data Management
- **Audited Task:** [G2] Build Master Data management for Suppliers (with minimum order thresholds) and Items (with editable unit pricing and notes).
- **Verdict:** CLEAN
- **Files Inspected:**
  - `src/actions/master-data.ts`
  - `src/components/master/SupplierList.tsx`
  - `src/components/master/SupplierModal.tsx`
  - `src/components/master/ItemList.tsx`
  - `src/components/master/ItemModal.tsx`
  - `src/components/master/InlinePriceEditor.tsx`
  - `src/components/master/MasterFilterBar.tsx`
  - `src/app/(main)/master/page.tsx`
  - `src/app/(main)/master/MasterView.tsx`
- **Key Audit Findings:**
  1. **Zero Placeholders or Mocks:** Exhaustive codebase audit confirms 0 TODOs, 0 FIXMEs, and no mock data stubs. All operations persist directly to SQLite via Prisma ORM with proper error handling and fallback messages.
  2. **Schema & Relation Consistency:** Form inputs, Server Actions, and component props align strictly with Prisma models (`Supplier` and `Item`). Includes proper Thai currency formatting (`฿#,##0.00`), standard retail units (`COMMON_UNITS` quick pills), and numeric safeguards (`Math.max(0, ...)`).
  3. **Referential Integrity & Cascade Protection:** `SupplierList.tsx` incorporates explicit count inspection (`supplier._count?.items`). Attempting to delete a supplier with active items displays an amber alert warning about cascading item deletion before requiring confirmation.
  4. **In-Place Price Editing:** `InlinePriceEditor.tsx` delivers instant optimistic UI updates on tap, keyboard interaction (Enter to commit, Escape to cancel), numeric sanitization, automatic error rollback upon server failure, and synchronization with the parent list.
  5. **Mobile-First Touch Ergonomics:** All primary interactive elements adhere to minimum 48px touch targets (`min-h-[48px]`, `touch-manipulation`) with proper hit areas, high-contrast badges, responsive modals, and horizontal scrollable supplier pills.
  6. **Next.js 15 Revalidation Safety:** Server actions implement a guarded `safeRevalidate()` mechanism that prevents `revalidatePath` crashes in non-request contexts (CLI and automated testing scripts).
  7. **Build & Quality Verification:** `npm run build` succeeds cleanly with 0 TypeScript/compilation errors (Route `/master` compiled dynamically at 9.73 kB, total shared JS 103 kB). `npm run lint` passes with 0 errors and 0 warnings. Automated tsx action test suite verified supplier fetch, item creation, price updates, and deletion.

