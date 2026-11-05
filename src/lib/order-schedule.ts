export const THAI_DAY_NAMES = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

export const THAI_DAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export const EN_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const EN_DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface ScheduleStatus {
  isToday: boolean;
  isTomorrow: boolean;
  isUpcomingSoon: boolean; // within 2 days
  daysUntil: number; // 0 = today, 1 = tomorrow, 2 = day after tomorrow, etc.
  formattedDays: string; // e.g. "พุธ, ศุกร์" or "Wed, Fri"
  badgeText: string;
  badgeClass: string;
}

/**
 * Parses orderDays string (e.g. "1,3,5") and computes relationship to current day.
 * Accepts optional `lang` parameter ("th" | "en", default: "th") to produce localized badgeText and formattedDays.
 */
export function getSupplierScheduleStatus(
  orderDays?: string | null,
  lang: "th" | "en" = "th"
): ScheduleStatus | null {
  if (!orderDays || !orderDays.trim()) {
    return null;
  }

  const days = orderDays
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);

  if (days.length === 0) return null;

  const today = new Date().getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

  // Check if today matches
  const isToday = days.includes(today);

  // Check if tomorrow matches
  const tomorrow = (today + 1) % 7;
  const isTomorrow = days.includes(tomorrow);

  // Find minimum days until next order day
  let minDiff = 7;
  for (const d of days) {
    const diff = (d - today + 7) % 7;
    if (diff < minDiff) {
      minDiff = diff;
    }
  }

  const daysUntil = minDiff;
  const isUpcomingSoon = daysUntil <= 2;

  // Format short names according to language
  const dayShortMap = lang === "en" ? EN_DAY_SHORT : THAI_DAY_SHORT;
  const formattedDays = days.map((d) => dayShortMap[d]).join(", ");

  let badgeText = lang === "en" ? `Order cycle: ${formattedDays}` : `รอบสั่ง: ${formattedDays}`;
  let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";

  if (isToday) {
    badgeText = lang === "en" ? "🚨 Order round today!" : "🚨 วันนี้ถึงรอบสั่งของ!";
    badgeClass = "bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse";
  } else if (isTomorrow) {
    badgeText = lang === "en" ? "⏰ Order round tomorrow!" : "⏰ พรุ่งนี้ถึงรอบสั่งของ!";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-300 font-semibold";
  } else if (daysUntil === 2) {
    badgeText = lang === "en"
      ? `📅 In 2 days (${dayShortMap[(today + 2) % 7]})`
      : `📅 อีก 2 วันถึงรอบสั่ง (${THAI_DAY_SHORT[(today + 2) % 7]})`;
    badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
  }

  return {
    isToday,
    isTomorrow,
    isUpcomingSoon,
    daysUntil,
    formattedDays,
    badgeText,
    badgeClass,
  };
}
