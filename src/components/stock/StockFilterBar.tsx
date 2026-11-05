"use client";

import { Search, X, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Layers, RotateCcw } from "lucide-react";
import { getSupplierScheduleStatus } from "@/lib/order-schedule";
import { useLanguage } from "@/contexts/LanguageContext";

export interface StockStats {
  total: number;
  checked: number;
  none: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalOrderAmount: number;
}

interface StockFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSupplierId: string;
  onSupplierChange: (id: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  suppliers: Array<{ id: string; name: string; orderDays?: string | null }>;
  supplierItemCounts: Record<string, number>;
  stats: StockStats;
  onOpenResetModal?: () => void;
}

export function StockFilterBar({
  searchQuery,
  onSearchChange,
  selectedSupplierId,
  onSupplierChange,
  selectedStatus,
  onStatusChange,
  suppliers,
  supplierItemCounts,
  stats,
  onOpenResetModal,
}: StockFilterBarProps) {
  const { t } = useLanguage();
  const percentChecked =
    stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Live Count Progress Summary Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">{t("counting_progress")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-extrabold text-blue-600">
              {stats.checked} / {stats.total} {t("items_unit")} ({percentChecked}%)
            </div>
            {onOpenResetModal && (
              <button
                type="button"
                onClick={onOpenResetModal}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 touch-manipulation min-h-[36px]"
                title="รีเซ็ตและจัดเก็บข้อมูลประจำสัปดาห์"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>{t("reset_button")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${percentChecked}%` }}
          />
        </div>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onStatusChange(selectedStatus === "IN_STOCK" ? "ALL" : "IN_STOCK")}
            className={`p-1.5 rounded-xl border text-center transition-all touch-manipulation ${
              selectedStatus === "IN_STOCK"
                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
                : "bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/60"
            }`}
          >
            <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{t("status_in_stock")}</span>
            </div>
            <div className="text-sm font-extrabold text-emerald-800">{stats.inStock}</div>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(selectedStatus === "LOW_STOCK" ? "ALL" : "LOW_STOCK")}
            className={`p-1.5 rounded-xl border text-center transition-all touch-manipulation ${
              selectedStatus === "LOW_STOCK"
                ? "bg-amber-100 border-amber-400 ring-2 ring-amber-300"
                : "bg-amber-50/60 border-amber-100 hover:bg-amber-100/60"
            }`}
          >
            <div className="text-[10px] text-amber-700 font-medium flex items-center justify-center gap-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{t("status_low_stock")}</span>
            </div>
            <div className="text-sm font-extrabold text-amber-800">{stats.lowStock}</div>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(selectedStatus === "OUT_OF_STOCK" ? "ALL" : "OUT_OF_STOCK")}
            className={`p-1.5 rounded-xl border text-center transition-all touch-manipulation ${
              selectedStatus === "OUT_OF_STOCK"
                ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300"
                : "bg-rose-50/60 border-rose-100 hover:bg-rose-100/60"
            }`}
          >
            <div className="text-[10px] text-rose-700 font-medium flex items-center justify-center gap-0.5">
              <XCircle className="w-3 h-3 text-rose-600" />
              <span>{t("status_out_of_stock")}</span>
            </div>
            <div className="text-sm font-extrabold text-rose-800">{stats.outOfStock}</div>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(selectedStatus === "NONE" ? "ALL" : "NONE")}
            className={`p-1.5 rounded-xl border text-center transition-all touch-manipulation ${
              selectedStatus === "NONE"
                ? "bg-slate-200 border-slate-400 ring-2 ring-slate-300"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="text-[10px] text-slate-600 font-medium flex items-center justify-center gap-0.5">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              <span>{t("status_none")}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-700">{stats.none}</div>
          </button>
        </div>
      </div>

      {/* Search Input - 48px touch target */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("search_placeholder")}
          className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] touch-manipulation"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Supplier Filter Pills - Horizontally scrollable */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => onSupplierChange("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-manipulation min-h-[40px] border flex items-center gap-1.5 ${
            selectedSupplierId === "ALL"
              ? "bg-slate-800 text-white border-slate-800 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>คู่ค้าทั้งหมด ({stats.total})</span>
        </button>

        {suppliers.map((s) => {
          const isSelected = selectedSupplierId === s.id;
          const count = supplierItemCounts[s.id] || 0;
          const schedule = getSupplierScheduleStatus(s.orderDays);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSupplierChange(s.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-manipulation min-h-[40px] border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : schedule?.isToday
                  ? "bg-rose-50/70 text-slate-800 border-rose-300 hover:bg-rose-100/70"
                  : schedule?.isTomorrow
                  ? "bg-amber-50/70 text-slate-800 border-amber-300 hover:bg-amber-100/70"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {schedule?.isToday && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" title="รอบสั่งวันนี้!" />
              )}
              {schedule?.isTomorrow && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="รอบสั่งพรุ่งนี้!" />
              )}
              <span>{s.name}</span>
              {schedule?.isToday && !isSelected && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-1 rounded">วันนี้</span>
              )}
              {schedule?.isTomorrow && !isSelected && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">พรุ่งนี้</span>
              )}
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => onStatusChange("ALL")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
            selectedStatus === "ALL"
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          สถานะ: ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("NONE")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
            selectedStatus === "NONE"
              ? "bg-slate-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          ยังไม่นับ ({stats.none})
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("IN_STOCK")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
            selectedStatus === "IN_STOCK"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          มีพอ ({stats.inStock})
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("LOW_STOCK")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
            selectedStatus === "LOW_STOCK"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          ใกล้หมด ({stats.lowStock})
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("OUT_OF_STOCK")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
            selectedStatus === "OUT_OF_STOCK"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          สินค้าหมด ({stats.outOfStock})
        </button>
      </div>
    </div>
  );
}
