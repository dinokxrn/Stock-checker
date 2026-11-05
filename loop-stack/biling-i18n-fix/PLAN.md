# Loop Plan
## Mode
patch
## Goal
Complete bilingual (Thai/English) localization across all remaining components, modals, and pages
## Stop Condition
all tasks in loop-stack/biling-i18n-fix/PLAN.md checked
## Budget
20 turns
## Git Integration
yes
## Tasks
- [x] [G1] Task 1: Expand `src/contexts/LanguageContext.tsx` with all 78+ missing keys symmetrically in Thai and English (covering stock, dashboard, master, history, pin settings, day names, reset modals, and toasts), and update `src/lib/order-schedule.ts` with bilingual day helpers.
- [x] [G2] Task 2: Localize stock checking components (`src/components/stock/StockCheckingView.tsx`, `src/components/stock/StockFilterBar.tsx`, `src/components/stock/StockItemCard.tsx` zero-remain confirmation modal, and `src/components/stock/WeeklyResetModal.tsx`) using `useLanguage()`.
- [x] [G2] Task 3: Localize `src/components/dashboard/OrderDashboardView.tsx` (KPI cards, status tabs, filter controls, QuickEditModal, toasts, preview dialogs, and bilingual LINE/WhatsApp summary formatters) and `src/components/OrderScheduleAlert.tsx`.
- [x] [G2] Task 4: Localize Master Data components (`src/app/(main)/master/MasterView.tsx`, `src/components/master/MasterFilterBar.tsx`, `src/components/master/ItemList.tsx`, `src/components/master/ItemModal.tsx`, `src/components/master/SupplierList.tsx`, `src/components/master/SupplierModal.tsx`, and `src/components/master/InlinePriceEditor.tsx`).
- [x] [G2] Task 5: Localize `src/components/history/HistoryLogView.tsx` (snapshot cards, bilingual CSV export headers/values, LINE export, delete confirmations) and `src/components/PinSettingsModal.tsx` (labels, validation errors, and success banners).
- [x] [G3] Task 6: Full Verification — execute `npm run build` and `npm run lint` to verify zero TypeScript/lint errors, ensure language toggle persists across pages via localStorage, and verify bilingual UI consistency.
