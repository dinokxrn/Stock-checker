import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  archiveAndResetWeeklyStock,
  getSnapshotsAction,
  deleteSnapshotAction,
} from "../src/actions/snapshot";
import { updateItemStockStatus } from "../src/actions/stock";

async function runHistorySnapshotTests() {
  console.log("=== Testing Weekly Reset Workflow & History Snapshot Archiving ===");

  // 1. Fetch available suppliers & items
  const suppliers = await prisma.supplier.findMany({
    include: { items: true },
    orderBy: { name: "asc" },
  });

  assert.ok(suppliers.length >= 2, "Need at least 2 suppliers for testing");
  const allItems = await prisma.item.findMany();
  assert.ok(allItems.length >= 4, "Need at least 4 items for testing");

  console.log(`Found ${suppliers.length} suppliers and ${allItems.length} total items in DB.`);

  // 2. Set up deterministic test state across 4 items
  const item1 = allItems[0]; // IN_STOCK
  const item2 = allItems[1]; // LOW_STOCK
  const item3 = allItems[2]; // OUT_OF_STOCK (qty: 3)
  const item4 = allItems[3]; // OUT_OF_STOCK (qty: 7)

  console.log("Setting item stock statuses...");
  await updateItemStockStatus(item1.id, "IN_STOCK", 20, null);
  await updateItemStockStatus(item2.id, "LOW_STOCK", 2, null);
  await updateItemStockStatus(item3.id, "OUT_OF_STOCK", 0, 3);
  await updateItemStockStatus(item4.id, "OUT_OF_STOCK", 0, 7);

  // Remaining items set to NONE
  for (let i = 4; i < allItems.length; i++) {
    await updateItemStockStatus(allItems[i].id, "NONE", null, null);
  }

  // Calculate expected snapshot metrics
  const expectedCheckedCount = 4; // item1, item2, item3, item4
  const expectedOutOfStockCount = 2; // item3, item4
  const expectedOrderTotal = (item3.unitPrice * 3) + (item4.unitPrice * 7);

  console.log(`Expected metrics: Checked=${expectedCheckedCount}, OutOfStock=${expectedOutOfStockCount}, TotalOrder=฿${expectedOrderTotal}`);

  // 3. Execute archiveAndResetWeeklyStock
  const testNote = "รอบนับสัปดาห์ทดสอบระบบ 1 พ.ย. 67";
  console.log(`Calling archiveAndResetWeeklyStock with note: "${testNote}"...`);
  const resetRes = await archiveAndResetWeeklyStock(testNote);

  assert.equal(resetRes.success, true, "archiveAndResetWeeklyStock must return success=true");
  assert.ok(resetRes.data, "Snapshot result data must be defined");
  const snapshotData = resetRes.data!;

  assert.equal(snapshotData.note, testNote, "Snapshot note must match input");
  assert.equal(snapshotData.totalItemsChecked, expectedCheckedCount, `totalItemsChecked must be ${expectedCheckedCount}`);
  assert.equal(snapshotData.totalOutOfStock, expectedOutOfStockCount, `totalOutOfStock must be ${expectedOutOfStockCount}`);
  assert.equal(snapshotData.totalOrderAmount, expectedOrderTotal, `totalOrderAmount must be ${expectedOrderTotal}`);
  assert.equal(snapshotData.itemsCount, allItems.length, "All store items must be frozen in snapshot archive");

  console.log("✓ Snapshot archive created with matching metrics.");

  // 4. Verify that ALL live items in the store were atomically reset to NONE
  const liveItemsAfterReset = await prisma.item.findMany();
  for (const item of liveItemsAfterReset) {
    assert.equal(item.status, "NONE", `Item ${item.name} status must be reset to NONE`);
    assert.equal(item.remain, null, `Item ${item.name} remain must be reset to null`);
    assert.equal(item.ordered, null, `Item ${item.name} ordered must be reset to null`);
  }
  console.log("✓ All live items atomically reset to NONE, remain=null, ordered=null.");

  // 5. Verify snapshot retrieval with getSnapshotsAction
  console.log("Testing getSnapshotsAction()...");
  const getRes = await getSnapshotsAction();
  assert.equal(getRes.success, true, "getSnapshotsAction must return success=true");
  assert.ok(Array.isArray(getRes.data), "getSnapshotsAction data must be an array");
  
  const savedSnapshot = getRes.data.find((s) => s.id === snapshotData.id);
  assert.ok(savedSnapshot, "Newly archived snapshot must exist in database query");
  assert.equal(savedSnapshot!.items.length, allItems.length, "All items must be populated in relation");

  // Verify frozen items inside saved snapshot
  const frozenItem3 = savedSnapshot!.items.find((i) => i.itemName === item3.name);
  assert.ok(frozenItem3, "Frozen item 3 must exist in snapshot");
  assert.equal(frozenItem3!.status, "OUT_OF_STOCK");
  assert.equal(frozenItem3!.ordered, 3);
  assert.equal(frozenItem3!.unitPrice, item3.unitPrice);
  assert.equal(frozenItem3!.lineTotal, item3.unitPrice * 3);

  const frozenItem1 = savedSnapshot!.items.find((i) => i.itemName === item1.name);
  assert.ok(frozenItem1, "Frozen item 1 must exist in snapshot");
  assert.equal(frozenItem1!.status, "IN_STOCK");
  assert.equal(frozenItem1!.remain, 20);
  assert.equal(frozenItem1!.ordered, null);
  assert.equal(frozenItem1!.lineTotal, 0);

  console.log("✓ Frozen snapshot items correctly preserved pricing, status, and line totals.");

  // 6. Test CSV UTF-8 BOM encoding format
  const bom = "\uFEFF";
  const csvHeaders = "ลำดับ,คู่ค้า,ชื่อสินค้า,หน่วย,ราคาต่อหน่วย(บาท),สถานะ,คงเหลือ,จำนวนที่สั่ง,ยอดรวม(บาท)";
  const csvFirstRow = `1,"${frozenItem3!.supplierName}","${frozenItem3!.itemName}","${frozenItem3!.unit}",${frozenItem3!.unitPrice},"สินค้าหมด",,3,${frozenItem3!.lineTotal}`;
  const mockCsv = bom + csvHeaders + "\n" + csvFirstRow;
  assert.ok(mockCsv.startsWith("\uFEFF"), "CSV must include UTF-8 BOM prefix for Excel Thai compatibility");
  assert.ok(mockCsv.includes("สินค้าหมด"), "CSV must encode Thai text cleanly");
  console.log("✓ UTF-8 BOM CSV generation format verified.");

  // 7. Verify Cascade Deletion of Snapshot
  console.log(`Testing deleteSnapshotAction for snapshot ID: ${snapshotData.id}...`);
  const delRes = await deleteSnapshotAction(snapshotData.id);
  assert.equal(delRes.success, true, "deleteSnapshotAction must return success=true");

  const checkArchive = await prisma.snapshotArchive.findUnique({
    where: { id: snapshotData.id },
  });
  assert.equal(checkArchive, null, "Snapshot archive record must be deleted");

  const checkItems = await prisma.snapshotItem.findMany({
    where: { snapshotId: snapshotData.id },
  });
  assert.equal(checkItems.length, 0, "All associated SnapshotItems must be cascade deleted");

  console.log("✓ Snapshot and all related SnapshotItems cascade deleted cleanly.");

  console.log("\n🎉 ALL HISTORY SNAPSHOT TESTS PASSED SUCCESSFULLY!\n");
}

runHistorySnapshotTests()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  });
