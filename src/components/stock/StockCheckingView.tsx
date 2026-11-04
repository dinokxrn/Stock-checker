"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { StockItemCard, StockItem } from "./StockItemCard";
import { StockFilterBar, StockStats } from "./StockFilterBar";
import { WeeklyResetModal } from "./WeeklyResetModal";
import { updateItemStockStatus, StockStatus } from "@/actions/stock";
import { ShoppingCart, PackageSearch, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface StockCheckingViewProps {
  initialItems: StockItem[];
  suppliers: Array<{ id: string; name: string; minOrderAmount: number }>;
}

export function StockCheckingView({ initialItems, suppliers }: StockCheckingViewProps) {
  const [items, setItems] = useState<StockItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleResetSuccess = useCallback(() => {
    // Reset all items locally to NONE
    setItems((prevList) =>
      prevList.map((item) => ({
        ...item,
        status: "NONE",
        remain: null,
        ordered: null,
      }))
    );
    setSuccessBanner("จัดเก็บประวัติและรีเซ็ตสต็อกทั้งหมดเรียบร้อยแล้ว (สามารถดูย้อนหลังได้ที่เมนูประวัติ)");
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  }, []);

  // Calculate live statistics across all items
  const stats: StockStats = useMemo(() => {
    let checked = 0;
    let none = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalOrderAmount = 0;

    for (const item of items) {
      if (item.status === "NONE") {
        none++;
      } else {
        checked++;
        if (item.status === "IN_STOCK") inStock++;
        else if (item.status === "LOW_STOCK") lowStock++;
        else if (item.status === "OUT_OF_STOCK") {
          outOfStock++;
          const orderQty = item.ordered && item.ordered > 0 ? item.ordered : 1;
          totalOrderAmount += item.unitPrice * orderQty;
        }
      }
    }

    return {
      total: items.length,
      checked,
      none,
      inStock,
      lowStock,
      outOfStock,
      totalOrderAmount,
    };
  }, [items]);

  // Pre-calculate item counts per supplier
  const supplierItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.supplierId] = (counts[item.supplierId] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Filter items based on user criteria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Supplier Filter
      if (selectedSupplierId !== "ALL" && item.supplierId !== selectedSupplierId) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchNote = item.note ? item.note.toLowerCase().includes(query) : false;
        const matchSupplier = item.supplier?.name.toLowerCase().includes(query) || false;
        if (!matchName && !matchNote && !matchSupplier) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedSupplierId, selectedStatus, searchQuery]);

  // Optimistic update handler for 0ms latency UI response
  const handleItemUpdate = useCallback(
    async (
      itemId: string,
      status: StockStatus,
      remain?: number | null,
      ordered?: number | null
    ): Promise<boolean> => {
      setServerError(null);

      // Snapshot previous item for rollback
      const prevItem = items.find((i) => i.id === itemId);

      // Apply optimistic update immediately
      setItems((prevList) =>
        prevList.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              status,
              remain: remain !== undefined ? remain : item.remain,
              ordered: ordered !== undefined ? ordered : item.ordered,
            };
          }
          return item;
        })
      );

      // Persist to SQLite in background via Server Action
      const res = await updateItemStockStatus(itemId, status, remain, ordered);

      if (!res.success) {
        // Rollback on failure
        if (prevItem) {
          setItems((prevList) =>
            prevList.map((i) => (i.id === itemId ? prevItem : i))
          );
        }
        setServerError(res.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return false;
      }

      return true;
    },
    [items]
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 py-2 pb-24">
      {/* Server Error Alert */}
      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-xs font-bold text-rose-600 underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Filter and Progress Bar */}
      <StockFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSupplierId={selectedSupplierId}
        onSupplierChange={setSelectedSupplierId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        suppliers={suppliers}
        supplierItemCounts={supplierItemCounts}
        stats={stats}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* Filter Status Badge & Result Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
        <span>
          แสดงผล <strong className="text-slate-800 font-bold">{filteredItems.length}</strong> จาก{" "}
          {items.length} รายการ
        </span>
        {(searchQuery || selectedSupplierId !== "ALL" || selectedStatus !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedSupplierId("ALL");
              setSelectedStatus("ALL");
            }}
            className="text-blue-600 hover:text-blue-800 font-medium underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      {/* Stock Items List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-2 mt-2">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700">ไม่พบรายการสินค้าที่ค้นหา</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองคู่ค้า/สถานะอื่น
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedSupplierId("ALL");
              setSelectedStatus("ALL");
            }}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            รีเซ็ตตัวกรอง
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <StockItemCard key={item.id} item={item} onUpdate={handleItemUpdate} />
          ))}
        </div>
      )}

      {/* Sticky Bottom Order Summary Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 max-w-md mx-auto px-4 pb-2 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-between pointer-events-auto">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>ต้องสั่งซื้อ:</span>
              <strong className="text-white font-bold">{stats.outOfStock} รายการ</strong>
            </div>
            <div className="text-base font-extrabold text-white tracking-tight">
              ฿{stats.totalOrderAmount.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all shrink-0 touch-manipulation"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>ดูสรุปยอด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Weekly Reset Confirmation Modal */}
      <WeeklyResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        stats={stats}
        onResetSuccess={handleResetSuccess}
      />
    </div>
  );
}
