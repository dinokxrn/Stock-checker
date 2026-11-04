import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [supplierCount, itemCount, setting] = await Promise.all([
    prisma.supplier.count(),
    prisma.item.count(),
    prisma.setting.findUnique({ where: { key: "pin" } }),
  ]);

  return (
    <div className="flex-1 flex flex-col p-6 items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-lg mb-6">
        📦
      </div>
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
        ระบบตรวจนับสต็อกสินค้า
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Stock Checker &amp; Supplier Order System
      </p>

      <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">สถานะฐานข้อมูล:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            เชื่อมต่อสำเร็จ (WAL)
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">จำนวนคู่ค้า (Suppliers):</span>
          <span className="font-semibold text-slate-800">{supplierCount} บริษัท</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">จำนวนสินค้า (Items):</span>
          <span className="font-semibold text-slate-800">{itemCount} รายการ</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">รหัส PIN เริ่มต้น:</span>
          <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">
            {setting ? "พร้อมใช้งาน (1234)" : "ยังไม่ได้ตั้งค่า"}
          </span>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-xs text-slate-400">
          พร้อมสำหรับการพัฒนาส่วนติดต่อผู้ใช้ในขั้นตอน [G2] - [G4]
        </div>
      </div>
    </div>
  );
}
