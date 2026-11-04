"use client";

import { Search, X, Plus, Package, Building2 } from "lucide-react";

export type MasterTab = "items" | "suppliers";

interface MasterFilterBarProps {
  activeTab: MasterTab;
  onTabChange: (tab: MasterTab) => void;
  itemCount: number;
  supplierCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSupplierId: string;
  onSupplierChange: (id: string) => void;
  suppliers: Array<{ id: string; name: string }>;
  onAddNew: () => void;
}

export function MasterFilterBar({
  activeTab,
  onTabChange,
  itemCount,
  supplierCount,
  searchQuery,
  onSearchChange,
  selectedSupplierId,
  onSupplierChange,
  suppliers,
  onAddNew,
}: MasterFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Top Segmented Controls: Items vs Suppliers */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => onTabChange("items")}
          className={`flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all touch-manipulation ${
            activeTab === "items"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>รายการสินค้า</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "items"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {itemCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("suppliers")}
          className={`flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all touch-manipulation ${
            activeTab === "suppliers"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>บริษัทคู่ค้า</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "suppliers"
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {supplierCount}
          </span>
        </button>
      </div>

      {/* Search Input & Action Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              activeTab === "items"
                ? "ค้นหาชื่อสินค้า, หมายเหตุ..."
                : "ค้นหาชื่อคู่ค้า, เบอร์โทร..."
            }
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
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

        {/* 48px touch target add button */}
        <button
          type="button"
          onClick={onAddNew}
          className="min-h-[48px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all shrink-0 touch-manipulation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{activeTab === "items" ? "เพิ่มสินค้า" : "เพิ่มคู่ค้า"}</span>
        </button>
      </div>

      {/* Horizontal Supplier Pills (Only for Items tab) */}
      {activeTab === "items" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => onSupplierChange("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors touch-manipulation min-h-[38px] border ${
              selectedSupplierId === "ALL"
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            ทั้งหมด ({itemCount})
          </button>

          {suppliers.map((s) => {
            const isSelected = selectedSupplierId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSupplierChange(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors touch-manipulation min-h-[38px] border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
