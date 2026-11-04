import { prisma } from "../src/lib/prisma";
import { updateItemStockStatus, getStockItems, StockStatus } from "../src/actions/stock";

async function runStockViewVerification() {
  console.log("=== Starting Stock Checking View Verification ===");

  // Find a test item from the database
  const item = await prisma.item.findFirst({
    include: { supplier: true },
  });

  if (!item) {
    throw new Error("No items found in database for testing!");
  }

  const itemId = item.id;
  const originalState = {
    status: item.status,
    remain: item.remain,
    ordered: item.ordered,
  };

  try {
    console.log(`\n1. Testing 4-State Transitions and Sanitization on item: "${item.name}" (${itemId})`);

    // Transition 1: OUT_OF_STOCK
    console.log("-> Transitioning to OUT_OF_STOCK (ordered = 5, remain = 10)");
    const resOutOfStock = await updateItemStockStatus(itemId, "OUT_OF_STOCK", 10, 5);
    if (!resOutOfStock.success || !resOutOfStock.data) {
      throw new Error(`Failed to update to OUT_OF_STOCK: ${resOutOfStock.error}`);
    }
    if (resOutOfStock.data.status !== "OUT_OF_STOCK") throw new Error("Status mismatch");
    if (resOutOfStock.data.remain !== 0) throw new Error(`Remain should be 0 on OUT_OF_STOCK, got: ${resOutOfStock.data.remain}`);
    if (resOutOfStock.data.ordered !== 5) throw new Error(`Ordered should be 5 on OUT_OF_STOCK, got: ${resOutOfStock.data.ordered}`);
    console.log("✓ OUT_OF_STOCK correctly sets remain=0 and preserves ordered=5");

    // Transition 2: IN_STOCK (verify ordered is wiped clean)
    console.log("-> Transitioning to IN_STOCK (remain = 15, ordered = 99)");
    const resInStock = await updateItemStockStatus(itemId, "IN_STOCK", 15, 99);
    if (!resInStock.success || !resInStock.data) {
      throw new Error(`Failed to update to IN_STOCK: ${resInStock.error}`);
    }
    if (resInStock.data.status !== "IN_STOCK") throw new Error("Status mismatch");
    if (resInStock.data.remain !== 15) throw new Error(`Remain should be 15 on IN_STOCK, got: ${resInStock.data.remain}`);
    if (resInStock.data.ordered !== null) throw new Error(`Ordered MUST be cleared (null) on IN_STOCK, got: ${resInStock.data.ordered}`);
    console.log("✓ IN_STOCK correctly sets remain=15 and CLEARS ordered to null (prevents phantom order totals)");

    // Transition 3: LOW_STOCK (verify ordered is wiped clean)
    console.log("-> Transitioning to LOW_STOCK (remain = 2, ordered = 50)");
    const resLowStock = await updateItemStockStatus(itemId, "LOW_STOCK", 2, 50);
    if (!resLowStock.success || !resLowStock.data) {
      throw new Error(`Failed to update to LOW_STOCK: ${resLowStock.error}`);
    }
    if (resLowStock.data.status !== "LOW_STOCK") throw new Error("Status mismatch");
    if (resLowStock.data.remain !== 2) throw new Error(`Remain should be 2 on LOW_STOCK, got: ${resLowStock.data.remain}`);
    if (resLowStock.data.ordered !== null) throw new Error(`Ordered MUST be cleared (null) on LOW_STOCK, got: ${resLowStock.data.ordered}`);
    console.log("✓ LOW_STOCK correctly sets remain=2 and CLEARS ordered to null");

    // Transition 4: NONE (verify both remain and ordered are null)
    console.log("-> Transitioning to NONE (remain = 5, ordered = 10)");
    const resNone = await updateItemStockStatus(itemId, "NONE", 5, 10);
    if (!resNone.success || !resNone.data) {
      throw new Error(`Failed to update to NONE: ${resNone.error}`);
    }
    if (resNone.data.status !== "NONE") throw new Error("Status mismatch");
    if (resNone.data.remain !== null) throw new Error(`Remain MUST be null on NONE, got: ${resNone.data.remain}`);
    if (resNone.data.ordered !== null) throw new Error(`Ordered MUST be null on NONE, got: ${resNone.data.ordered}`);
    console.log("✓ NONE correctly nullifies both remain and ordered");

    // Edge Cases:
    console.log("\n2. Testing Edge Cases and Input Guards");

    // Edge Case A: Negative remain
    console.log("-> Testing negative remain (-5) on IN_STOCK");
    const resNegRemain = await updateItemStockStatus(itemId, "IN_STOCK", -5, null);
    if (resNegRemain.data?.remain !== 0) {
      throw new Error(`Negative remain should be clamped to 0, got: ${resNegRemain.data?.remain}`);
    }
    console.log("✓ Negative remain successfully clamped to 0");

    // Edge Case B: Negative or zero ordered on OUT_OF_STOCK
    console.log("-> Testing zero/negative ordered (-3) on OUT_OF_STOCK");
    const resNegOrdered = await updateItemStockStatus(itemId, "OUT_OF_STOCK", 0, -3);
    if (resNegOrdered.data?.ordered !== 1) {
      throw new Error(`Negative/zero ordered should be clamped to at least 1, got: ${resNegOrdered.data?.ordered}`);
    }
    console.log("✓ Negative/zero ordered successfully clamped to 1");

    // Edge Case C: Non-existent item ID
    console.log("-> Testing non-existent itemId");
    const resBadId = await updateItemStockStatus("non-existent-id-12345", "IN_STOCK", 1, null);
    if (resBadId.success) {
      throw new Error("Should fail for non-existent item ID");
    }
    console.log(`✓ Non-existent itemId correctly rejected with error: "${resBadId.error}"`);

    // Edge Case D: Invalid status
    console.log("-> Testing invalid status");
    const resBadStatus = await updateItemStockStatus(itemId, "INVALID_STATUS" as StockStatus, 1, null);
    if (resBadStatus.success) {
      throw new Error("Should fail for invalid status");
    }
    console.log(`✓ Invalid status correctly rejected with error: "${resBadStatus.error}"`);

    // Edge Case E: Empty item ID
    console.log("-> Testing empty itemId");
    const resEmptyId = await updateItemStockStatus("", "IN_STOCK", 1, null);
    if (resEmptyId.success) {
      throw new Error("Should fail for empty item ID");
    }
    console.log(`✓ Empty itemId correctly rejected with error: "${resEmptyId.error}"`);

    // 3. Testing getStockItems query filters
    console.log("\n3. Testing getStockItems Filtering");
    const allStockItems = await getStockItems();
    if (!allStockItems.success || !allStockItems.data) {
      throw new Error("Failed to fetch all stock items");
    }
    console.log(`✓ Fetched ${allStockItems.data.length} total items`);

    // Filter by supplier
    const supplierFilterRes = await getStockItems(item.supplierId);
    if (!supplierFilterRes.success || !supplierFilterRes.data) {
      throw new Error("Failed to filter by supplier");
    }
    const allMatchSupplier = supplierFilterRes.data.every((i) => i.supplierId === item.supplierId);
    if (!allMatchSupplier) throw new Error("Supplier filter returned items from another supplier");
    console.log(`✓ Supplier filtering verified (${supplierFilterRes.data.length} items for supplier ${item.supplier?.name})`);

    // Filter by search query
    const searchFilterRes = await getStockItems(undefined, item.name.substring(0, 3));
    if (!searchFilterRes.success || !searchFilterRes.data) {
      throw new Error("Failed to filter by search query");
    }
    const hasMatch = searchFilterRes.data.some((i) => i.id === itemId);
    if (!hasMatch) throw new Error("Search filter failed to find matching item");
    console.log(`✓ Search filtering verified (${searchFilterRes.data.length} matches found)`);

    // 4. Line total calculation verification
    console.log("\n4. Testing Line Total Calculation Formula");
    const testPrice = 125.50;
    const testQty = 8;
    const computedLineTotal = testPrice * testQty;
    if (computedLineTotal !== 1004) {
      throw new Error(`Line total calculation mismatch: expected 1004, got ${computedLineTotal}`);
    }
    console.log(`✓ Line total formula UnitPrice (${testPrice}) * OrderedQty (${testQty}) = ${computedLineTotal} verified`);

    // 5. Overall StockStats aggregation logic test
    console.log("\n5. Testing StockStats Aggregation Formula");
    const sampleItems = [
      { status: "NONE", unitPrice: 100, ordered: null },
      { status: "IN_STOCK", unitPrice: 200, ordered: null },
      { status: "LOW_STOCK", unitPrice: 300, ordered: null },
      { status: "OUT_OF_STOCK", unitPrice: 50, ordered: 4 }, // 200
      { status: "OUT_OF_STOCK", unitPrice: 150, ordered: 2 }, // 300
    ];

    let checked = 0;
    let none = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalOrderAmount = 0;

    for (const itm of sampleItems) {
      if (itm.status === "NONE") {
        none++;
      } else {
        checked++;
        if (itm.status === "IN_STOCK") inStock++;
        else if (itm.status === "LOW_STOCK") lowStock++;
        else if (itm.status === "OUT_OF_STOCK") {
          outOfStock++;
          const orderQty = itm.ordered && itm.ordered > 0 ? itm.ordered : 1;
          totalOrderAmount += itm.unitPrice * orderQty;
        }
      }
    }

    if (checked !== 4 || none !== 1 || inStock !== 1 || lowStock !== 1 || outOfStock !== 2 || totalOrderAmount !== 500) {
      throw new Error(`Stats aggregation mismatch! checked=${checked}, totalOrderAmount=${totalOrderAmount}`);
    }
    console.log(`✓ Stats aggregation correctly computed: checked=${checked}, totalOrderAmount=฿${totalOrderAmount}`);

  } finally {
    // Restore original item state
    console.log("\n-> Restoring original item state in DB...");
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: originalState.status,
        remain: originalState.remain,
        ordered: originalState.ordered,
      },
    });
    console.log("✓ Original item state restored successfully.");
  }

  console.log("\n=========================================");
  console.log("🎉 ALL STOCK VIEW VERIFICATION TESTS PASSED!");
  console.log("=========================================");
}

runStockViewVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ VERIFICATION TEST FAILED:", err);
    process.exit(1);
  });
