import { prisma } from "../src/lib/prisma";
import { rawInput } from "./reorder_data";

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s\d]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const itemAliases: Record<string, string> = {
  // Sams
  "drpeper": "dr pepper",
  "sparking water": "sparkling water",
  "peper napskin": "paper napkin",
  "papika powder": "paprika powder",
  "trash bag 55 gal": "trash bag 55gal",
  "corrox": "clorox",
  "condesed milk": "condensed milk",
  // Walmart
  "bandaged": "bandages",
  "brith day candle": "birthday candles",
  "gas lighting": "gas lighter",
  "scrubber spongesteel": "scrubber sponge steel",
  "white paper": "white paper",
  // Restaurant Depot
  "sumbalic sauce": "sambal oelek sauce",
  "water cheast nut": "water chestnut",
  "white saseme seed": "white sesame seeds",
  "black saseme seed": "black sesame seeds",
  "glove l size": "gloves size l",
  "glove m size": "gloves size m",
  // RNDC
  "chadonnay coastal": "chardonnay coastal",
  "chadonnay st francis": "chardonnay st francis",
  "melot": "merlot",
  "jumai": "junmai",
  // JJ-Taylor
  "kirin ichiban12oz": "kirin ichiban 12oz",
  "kirin ichiban19oz": "kirin ichiban 19oz",
  "kirin ichiban22": "kirin ichiban 22oz",
  "yuenling": "yuengling",
  "michelop ultra": "michelob ultra",
  "non alcoholic": "nonalcoholic",
  "white craw": "white claw",
  // Suncoast
  "budwiser": "budweiser",
  // True World
  "pickel gingerramen": "pickled ginger ramen",
};

const supplierAliases: Record<string, string> = {
  "resturant depot": "restaurant depot",
  "chinease resturant": "chinese restaurant",
  "suncoat beverage": "suncoast beverage",
  "true world": "true world",
};

export async function matchAll() {
  const lines = rawInput.trim().split("\n");
  const suppliers = await prisma.supplier.findMany({
    include: { items: true },
  });

  const supplierMap = new Map<string, typeof suppliers[0]>();
  for (const s of suppliers) {
    supplierMap.set(normalize(s.name), s);
  }

  const results: {
    index: number;
    supplierId: string;
    supplierName: string;
    itemId: string;
    itemName: string;
    price: number;
  }[] = [];

  const usedItemIds = new Set<string>();
  const unmatched: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("\t");
    const rawSupplier = parts[0].trim();
    const rawItemName = parts[1].trim();
    const rawPrice = parseFloat(parts[2].trim()) || 0;

    let normSup = normalize(rawSupplier);
    if (supplierAliases[normSup]) {
      normSup = normalize(supplierAliases[normSup]);
    }

    const supplier = supplierMap.get(normSup);
    if (!supplier) {
      unmatched.push({ line: i + 1, error: "Supplier not found", rawSupplier });
      continue;
    }

    let normItem = normalize(rawItemName);
    if (itemAliases[normItem]) {
      normItem = normalize(itemAliases[normItem]);
    }

    // Try exact normalized match
    let item = supplier.items.find(
      (it) => !usedItemIds.has(it.id) && normalize(it.name) === normItem
    );

    // Try includes match
    if (!item) {
      item = supplier.items.find(
        (it) =>
          !usedItemIds.has(it.id) &&
          (normalize(it.name).includes(normItem) || normItem.includes(normalize(it.name)))
      );
    }

    if (item) {
      usedItemIds.add(item.id);
      results.push({
        index: i + 1,
        supplierId: supplier.id,
        supplierName: supplier.name,
        itemId: item.id,
        itemName: item.name,
        price: rawPrice,
      });
    } else {
      unmatched.push({
        line: i + 1,
        error: "Item not found",
        supplier: supplier.name,
        rawItemName,
        normItem,
      });
    }
  }

  return { results, unmatched, totalLines: lines.length, usedItemIds };
}

async function run() {
  const { results, unmatched, totalLines } = await matchAll();
  console.log(`Matched: ${results.length} / ${totalLines}`);
  if (unmatched.length > 0) {
    console.log("Unmatched items:", unmatched);
  } else {
    console.log("🎉 ALL 276 items matched 100% perfectly!");
  }
}

if (require.main === module) {
  run().finally(() => prisma.$disconnect());
}
