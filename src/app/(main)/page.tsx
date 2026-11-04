import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, ShoppingCart, Database, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [supplierCount, itemCount] = await Promise.all([
    prisma.supplier.count(),
    prisma.item.count(),
  ]);

  return (
    <div className="flex-1 flex flex-col space-y-4 py-2">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white backdrop-blur-sm mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              พร้อมตรวจนับสต็อก
            </span>
            <h2 className="text-xl font-bold tracking-tight">ระบบตรวจนับสต็อกประจำสัปดาห์</h2>
            <p className="text-xs text-blue-100 mt-1">
              แตะสถานะสินค้าแต่ละรายการเพื่อเริ่มตรวจนับและคำนวณยอดสั่งซื้อ
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>คู่ค้าทั้งหมด</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{supplierCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">บริษัทคู่ค้าที่ผูกไว้</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>สินค้าทั้งหมด</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{itemCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">รายการสินค้าในระบบ</div>
        </div>
      </div>

      {/* Database & Security Status */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          สถานะระบบ &amp; ฐานข้อมูล
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 text-xs">โหมดฐานข้อมูล SQLite:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            WAL Mode (Active)
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600 text-xs">ระบบความปลอดภัย:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            PIN Protected (Session Active)
          </span>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          เมนูด่วน
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">สรุปยอดสั่งซื้อ</div>
              <div className="text-[10px] text-slate-400">ดูยอดเทียบขั้นต่ำ</div>
            </div>
          </Link>

          <Link
            href="/master"
            className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800">จัดการข้อมูลหลัก</div>
              <div className="text-[10px] text-slate-400">คู่ค้า &amp; สินค้า</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
