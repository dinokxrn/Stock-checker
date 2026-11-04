"use client";

import React, { useState } from "react";
import { Bell, ChevronRight, X, Clock } from "lucide-react";
import { getSupplierScheduleStatus, ScheduleStatus } from "@/lib/order-schedule";

export interface ScheduledSupplierInfo {
  id: string;
  name: string;
  orderDays?: string | null;
}

interface OrderScheduleAlertProps {
  suppliers: ScheduledSupplierInfo[];
  onSelectSupplier?: (supplierId: string) => void;
  className?: string;
}

export function OrderScheduleAlert({
  suppliers,
  onSelectSupplier,
  className = "",
}: OrderScheduleAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Group suppliers by schedule status
  const todaySuppliers: { supplier: ScheduledSupplierInfo; status: ScheduleStatus }[] = [];
  const tomorrowSuppliers: { supplier: ScheduledSupplierInfo; status: ScheduleStatus }[] = [];

  suppliers.forEach((s) => {
    const status = getSupplierScheduleStatus(s.orderDays);
    if (!status) return;
    if (status.isToday) {
      todaySuppliers.push({ supplier: s, status });
    } else if (status.isTomorrow) {
      tomorrowSuppliers.push({ supplier: s, status });
    }
  });

  if (isDismissed || (todaySuppliers.length === 0 && tomorrowSuppliers.length === 0)) {
    return null;
  }

  const hasToday = todaySuppliers.length > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all shadow-sm ${
        hasToday
          ? "bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-rose-300"
          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
      } ${className}`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                hasToday
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-bounce"
                  : "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              }`}
            >
              {hasToday ? <Bell className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>
                  {hasToday
                    ? "🚨 วันนี้ถึงรอบสั่งของแล้ว!"
                    : "⏰ แจ้งเตือน: พรุ่งนี้มีรอบสั่งของ!"}
                </span>
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hasToday
                  ? "ตรวจนับสต็อกและส่งออเดอร์ให้เซลส์ก่อนตัดรอบ"
                  : "เตรียมตรวจนับสต็อกล่วงหน้าสำหรับคู่ค้าที่มีรอบสั่งพรุ่งนี้"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 rounded-lg bg-white/70 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0 transition-colors"
            title="ปิดการแจ้งเตือน"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Supplier Badges */}
        <div className="mt-3 space-y-2">
          {/* Today's suppliers */}
          {todaySuppliers.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md shrink-0">
                สั่งวันนี้:
              </span>
              {todaySuppliers.map(({ supplier }) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => onSelectSupplier?.(supplier.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-800 border border-rose-300 shadow-2xs hover:bg-rose-50 active:scale-95 transition-all touch-manipulation"
                >
                  <span>{supplier.name}</span>
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          )}

          {/* Tomorrow's suppliers */}
          {tomorrowSuppliers.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md shrink-0">
                สั่งพรุ่งนี้:
              </span>
              {tomorrowSuppliers.map(({ supplier }) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => onSelectSupplier?.(supplier.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-50 active:scale-95 transition-all touch-manipulation"
                >
                  <span>{supplier.name}</span>
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
