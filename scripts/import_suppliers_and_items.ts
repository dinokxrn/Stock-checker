import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SupplierData {
  name: string;
  note?: string;
  items: string[];
}

const suppliersData: SupplierData[] = [
  {
    name: "Sams",
    note: "Sam's Club wholesale & beverages",
    items: [
      "Coke",
      "Diet Coke",
      "Sprite",
      "Dr. Pepper",
      "Root Beer",
      "Ginger Ale",
      "Lemonade",
      "Sparkling Water",
      "Sweet Tea Honey & Ginseng",
      "Bottle of Water",
      "Milk",
      "Hot Green Tea",
      "Togo Box Small",
      "Togo Box Large",
      "Bath Tissue",
      "Paper Napkin",
      "Plastic Bag Small",
      "Plastic Bag Large",
      "Ice Cream",
      "Straw",
      "Utensils",
      "Eggs",
      "Green Bean",
      "Mayonnaise",
      "Honey",
      "Broccoli Crown",
      "Hand Soap Sanitizer",
      "All Purpose Cleaner",
      "Baking Powder",
      "Paprika Powder",
      "Cinnamon",
      "Star Anise",
      "Pam Spray Oil",
      "Trash Bag 13Gal",
      "Trash Bag 55Gal",
      "Laundry Detergent",
      "Clorox",
      "Degreaser Spray",
      "Condensed Milk",
    ],
  },
  {
    name: "Walmart",
    note: "Produce, groceries & supplies",
    items: [
      "Unsweet Ice Tea",
      "Decaf Tea",
      "Apple Juice",
      "Whip Cream",
      "Chocolate Syrup",
      "Cherry",
      "Coffee Mate",
      "Condensed Milk",
      "Corn Can",
      "Ketchup",
      "Tomato",
      "Cilantro",
      "Sweet Potato",
      "Potato",
      "Banana",
      "Thai Donut",
      "Lime",
      "Lime Juice",
      "Celery",
      "Lemon",
      "Eggs",
      "French Fries",
      "Cashew Nuts",
      "Lettuces",
      "Avocado",
      "Kale",
      "Jalapeño",
      "Asparagus",
      "Cucumber",
      "White Paper",
      "Broccoli Crown",
      "Mushroom",
      "Red Onion",
      "Scallion",
      "Green Bean",
      "Fresh Ginger",
      "Onions",
      "Chicken",
      "Apple Sauce",
      "Mayonnaise",
      "Peanut Butter Blue Cap",
      "Peanut Butter Red Cap",
      "Sandwich Bag",
      "Bandages",
      "Birthday Candles",
      "Dish Detergent",
      "Gas Lighter",
      "Scrubber (Sponge & Steel)",
      "Laundry Detergent",
    ],
  },
  {
    name: "Restaurant Depot",
    note: "Restaurant packaging, meat & Asian pantry",
    items: [
      "Plastic Cup 1.5oz",
      "Plastic Cup 4oz",
      "Togo Box Medium",
      "Foam Cup 16oz Water",
      "Foam Cup 16oz Curry",
      "Foam Cup 32oz",
      "Butterfly Shrimp",
      "Beef",
      "Pork",
      "Eel Sauce",
      "Eel",
      "Pad Thai Noodle",
      "Sambal Oelek Sauce",
      "Hoisin Sauce Refill",
      "Pineapple",
      "Water Chestnut",
      "White Sesame Seeds",
      "Black Sesame Seeds",
      "Bamboo Shoot",
      "Lobster Meat",
      "Sriracha Sauce",
      "Fresh Ginger",
      "Gloves (Size L)",
      "Gloves (Size M)",
      "Sweet and Chili Mae Ploy",
      "Gochujang",
    ],
  },
  {
    name: "Chinese Restaurant",
    note: "Chinese & Asian specialty items",
    items: [
      "Hot Jasmine Tea",
      "Fried Garlic",
      "Kimchi",
      "Hoisin Sauce Refill",
      "Pho Dry Spice",
      "Rice Paper Wrap",
    ],
  },
  {
    name: "RNDC",
    note: "Republic National Distributing Company (Wine & Sake)",
    items: [
      "Prosecco",
      "Sauvignon Coastal",
      "Sauvignon Giesen",
      "Pinot Grigio",
      "Chardonnay Coastal",
      "Chardonnay St. Francis",
      "Cabernet Sauvignon",
      "Merlot",
      "Sho Chiku Bai Hot",
      "Junmai",
      "Ginjo",
      "Nigori",
      "Plum Wine Koshu",
      "Lucky Buddha",
    ],
  },
  {
    name: "JJ-Taylor",
    note: "Beer distribution",
    items: [
      "Singha",
      "Chang",
      "Sapporo 12oz",
      "Sapporo 22oz",
      "Kirin Ichiban 12oz",
      "Kirin Ichiban 19oz",
      "Kirin Ichiban 22oz",
      "Corona",
      "Yuengling",
      "Michelob Ultra",
      "Heineken",
      "Blue Moon",
      "Non-Alcoholic",
      "Jai Alai",
      "White Claw",
    ],
  },
  {
    name: "Suncoast Beverage",
    note: "Beer & beverage supply",
    items: [
      "Modelo",
      "Stella Artois",
      "Budweiser",
      "Bud Light",
    ],
  },
  {
    name: "True World",
    note: "True World Foods - Japanese sushi & seafood",
    items: [
      "Saku Tuna",
      "White Tuna (Escolar)",
      "Salmon",
      "Nori",
      "Masago",
      "Hamachi",
      "Seaweed Salad",
      "Shumai",
      "Ramen Noodle",
      "Pork Belly",
      "Pickled Ginger (Ramen)",
      "Wasabi",
    ],
  },
  {
    name: "Fish Co",
    note: "Fresh seafood & sushi products",
    items: [
      "Saku Tuna",
      "Ground Tuna",
      "Escolar",
      "Masago",
      "Salmon",
      "Hamachi",
      "Seaweed Salad",
      "Kanikama",
      "Octopus",
      "Ginger Pickle",
      "Lump Crab Can",
      "Eel Unagi",
    ],
  },
];

