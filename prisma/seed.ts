import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

export function hashPin(pin: string): string {
  const salt = "stock_checker_salt_2026";
  return createHash("sha256").update(`${pin}:${salt}`).digest("hex");
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Set default PIN: 1234
  const hashedPin = hashPin("1234");
  await prisma.setting.upsert({
    where: { key: "pin" },
    update: { value: hashedPin },
    create: { key: "pin", value: hashedPin },
  });
  console.log("✅ Default PIN (1234) configured in settings.");

  // Clear existing items and suppliers for a clean seed
  await prisma.snapshotItem.deleteMany();
  await prisma.snapshotArchive.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();

  // 1. Siam Makro Wholesale
  const makro = await prisma.supplier.create({
    data: {
      name: "สยามแม็คโคร (Makro)",
      contactPhone: "02-777-8888",
      note: "สั่งก่อน 11:00 จัดส่งวันรุ่งขึ้น",
      minOrderAmount: 3000,
      items: {
        create: [
          { name: "น้ำดื่มสิงห์ 600ml (แพ็ค 12 ขวด)", unit: "แพ็ค", unitPrice: 48, note: "ขายดีประจำร้าน" },
          { name: "น้ำดื่มสิงห์ 1500ml (แพ็ค 6 ขวด)", unit: "แพ็ค", unitPrice: 52, note: "สต็อกหน้าตู้" },
          { name: "ข้าวสารหอมมะลิ 5 กก.", unit: "ถุง", unitPrice: 195, note: "ตราฉัตรสีทอง" },
          { name: "น้ำตาลทรายขาว มิตรผล 1 กก. (แพ็ค 10 ถุง)", unit: "แพ็ค", unitPrice: 260, note: "เครื่องปรุงหลัก" },
          { name: "น้ำมันพืชปาล์ม มรกต 1 ลิตร (ลัง 12 ขวด)", unit: "ลัง", unitPrice: 560, note: "ลังละ 12 ขวด" },
          { name: "นมข้นหวาน คาร์เนชัน 388g (ถาด 48 กระป๋อง)", unit: "ถาด", unitPrice: 1120, note: "สำหรับชงกาแฟ" },
        ],
      },
    },
  });

  // 2. Boon Rawd Trading
  const boonrawd = await prisma.supplier.create({
    data: {
      name: "บุญรอด เทรดดิ้ง (Singha)",
      contactPhone: "02-242-4000",
      note: "ส่งสินค้าทุกวันอังคารและศุกร์",
      minOrderAmount: 2500,
      items: {
        create: [
          { name: "เบียร์ลีโอ 620ml (ลัง 12 ขวด)", unit: "ลัง", unitPrice: 680, note: "ตรวจนับขวดแก้วลัง" },
          { name: "เบียร์สิงห์ 620ml (ลัง 12 ขวด)", unit: "ลัง", unitPrice: 810, note: "เบียร์พรีเมียม" },
          { name: "โซดาสิงห์ 325ml (ถาด 24 ขวด)", unit: "ถาด", unitPrice: 235, note: "หมุนเวียนเร็ว" },
          { name: "น้ำดื่มสิงห์ 330ml (แพ็ค 12 ขวด)", unit: "แพ็ค", unitPrice: 42, note: "ขนาดเล็กพกพาง่าย" },
          { name: "ชาเขียวชิซึโอกะ 440ml (ลัง 24 ขวด)", unit: "ลัง", unitPrice: 650, note: "สูตรไม่มีน้ำตาล" },
          { name: "โซดาเลมอนสิงห์ 330ml (ถาด 24 กระป๋อง)", unit: "ถาด", unitPrice: 360, note: "เครื่องดื่มกระป๋อง" },
        ],
      },
    },
  });

  // 3. Thai President Foods (มาม่า)
  const mama = await prisma.supplier.create({
    data: {
      name: "ไทยเพรซิเดนท์ฟูดส์ (มาม่า)",
      contactPhone: "02-374-4730",
      note: "รอบส่งสินค้าวันพุธ",
      minOrderAmount: 1500,
      items: {
        create: [
          { name: "มาม่ารสต้มยำกุ้ง 55g (กล่อง 30 ซอง)", unit: "กล่อง", unitPrice: 180, note: "รสยอดนิยมอันดับ 1" },
          { name: "มาม่ารสต้มยำกุ้งน้ำข้น 55g (กล่อง 30 ซอง)", unit: "กล่อง", unitPrice: 180, note: "รสยอดนิยมอันดับ 2" },
          { name: "มาม่ารสหมูสับ 55g (กล่อง 30 ซอง)", unit: "กล่อง", unitPrice: 180, note: "ขายดีตลอดกาล" },
          { name: "มาม่ารสเป็ดพะโล้ 55g (กล่อง 30 ซอง)", unit: "กล่อง", unitPrice: 180, note: "กลุ่มลูกค้าร้านอาหาร" },
          { name: "มาม่าคัพ รสต้มยำกุ้ง (ลัง 36 ถ้วย)", unit: "ลัง", unitPrice: 460, note: "สะดวกพร้อมทาน" },
          { name: "มาม่าบิ๊กแพ็ค รสต้มยำกุ้ง (กล่อง 24 ซอง)", unit: "กล่อง", unitPrice: 215, note: "ขนาดจัมโบ้" },
        ],
      },
    },
  });

  // 4. Osotspa
  const osotspa = await prisma.supplier.create({
    data: {
      name: "โอสถสภา (Osotspa)",
      contactPhone: "02-351-1000",
      note: "เครื่องดื่มชูกำลังและวิตามินซี",
      minOrderAmount: 2000,
      items: {
        create: [
          { name: "เอ็ม-150 150ml (แพ็ค 10 ขวด)", unit: "แพ็ค", unitPrice: 105, note: "เครื่องดื่มชูกำลัง" },
          { name: "เอ็ม-150 ฝาทอง 150ml (ลัง 50 ขวด)", unit: "ลัง", unitPrice: 560, note: "สูตรผสมวิตามินบี" },
          { name: "ซี-วิท เลมอน 140ml (แพ็ค 10 ขวด)", unit: "แพ็ค", unitPrice: 145, note: "วิตามินซี 200%" },
          { name: "ซี-วิท ส้ม 140ml (แพ็ค 10 ขวด)", unit: "แพ็ค", unitPrice: 145, note: "รสส้มยอดนิยม" },
          { name: "ฉลามขาว 150ml (แพ็ค 10 ขวด)", unit: "แพ็ค", unitPrice: 95, note: "สูตรกระชายดำ" },
          { name: "กาแฟเบอร์ดี้ โรบัสต้า (ถาด 30 กระป๋อง)", unit: "ถาด", unitPrice: 435, note: "กาแฟกระป๋องแดง" },
        ],
      },
    },
  });

  // 5. Unilever Thai Holdings
  const unilever = await prisma.supplier.create({
    data: {
      name: "ยูนิลีเวอร์ (Unilever)",
      contactPhone: "02-554-2000",
      note: "สินค้าอุปโภคบริโภคประจำบ้าน",
      minOrderAmount: 2000,
      items: {
        create: [
          { name: "บรีส เอกเซล ผงซักฟอก 800g (ลัง 12 ถุง)", unit: "ลัง", unitPrice: 690, note: "สูตรเข้มข้น" },
          { name: "ซันไลต์ เลมอนเทอร์โบ 750ml (ลัง 12 ถุง)", unit: "ลัง", unitPrice: 390, note: "ถุงเติมน้ำยาล้างจาน" },
          { name: "คอมฟอร์ท น้ำยาปรับผ้านุ่ม สีฟ้า 500ml (ลัง 24 ถุง)", unit: "ลัง", unitPrice: 480, note: "กลิ่นสัมผัสรักสดชื่น" },
          { name: "สบู่ลักส์ ซากุระ 105g (แพ็ค 4 ก้อน)", unit: "แพ็ค", unitPrice: 58, note: "สบู่ก้อนบำรุงผิว" },
          { name: "ยาสระผมซันซิล สีชมพู 320ml", unit: "ขวด", unitPrice: 89, note: "ผมมีน้ำหนักจัดทรงง่าย" },
          { name: "คนอร์ ผงปรุงรส รสไก่ 400g (แพ็ค 6 ถุง)", unit: "แพ็ค", unitPrice: 270, note: "เครื่องปรุงรส" },
        ],
      },
    },
  });

  // 6. Seed a realistic sample past Snapshot Archive for demonstration in History Log
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);

  await prisma.snapshotArchive.create({
    data: {
      snapshotDate: pastDate,
      note: "รอบนับสต็อกประจำสัปดาห์ที่แล้ว (สัปดาห์สิ้นเดือน)",
      totalItemsChecked: 28,
      totalOutOfStock: 4,
      totalOrderAmount: 4890,
      createdAt: pastDate,
      items: {
        create: [
          {
            supplierName: makro.name,
            itemName: "น้ำดื่มสิงห์ 600ml (แพ็ค 12 ขวด)",
            unit: "แพ็ค",
            unitPrice: 48,
            status: "OUT_OF_STOCK",
            remain: 0,
            ordered: 20,
            lineTotal: 960,
          },
          {
            supplierName: makro.name,
            itemName: "น้ำมันพืชปาล์ม มรกต 1 ลิตร (ลัง 12 ขวด)",
            unit: "ลัง",
            unitPrice: 560,
            status: "OUT_OF_STOCK",
            remain: 0,
            ordered: 3,
            lineTotal: 1680,
          },
          {
            supplierName: boonrawd.name,
            itemName: "สิงห์ โซดา 325ml (ถาด 24 ขวด)",
            unit: "ถาด",
            unitPrice: 215,
            status: "OUT_OF_STOCK",
            remain: 0,
            ordered: 5,
            lineTotal: 1075,
          },
          {
            supplierName: mama.name,
            itemName: "มาม่า บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง (ลัง 30 ซอง)",
            unit: "ลัง",
            unitPrice: 195,
            status: "OUT_OF_STOCK",
            remain: 0,
            ordered: 6,
            lineTotal: 1175,
          },
          {
            supplierName: osotspa.name,
            itemName: "เอ็ม-150 150ml (แพ็ค 10 ขวด)",
            unit: "แพ็ค",
            unitPrice: 105,
            status: "IN_STOCK",
            remain: 8,
            ordered: null,
            lineTotal: 0,
          },
          {
            supplierName: unilever.name,
            itemName: "บรีส เอกเซล ผงซักฟอก 800g (ลัง 12 ถุง)",
            unit: "ลัง",
            unitPrice: 690,
            status: "LOW_STOCK",
            remain: 1,
            ordered: null,
            lineTotal: 0,
          },
        ],
      },
    },
  });
  console.log("✅ Seeded sample historical weekly snapshot for testing.");

  console.log(`✅ Seeded 5 suppliers (${makro.name}, ${boonrawd.name}, ${mama.name}, ${osotspa.name}, ${unilever.name}) with 30 items.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
