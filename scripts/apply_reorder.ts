import { prisma } from "../src/lib/prisma";
import { matchAll } from "./match_verification";

const supplierSequence = [
  "South Eastern",
  "Sams",
  "Walmart",
  "Restaurant Depot",
  "Chinese Restaurant",
  "RNDC",
  "JJ-Taylor",
  "Suncoast Beverage",
  "True World",
  "Fish Co",
];

async function applyReorder() {
  console.log("Matching items from user input...");
  const { results, unmatched, usedItemIds } = await matchAll();

  if (unmatched.length > 0) {
    console.error("Cannot apply reorder: some items were not matched!", unmatched);
    process.exit(1);
  }

  console.log(`Matched ${results.length} items. Fetching unused DB items...`);
  const allDbItems = await prisma.item.findMany({
    select: { id: true, name: true, supplier: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const remainingItems = allDbItems.filter((it) => !usedItemIds.has(it.id));
  console.log(`Found ${remainingItems.length} remaining items (e.g. Fish Co).`);

  // Build the full list of item updates
  const itemUpdates: { id: string; name: string; sortOrder: number; price: number }[] = [];

  // 1. Items from user list
  for (const r of results) {
    itemUpdates.push({
      id: r.itemId,
      name: r.itemName,
      sortOrder: r.index,
      price: r.price,
    });
  }

  // 2. Remaining items appended
  let nextOrder = results.length + 1;
  for (const rem of remainingItems) {
    itemUpdates.push({
      id: rem.id,
      name: rem.name,
      sortOrder: nextOrder++,
      price: 0, // keep as is or don't overwrite if not given
    });
  }

  console.log(`Total item updates prepared: ${itemUpdates.length}`);

  // 3. Update suppliers sortOrder
  console.log("Updating suppliers sortOrder...");
  for (let i = 0; i < supplierSequence.length; i++) {
    const sName = supplierSequence[i];
    await prisma.supplier.updateMany({
      where: { name: sName },
      data: { sortOrder: i + 1 },
    });
  }
  console.log("Suppliers sortOrder updated successfully.");

  // 4. Update items sortOrder and unitPrice in batches
  console.log("Updating items sortOrder and prices...");
  const BATCH_SIZE = 25;
  for (let i = 0; i < itemUpdates.length; i += BATCH_SIZE) {
    const chunk = itemUpdates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map((item) =>
        item.sortOrder <= results.length
          ? prisma.item.update({
              where: { id: item.id },
              data: {
                sortOrder: item.sortOrder,
                unitPrice: item.price,
              },
            })
          : prisma.item.update({
              where: { id: item.id },
              data: {
                sortOrder: item.sortOrder,
              },
            })
      )
    );
    process.stdout.write(`Updated ${Math.min(i + BATCH_SIZE, itemUpdates.length)} / ${itemUpdates.length} items\r`);
  }

  console.log("\n✅ All items and suppliers updated successfully!");

  // Verify first 10 items in DB
  const first10 = await prisma.item.findMany({
    take: 10,
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true, name: true, unitPrice: true, supplier: { select: { name: true } } },
  });
  console.log("First 10 items in DB after reordering:");
  console.table(first10.map((x) => ({
    "#": x.sortOrder,
    Supplier: x.supplier.name,
    Item: x.name,
    Price: x.unitPrice,
  })));

  // Verify items around 110-115 (transition from South Eastern to Sams)
  const transition = await prisma.item.findMany({
    skip: 109,
    take: 6,
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true, name: true, unitPrice: true, supplier: { select: { name: true } } },
  });
  console.log("Items 110-115 (South Eastern to Sams):");
  console.table(transition.map((x) => ({
    "#": x.sortOrder,
    Supplier: x.supplier.name,
    Item: x.name,
    Price: x.unitPrice,
  })));
}

applyReorder()
  .catch((err) => {
    console.error("Reorder failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
