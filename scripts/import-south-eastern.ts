import { prisma } from "../src/lib/prisma";

const RAW_DATA = `
Avocado 60/70	55.95
Rice Calrose (Sushi) 	34.95
Ginger Pickle	28.95
Sushi Seasoning KD 39 	38.95
Soy Sauce package	15.5
Lite Soy Sauce Package	30.95
Sriracha Sauce Package	32.95
Hoisin Sauce Package	27.95
Paper Bag 1/8	38.95
Paper Bag #25 HD	35.95
Foam Box togo 6#	29.95
Fried Garlic	48.95
Chopstick Bamboo Full Envelope	34.95
Chopsticks-Disp Single (Red)	23.95
Paper Towel-Natural (Brown)	29.95
Thai Black Tea WD	
Thai Black Coffee WD	4.5
Bamboo Skewer 8"	3.95
Chicken Base Totole	80
MSG Mono Sodium Glutamate	75
Chili Pepper Ground Thai	15.95
Coconut Cream-MAEPLOY	62.95
Curry Paste Green	
Curry Paste Massaman 	62.95
Curry Paste Red	58.95
Doily Paper 8" 	
Doily Paper 6" 	12.95
Fish Sauce - Healthy Boy	32.95
Thin Soy Sauce	29.95
Seasoning Sauce 20oz	32.95
Sweet Soy sauce	34.95
Oyster Sauce Panda	43.95
Liquid Shortening (Deep fry Oil)35lb	39.95
lite Soy Sauce Kik 5 Gal	53.95
Soy Sauce kikoman 5 Gal	35.95
Namprik Pao-Maesri	118
Shrimp paste PK	112
Panko Bread C Untoasted	
Plum Sugar 4 elephants	
Radish	94.95
Rice Stick 10MM-4 Elephants	43.95
Rice Stick 3MM-4 Elephants	13.95
White Pepper Ground	15.5
Sesame Oil-Kadoya	19.95
Sugar 50lb	31.95
Rock Sugar	2.5
Tamarind Concentrate	65.95
Tamarind powder	
Tapioca Strach	
Vegetable Oil MARINA	38.95
Cashew Nuts 5lb	33.95
Peanuts Blanched	11.95
Bamboo Shoot Slice	27.95
Water Cheast Nuts	
Pineapple Chunk-Dole	67.95
Plastic Film 12"	12.95
Bean Thread (Clear Noodle)	2.5
Dumpling Pork Cooked (Gyoza)	53.95
Edamame Sanfuku (Unsalt)	33.95
Spring Roll Veg 1.76oz	39.95
Caramari Ring	120
Soft Shell Crab (Prime)	33.95
Tempura Shrimp 21/25	39.95
Glove - Vinyl (Large)	
Glove - Vinyl (Medium)	35
Green Mussels 12x2lb	
Plastic Soup Container 16oz	23.95
Plastic Soup Container 32oz	35.95
Plastic Tray 8 2.88	25.95
Plastic Tray 8.78	25.95
Hondashi Ajinomoto	24.95
Vinegar White	11.95
Mirin-Honteri	45.5
Beef Eye Round	482.95
Pork Loin- Center Cut	90.96
(Chicken) Boneless Breast	55
Chicken Bone	35.6
Duck Split Roasted	140
Fish snaper	75
Glutinous Rice (Sticky Rice)	43.95
Rice Burries	
Brown Rice	13.95
Salt 50lb	
Rice Jasmine 25lb/50lb	24.95
Rice Long Grain 	21.95
Tempura Flour	34.95
White Shrimp 21/25	62
Rice Noodle-Ho Fun (Pad See-ew)	15.5
Wonton Wrapper HK Style	44.5
Bean Sprout (10lb)	12.95
Broccoli Crown Asian Cut	25.95
Carrot Jumbo 50lb	38.95
Chinease Broccoli 5lb	9.95
Spanish Onions (White)	31.5
Cream cheese	82.95
Egg	
Garlic Peeled	15.95
Green Pepper	39.95
Red Pepper	44.95
Mushroom Fresh Medium	21.75
Scallion Green Onion	33.95
String Bean Cleaned (Green Bean)	32.95
Thai Basil 2lb	23.9
Tomatos	82.5
Tofu Firm House	25.95
Shiro Miso White 	21.9
Tonkatsu Ramen Soup Mix 1621	124.5
Noodle-Banh pho 	34.95
Zucchini	29.95
Saseme Seed	
Produce Bag - 12x20 Clear	28.95
`;

function guessUnit(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("50lb") || lower.includes("35lb") || lower.includes("25lb") || lower.includes("10lb") || lower.includes("5lb") || lower.includes("2lb")) {
    return "ถุง/กล่อง";
  }
  if (lower.includes("bag")) return "ถุง";
  if (lower.includes("box")) return "กล่อง";
  if (lower.includes("gal")) return "แกลลอน";
  if (lower.includes("package") || lower.includes("tray") || lower.includes("wrapper")) return "แพ็ค";
  if (lower.includes("sauce") || lower.includes("oil") || lower.includes("vinegar")) return "ขวด/ถัง";
  return "ชิ้น";
}

async function main() {
  console.log("🚀 Starting South Eastern import to Neon PostgreSQL...");

  // 1. Create or find supplier
  let supplier = await prisma.supplier.findFirst({
    where: { name: "South Eastern" },
  });

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "South Eastern",
        minOrderAmount: 0,
        note: "Wholesale food & restaurant supply",
      },
    });
    console.log(`✅ Created supplier: South Eastern (ID: ${supplier.id})`);
  } else {
    console.log(`ℹ️ Found existing supplier: South Eastern (ID: ${supplier.id})`);
  }

  // 2. Parse items
  const lines = RAW_DATA.trim().split("\n");
  const itemsToCreate: Array<{ name: string; unitPrice: number; unit: string; supplierId: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by tab or multiple spaces
    let parts = trimmed.split("\t");
    if (parts.length === 1) {
      // Fallback: match price at end of line if separated by 2+ spaces
      const match = trimmed.match(/^(.*?)\s{2,}([0-9.]+)$/);
      if (match) {
        parts = [match[1], match[2]];
      } else {
        parts = [trimmed, "0"];
      }
    }

    const name = parts[0].trim();
    const priceStr = parts[1] ? parts[1].trim() : "0";
    const unitPrice = parseFloat(priceStr) || 0;
    const unit = guessUnit(name);

    itemsToCreate.push({
      name,
      unitPrice,
      unit,
      supplierId: supplier.id,
    });
  }

  console.log(`📦 Parsed ${itemsToCreate.length} items. Inserting into database...`);

  // Insert items sequentially or with createMany
  const result = await prisma.item.createMany({
    data: itemsToCreate,
  });

  console.log(`🎉 Successfully imported ${result.count} items for South Eastern!`);

  const totalInDb = await prisma.item.count();
  console.log(`📊 Total items now in database: ${totalInDb}`);
}

main()
  .catch((e) => {
    console.error("❌ Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
