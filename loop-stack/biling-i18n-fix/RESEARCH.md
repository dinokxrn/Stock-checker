# Research Log

## 1. Executive Summary
The application has a `LanguageContext` (`src/contexts/LanguageContext.tsx`) that supports Thai (`th`) and English (`en`), storing preference in `localStorage` (`dino_stock_lang`) and updating `document.documentElement.lang`. However, localization was previously only implemented for navigation, header, and partial stock cards. A comprehensive audit revealed hardcoded Thai across all remaining modules.

## 2. Stock & Dashboard Audit (Researcher 1)
- **`StockCheckingView.tsx`**: Lacks `useLanguage()`. All celebration screens, empty states, progress summaries, and tooltips are hardcoded Thai.
- **`StockFilterBar.tsx`**: Missing translations for supplier pills ("ทั้งหมด"), schedule badges ("วันนี้", "พรุ่งนี้"), and status badges ("สถานะ: ทั้งหมด").
- **`StockItemCard.tsx`**: 0-remain warning popup modal is hardcoded Thai.
- **`WeeklyResetModal.tsx`**: Lacks `useLanguage()`. Warning alerts, metrics, note placeholders, and confirm buttons are hardcoded Thai.
- **`OrderDashboardView.tsx`**: Lacks `useLanguage()`. KPI cards, filter tabs, toasts, QuickEditModal, PreviewModals, and LINE message formatters are hardcoded Thai.
- **`OrderScheduleAlert.tsx` & `order-schedule.ts`**: Day names and alert banners are hardcoded Thai.

## 3. Master, History & Dictionary Audit (Researcher 2)
- **`MasterView.tsx` & `MasterFilterBar.tsx`**: Header, subtitle count, search placeholders, add buttons, and filter pills need localization.
- **`ItemList.tsx` & `ItemModal.tsx`**: Empty state, jump rank modal, delete confirmation modal, input fields, units, and form errors need localization.
- **`SupplierList.tsx` & `SupplierModal.tsx`**: Cascade delete warning, phone/order days labels, validation errors, and schedule selector need localization.
- **`InlinePriceEditor.tsx`**: Tooltips, validation messages, and save/cancel buttons need localization.
- **`HistoryLogView.tsx`**: Snapshot archive cards, CSV export headers/statuses, LINE snapshot export, delete confirmation, and filters need bilingual support.
- **`PinSettingsModal.tsx`**: Password change validation errors, labels, and success banners need localization.
- **`LanguageContext.tsx`**: Needs 78+ new keys added symmetrically to both `th` and `en`.
