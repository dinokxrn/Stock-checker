import React from "react";
import { ShoppingCart } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm border border-amber-100">
        <ShoppingCart className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">สรุปยอดสั่งซื้อ (Order Dashboard)</h2>
      <p className="text-xs text-slate-500 max-w-xs mt-1">
        คำนวณยอดสั่งซื้อสินค้าหมด (Out of Stock) เทียบกับยอดสั่งซื้อขั้นต่ำ และส่งออก LINE (ขั้นตอน [G3])
      </p>
    </div>
  );
}
