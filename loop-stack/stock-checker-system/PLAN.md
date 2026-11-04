# Loop Plan
## Mode
build
## Goal
Build Stock Checker & Supplier Order System with Next.js SQLite Tailwind CSS per SRS
## Stop Condition
all tasks in loop-stack/stock-checker-system/PLAN.md checked
## Budget
20 turns
## Git Integration
yes
## Tasks
- [x] [G1] Initialize Next.js 15 App with TypeScript and Tailwind CSS, configure Prisma SQLite schema with WAL mode (Setting, Supplier, Item, SnapshotArchive, SnapshotItem), and seed sample store data.
- [x] [G2] Implement PIN Touch Keypad Authentication with session cookies, PIN management, and main mobile navigation layout.
- [x] [G2] Build Master Data management for Suppliers (with minimum order thresholds) and Items (with editable unit pricing and notes).
- [ ] [G3] Build mobile-first Stock Checking view with 4-state toggle cards (None, In Stock, Low Stock, Out of Stock), dynamic inputs, instant line totals, and supplier filtering.
- [ ] [G3] Implement real-time Supplier Order Summary Dashboard with minimum order progress indicators and LINE export formatting.
- [ ] [G4] Implement Weekly Reset workflow with atomic snapshot archiving, historical review log, and complete production build verification.
