import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

async function testIntegration() {
  console.log("=== Testing Real-Time Dashboard Supplier Grouping & Calculations ===");

  // Find a supplier with items
  const makro = await prisma.supplier.findFirst({
    where: { name: { contains: "แม็คโคร" } },
    include: { items: true },
  });
  assert.ok(makro, "Supplier Makro not found");
  assert.ok(makro.items.length >= 2, "Need at least 2 items under Makro");

  const item1 = makro.items[0];
  const item2 = makro.items[1];

  // Save original status
  const orig1 = { status: item1.status, remain: item1.remain, ordered: item1.ordered };
  const orig2 = { status: item2.status, remain: item2.remain, ordered: item2.ordered };

  try {
    // 1. Update item 1: OUT_OF_STOCK, ordered: 10
    await prisma.item.update({
      where: { id: item1.id },
      data: { status: "OUT_OF_STOCK", remain: 0, ordered: 10 },
    });

    // 2. Update item 2: OUT_OF_STOCK, ordered: 5
    await prisma.item.update({
      where: { id: item2.id },
      data: { status: "OUT_OF_STOCK", remain: 0, ordered: 5 },
    });

    // 3. Query as dashboard/page.tsx does
    const suppliers = await prisma.supplier.findMany({
      include: {
        items: {
          orderBy: [{ status: "desc" }, { name: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    const makroDashboard = suppliers.find((s) => s.id === makro.id);
    assert.ok(makroDashboard, "Dashboard supplier found");

    const outOfStockItems = makroDashboard.items.filter((i) => i.status === "OUT_OF_STOCK");
    assert.equal(outOfStockItems.length, 2, "Expected 2 out of stock items");

    const lineTotal1 = item1.unitPrice * 10;
    const lineTotal2 = item2.unitPrice * 5;
    const expectedTotal = lineTotal1 + lineTotal2;

    const actualTotal = outOfStockItems.reduce(
      (sum, i) => sum + i.unitPrice * (i.ordered ?? 1),
      0
    );

    assert.equal(actualTotal, expectedTotal, `Total amount must match sum of line totals (${actualTotal} == ${expectedTotal})`);

    const minAmount = makroDashboard.minOrderAmount;
    const progressPercent = (actualTotal / minAmount) * 100;
    const tierColor = progressPercent >= 100 ? "green" : progressPercent >= 50 ? "amber" : "red";

    console.log(`Supplier: ${makroDashboard.name}`);
    console.log(`Min Order Amount: ฿${minAmount}`);
    console.log(`Total Order Amount: ฿${actualTotal}`);
    console.log(`Progress Percent: ${progressPercent.toFixed(1)}%`);
    console.log(`Tier Color: ${tierColor}`);

    if (actualTotal >= minAmount) {
      console.log(`Status: Passed minimum (+฿${actualTotal - minAmount})`);
    } else {
      console.log(`Status: Shortfall (-฿${minAmount - actualTotal})`);
    }

    assert.ok(["red", "amber", "green"].includes(tierColor));
    console.log("✓ Real-time grouping and calculations verified!");
  } finally {
    // Restore original status
    await prisma.item.update({
      where: { id: item1.id },
      data: orig1,
    });
    await prisma.item.update({
      where: { id: item2.id },
      data: orig2,
    });
    console.log("✓ Original database records cleanly restored.");
  }
}

testIntegration()
  .catch((e) => {
    console.error("Integration test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
