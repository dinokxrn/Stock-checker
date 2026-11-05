# Loop Memory
Updated continuously by all agents as they discover things.
## Learnings
- Expanded `LanguageContext.tsx` with 292 keys symmetrically in Thai and English, covering stock checking, order dashboard, modals, Master Data, History log, CSV exports, PIN settings, and schedule alerts.
- Updated `order-schedule.ts` with `EN_DAY_NAMES` and `EN_DAY_SHORT`, making `getSupplierScheduleStatus` accept an optional `lang` parameter ("th" | "en", defaulting to "th") for backward compatibility while allowing bilingual badge and day name formatting.
