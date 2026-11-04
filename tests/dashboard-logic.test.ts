import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

// Helper for Thai Baht formatting
function formatBaht(amount: number) {
  return `฿${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// 3-Tier color determination logic
type TierColor = "red" | "amber" | "green";
function getTierColor(progressPercent: number): TierColor {
  if (progressPercent >= 100) return "green";
  if (progressPercent >= 50) return "amber";
  return "red";
}

// Shortfall text logic
function getShortfallText(totalOrderAmount: number, minOrderAmount: number) {
  if (minOrderAmount <= 0) {
    return `ยอดสั่ง ${formatBaht(totalOrderAmount)} (ไม่กำหนดยอดขั้นต่ำ)`;
  }
  if (totalOrderAmount >= minOrderAmount) {
    const surplus = totalOrderAmount - minOrderAmount;
    return `ยอดสั่ง ${formatBaht(totalOrderAmount)} / ขั้นต่ำ ${formatBaht(minOrderAmount)} (ครบยอดขั้นต่ำแล้ว${
      surplus > 0 ? ` เกิน ${formatBaht(surplus)} บาท` : ""
    })`;
  }
  const shortfall = minOrderAmount - totalOrderAmount;
  return `ยอดสั่ง ${formatBaht(totalOrderAmount)} / ขั้นต่ำ ${formatBaht(minOrderAmount)} (ขาดอีก ${formatBaht(shortfall)} บาท)`;
}

// LINE Message Generator
function generateLineMessage(
  supplier: { name: string; note?: string | null },
  items: Array<{ name: string; unit: string; status: string; ordered?: number | null; remain?: number | null }>
) {
  const outOfStockItems = items.filter((i) => i.status === "OUT_OF_STOCK");
  const lowStockItems = items.filter((i) => i.status === "LOW_STOCK");

  const lines = [
    `📦 สรุปสต็อก - ${supplier.name}`,
    `---------------------------------`,
  ];

  if (outOfStockItems.length > 0) {
    lines.push(`🔴 สินค้าที่หมดแล้ว:`);
    outOfStockItems.forEach((item, index) => {
      const qty = item.ordered && item.ordered > 0 ? item.ordered : 1;
      lines.push(`${index + 1}. ${item.name} (สั่ง ${qty} ${item.unit})`);
    });
  }

  if (lowStockItems.length > 0) {
    if (outOfStockItems.length > 0) {
      lines.push(``);
    }
    lines.push(`🟡 สินค้าที่ใกล้หมด:`);
    lowStockItems.forEach((item, index) => {
      const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
      lines.push(`${index + 1}. ${item.name} (เหลือ ${remain} ${item.unit})`);
    });
  }

  if (supplier.note?.trim()) {
    lines.push(`---------------------------------`);
    lines.push(`📝 หมายเหตุ: ${supplier.note.trim()}`);
  }

  return lines.join("\n");
}

async function runTests() {
  console.log("=== Testing 3-Tier Progress Bar Logic ===");
  assert.equal(getTierColor(0), "red");
  assert.equal(getTierColor(25), "red");
  assert.equal(getTierColor(49.9), "red");
  assert.equal(getTierColor(50), "amber");
  assert.equal(getTierColor(75), "amber");
  assert.equal(getTierColor(99.9), "amber");
  assert.equal(getTierColor(100), "green");
  assert.equal(getTierColor(150), "green");
  console.log("✓ Tier color thresholds verified: Red (<50%), Amber (50-99%), Green (>=100%)");

  console.log("\n=== Testing Shortfall Text Generation ===");
  const textBelow = getShortfallText(3450, 5000);
  assert.ok(textBelow.includes("ขาดอีก ฿1,550 บาท"), `Expected shortfall text: ${textBelow}`);
  console.log(`✓ Shortfall below: ${textBelow}`);

  const textMet = getShortfallText(5200, 5000);
  assert.ok(textMet.includes("ครบยอดขั้นต่ำแล้ว เกิน ฿200 บาท"), `Expected met text: ${textMet}`);
  console.log(`✓ Shortfall met with surplus: ${textMet}`);

  const textExact = getShortfallText(5000, 5000);
  assert.ok(textExact.includes("ครบยอดขั้นต่ำแล้ว"), `Expected exact met text: ${textExact}`);
  console.log(`✓ Shortfall exact match: ${textExact}`);

  const textNoMin = getShortfallText(1200, 0);
  assert.ok(textNoMin.includes("ไม่กำหนดยอดขั้นต่ำ"), `Expected no min text: ${textNoMin}`);
  console.log(`✓ Shortfall no min: ${textNoMin}`);

  console.log("\n=== Testing LINE Export Formatting ===");
  const sampleSupplier = {
    name: "สยามแม็คโคร (Makro)",
    minOrderAmount: 2500,
    note: "ส่งช่วงเช้าก่อน 10:00 น.",
  };
  const sampleItems = [
    { name: "น้ำดื่ม สิงห์ 600ml (แพ็ค 12)", unit: "แพ็ค", status: "OUT_OF_STOCK", ordered: 20 },
    { name: "ข้าวสารหอมมะลิ 5 กก.", unit: "ถุง", status: "LOW_STOCK", remain: 2 },
  ];
  const lineMsg = generateLineMessage(sampleSupplier, sampleItems);
  assert.ok(lineMsg.includes("📦 สรุปสต็อก - สยามแม็คโคร (Makro)"));
  assert.ok(lineMsg.includes("🔴 สินค้าที่หมดแล้ว:"));
  assert.ok(lineMsg.includes("1. น้ำดื่ม สิงห์ 600ml (แพ็ค 12) (สั่ง 20 แพ็ค)"));
  assert.ok(lineMsg.includes("🟡 สินค้าที่ใกล้หมด:"));
  assert.ok(lineMsg.includes("1. ข้าวสารหอมมะลิ 5 กก. (เหลือ 2 ถุง)"));
  assert.ok(lineMsg.includes("📝 หมายเหตุ: ส่งช่วงเช้าก่อน 10:00 น."));
  console.log("✓ LINE Message generated:\n" + lineMsg);

  console.log("\n=== Testing Database Query Integration ===");
  const suppliers = await prisma.supplier.findMany({
    include: {
      items: true,
    },
  });
  assert.ok(suppliers.length >= 5, "Database must have at least 5 suppliers");
  console.log(`✓ Database fetched ${suppliers.length} suppliers cleanly with items relation.`);

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
