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
function generateLineMessage(supplier: { name: string; minOrderAmount: number; note?: string | null }, items: Array<{ name: string; unitPrice: number; ordered: number; unit: string }>) {
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.ordered, 0);
  const minAmount = supplier.minOrderAmount || 0;
  const isMet = totalAmount >= minAmount;
  const diff = Math.abs(minAmount - totalAmount);

  let statusLine = "";
  if (minAmount <= 0) {
    statusLine = `✅ ยอดรวม ${formatBaht(totalAmount)} (ไม่มีกำหนดยอดขั้นต่ำ)`;
  } else if (isMet) {
    const surplus = totalAmount - minAmount;
    statusLine = `✅ ผ่านเกณฑ์สั่งซื้อขั้นต่ำ ${formatBaht(minAmount)} แล้ว${
      surplus > 0 ? ` (เกิน ${formatBaht(surplus)})` : ""
    }`;
  } else {
    statusLine = `⚠️ ยังไม่ถึงยอดสั่งซื้อขั้นต่ำ ${formatBaht(minAmount)} (ขาดอีก ${formatBaht(diff)})`;
  }

  const itemsText = items
    .map((item, index) => {
      const lineTotal = item.unitPrice * item.ordered;
      return `${index + 1}. ${item.name} x ${item.ordered} ${item.unit} = ${formatBaht(lineTotal)}`;
    })
    .join("\n");

  const lines = [
    `📦 รายการสั่งซื้อ - ${supplier.name}`,
    `---------------------------------`,
    itemsText,
    `---------------------------------`,
    `💰 ยอดรวมทั้งหมด: ${formatBaht(totalAmount)}`,
    statusLine,
  ];

  if (supplier.note?.trim()) {
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
    { name: "น้ำดื่ม สิงห์ 600ml (แพ็ค 12)", unitPrice: 55, ordered: 20, unit: "แพ็ค" },
    { name: "ข้าวสารหอมมะลิ 5 กก.", unitPrice: 220, ordered: 10, unit: "ถุง" },
  ];
  // 55 * 20 = 1100, 220 * 10 = 2200 => total = 3300 >= 2500 (surplus 800)
  const lineMsg = generateLineMessage(sampleSupplier, sampleItems);
  assert.ok(lineMsg.includes("📦 รายการสั่งซื้อ - สยามแม็คโคร (Makro)"));
  assert.ok(lineMsg.includes("1. น้ำดื่ม สิงห์ 600ml (แพ็ค 12) x 20 แพ็ค = ฿1,100"));
  assert.ok(lineMsg.includes("2. ข้าวสารหอมมะลิ 5 กก. x 10 ถุง = ฿2,200"));
  assert.ok(lineMsg.includes("💰 ยอดรวมทั้งหมด: ฿3,300"));
  assert.ok(lineMsg.includes("ผ่านเกณฑ์สั่งซื้อขั้นต่ำ ฿2,500 แล้ว (เกิน ฿800)"));
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
