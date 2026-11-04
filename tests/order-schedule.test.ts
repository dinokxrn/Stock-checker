import { getSupplierScheduleStatus, THAI_DAY_SHORT } from "../src/lib/order-schedule";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log("🧪 Starting Order Schedule Logic Tests...");

const todayDayIndex = new Date().getDay();
const tomorrowDayIndex = (todayDayIndex + 1) % 7;
const dayAfterDayIndex = (todayDayIndex + 2) % 7;

// Test 1: Null or empty orderDays
{
  assert(getSupplierScheduleStatus(null) === null, "null returns null");
  assert(getSupplierScheduleStatus("") === null, "empty returns null");
  assert(getSupplierScheduleStatus("   ") === null, "spaces return null");
  console.log("✅ Test 1 passed: null/empty orderDays handling");
}

// Test 2: Order day is Today
{
  const status = getSupplierScheduleStatus(`${todayDayIndex}`);
  assert(status !== null, "status exists");
  assert(status!.isToday === true, "isToday is true");
  assert(status!.isTomorrow === false, "isTomorrow is false");
  assert(status!.daysUntil === 0, "daysUntil is 0");
  assert(status!.badgeText.includes("วันนี้ถึงรอบสั่งของ"), "badgeText indicates today");
  console.log("✅ Test 2 passed: Today order day detection");
}

// Test 3: Order day is Tomorrow
{
  const status = getSupplierScheduleStatus(`${tomorrowDayIndex}`);
  assert(status !== null, "status exists");
  assert(status!.isToday === false, "isToday is false");
  assert(status!.isTomorrow === true, "isTomorrow is true");
  assert(status!.daysUntil === 1, "daysUntil is 1");
  assert(status!.badgeText.includes("พรุ่งนี้ถึงรอบสั่งของ"), "badgeText indicates tomorrow");
  console.log("✅ Test 3 passed: Tomorrow order day detection");
}

// Test 4: Multiple days including today
{
  const status = getSupplierScheduleStatus(`1,2,3,4,5`);
  assert(status !== null, "status exists");
  // If today is weekday (e.g. Wed = 3), isToday should be true
  const isWeekday = todayDayIndex >= 1 && todayDayIndex <= 5;
  assert(status!.isToday === isWeekday, "Weekday today check");
  assert(status!.formattedDays.length > 0, "formattedDays non-empty");
  console.log("✅ Test 4 passed: Multi-day schedule parsing");
}

// Test 5: In 2 days
{
  const status = getSupplierScheduleStatus(`${dayAfterDayIndex}`);
  assert(status !== null, "status exists");
  assert(status!.isToday === false, "isToday is false");
  assert(status!.isTomorrow === false, "isTomorrow is false");
  assert(status!.daysUntil === 2, "daysUntil is 2");
  assert(status!.isUpcomingSoon === true, "isUpcomingSoon is true");
  console.log("✅ Test 5 passed: 2-day upcoming order detection");
}

console.log("🎉 All Order Schedule tests passed successfully!");