async function main() {
  console.log("🚀 Starting fast batch import of 9 suppliers and items to Neon PostgreSQL...");

  for (const sup of suppliersData) {
    // Upsert supplier
    let supplier = await prisma.supplier.findFirst({
      where: {
        name: {
          equals: sup.name,
          mode: "insensitive",
        },
      },
      include: { items: { select: { name: true } } },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: sup.name,
          note: sup.note,
          minOrderAmount: 0,
        },
        include: { items: { select: { name: true } } },
      });
      console.log(`✅ Created supplier: ${supplier.name}`);
    } else {
      console.log(`ℹ️ Existing supplier: ${supplier.name}`);
    }

    const existingItemNames = new Set(supplier.items.map((i) => i.name.toLowerCase()));
    const newItemsToInsert = sup.items
      .filter((name) => !existingItemNames.has(name.toLowerCase()))
      .map((name) => ({
        name,
        unit: "ชิ้น",
        unitPrice: 0,
        status: "NONE",
        supplierId: supplier.id,
      }));

    if (newItemsToInsert.length > 0) {
      const res = await prisma.item.createMany({
        data: newItemsToInsert,
      });
      console.log(`   📦 Inserted ${res.count} items for ${supplier.name}`);
    } else {
      console.log(`   ✨ All ${sup.items.length} items already exist for ${supplier.name}`);
    }
  }

  // Summary
  const allSuppliers = await prisma.supplier.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  console.log("\n📊 Current Database Overview in Cloud (Neon):");
  let grandTotalItems = 0;
  allSuppliers.forEach((s) => {
    grandTotalItems += s._count.items;
    console.log(`- ${s.name}: ${s._count.items} รายการ`);
  });
  console.log(`\n🎉 รวมทั้งหมด: ${allSuppliers.length} ซัพพลายเออร์, ${grandTotalItems} รายการสินค้า`);
}

main()
  .catch((e) => {
    console.error("❌ Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
