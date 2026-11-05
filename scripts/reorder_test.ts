import { prisma } from "../src/lib/prisma";
import { rawInput } from "./reorder_data";

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\d]/g, "") // remove punctuation & emoji
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const lines = rawInput.trim().split("\n");
  console.log(`Total input lines: ${lines.length}`);

  const suppliers = await prisma.supplier.findMany({
    include: { items: true },
  });

  const allItems = await prisma.item.findMany({
    include: { supplier: true },
  });

  console.log(`Database has ${suppliers.length} suppliers and ${allItems.length} items.`);

  const supplierMap = new Map<string, typeof suppliers[0]>();
  for (const s of suppliers) {
    supplierMap.set(normalize(s.name), s);
  }

  // Aliases for suppliers if spelling differs
  const supplierAliases: Record<string, string> = {
    "resturant depot": "restaurant depot",
    "chinease resturant": "chinese restaurant",
    "suncoat beverage": "suncoast beverage",
    "true world": "true world",
  };

  let matchedCount = 0;
  const unmatched: any[] = [];
  const processedItems: { id: string; targetOrder: number; price: number; name: string }[] = [];
  const usedItemIds = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("\t");
    if (parts.length < 3) {
      console.log(`Invalid line ${i + 1}: ${line}`);
      continue;
    }

    const rawSupplier = parts[0].trim();
    const rawItemName = parts[1].trim();
    const rawPrice = parseFloat(parts[2].trim()) || 0;

    let normSup = normalize(rawSupplier);
    if (supplierAliases[normSup]) {
      normSup = normalize(supplierAliases[normSup]);
    }

    const matchedSupplier = supplierMap.get(normSup);
    if (!matchedSupplier) {
      unmatched.push({ index: i + 1, reason: "Supplier not found", rawSupplier, rawItemName });
      continue;
    }

    // Try matching item within that supplier
    const normItem = normalize(rawItemName);
    let matchedItem = matchedSupplier.items.find(
      (item) => !usedItemIds.has(item.id) && normalize(item.name) === normItem
    );

    // If not exact match, try fuzzy substring or loose match within supplier
    if (!matchedItem) {
      matchedItem = matchedSupplier.items.find(
        (item) =>
          !usedItemIds.has(item.id) &&
          (normalize(item.name).includes(normItem) || normItem.includes(normalize(item.name)))
      );
    }

    // If still not matched, try searching across all items
    if (!matchedItem) {
      matchedItem = allItems.find(
        (item) => !usedItemIds.has(item.id) && normalize(item.name) === normItem
      );
    }

    if (matchedItem) {
      usedItemIds.add(matchedItem.id);
      matchedCount++;
      processedItems.push({
        id: matchedItem.id,
        name: matchedItem.name,
        targetOrder: i + 1,
        price: rawPrice,
      });
    } else {
      unmatched.push({
        index: i + 1,
        reason: "Item not found in supplier",
        rawSupplier,
        supplierNameInDb: matchedSupplier.name,
        rawItemName,
        availableItemsInSup: matchedSupplier.items.map((x) => x.name),
      });
    }
  }

  console.log(`Matched: ${matchedCount} / ${lines.length}`);
  if (unmatched.length > 0) {
    console.log(`Unmatched count: ${unmatched.length}`);
    console.log(JSON.stringify(unmatched, null, 2));
  }

  // Check which items in DB were not in this list
  const unusedInDb = allItems.filter((item) => !usedItemIds.has(item.id));
  console.log(`Items in DB not in list: ${unusedInDb.length}`);
  console.log(
    unusedInDb.map((x) => ({ id: x.id, name: x.name, supplier: x.supplier.name }))
  );
}

main().finally(() => prisma.$disconnect());
