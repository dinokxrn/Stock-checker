"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { StockItemCard, StockItem } from "./StockItemCard";
import { StockFilterBar, StockStats } from "./StockFilterBar";
import { WeeklyResetModal } from "./WeeklyResetModal";
import { updateItemStockStatus, StockStatus } from "@/actions/stock";
import { OrderScheduleAlert } from "@/components/OrderScheduleAlert";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShoppingCart, PackageSearch, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface StockCheckingViewProps {
  initialItems: StockItem[];
  suppliers: Array<{ id: string; name: string; minOrderAmount: number; orderDays?: string | null }>;
}

export function StockCheckingView({ initialItems, suppliers }: StockCheckingViewProps) {
  const { t } = useLanguage();
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
    setSuccessBanner(t("weekly_reset_success"));
    setTimeout(() => {
      setSuccessBanner(null);
    }, 5000);
  }, [t]);

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

  // Filter items to display:
  // "เมื่อกดบันทึกแล้วจะหายไปจากหน้าตรวจนับสต็อก ถ้าจะแก้ไขไปที่หน้าสรุปสั่งซื้อ"
  const { itemsToDisplay, isFilterActive } = useMemo(() => {
    const matched = items.filter((item) => {
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

    // If default view (selectedStatus === "ALL"), strictly show ONLY uncounted items (status === "NONE")
    // When saved, status becomes IN_STOCK/LOW_STOCK/OUT_OF_STOCK and disappears immediately!
    const toDisplay =
      selectedStatus === "ALL"
        ? matched.filter((item) => item.status === "NONE")
        : matched;

    return {
      itemsToDisplay: toDisplay,
      isFilterActive: searchQuery !== "" || selectedSupplierId !== "ALL" || selectedStatus !== "ALL",
    };
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
        setServerError(res.error || t("stock_save_error"));
        return false;
      }

      return true;
    },
    [items, t]
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
            {t("close")}
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
            {t("close")}
          </button>
        </div>
      )}

      {/* Approaching Order Day Alert Banner */}
      <OrderScheduleAlert
        suppliers={suppliers}
        onSelectSupplier={(supplierId) => setSelectedSupplierId(supplierId)}
      />

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

      {/* Count Info Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-0.5">
        <span>
          {selectedStatus === "ALL" ? (
            <>
              {t("items_to_count")} <strong className="text-slate-800 font-bold">{itemsToDisplay.length}</strong> {t("items_unit")}{" "}
              <span className="text-slate-400 font-normal">
                ({t("items_counted")} {stats.checked} / {stats.total})
              </span>
            </>
          ) : (
            <>
              {t("showing_items")} <strong className="text-slate-800 font-bold">{itemsToDisplay.length}</strong> {t("items_unit")}
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          {isFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSupplierId("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              {t("clear_filter")}
            </button>
          )}
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
          >
            <span>{t("nav_order")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stock Items List or Empty / All Counted States */}
      {itemsToDisplay.length === 0 ? (
        stats.total > 0 && stats.checked === stats.total && !isFilterActive ? (
          /* All Counted Celebration Card */
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-emerald-200 rounded-3xl text-center space-y-4 shadow-sm my-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-800">
                {t("all_counted_title")}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {t("all_counted_desc")}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all touch-manipulation"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t("go_to_order_summary")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Filtered empty state */
          <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-2 mt-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <PackageSearch className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700">{t("empty_uncounted_title")}</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              {isFilterActive
                ? t("empty_filter_desc_active")
                : t("empty_uncounted_desc")}
            </p>
            <div className="flex items-center gap-2 pt-2">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSupplierId("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  {t("reset_filter")}
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <span>{t("go_to_order_summary")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {itemsToDisplay.map((item) => (
            <StockItemCard key={item.id} item={item} onUpdate={handleItemUpdate} />
          ))}
        </div>
      )}

      {/* Sticky Bottom Order Summary Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 max-w-md mx-auto px-4 pb-2 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-between pointer-events-auto">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {t("status_out_of_stock")}: {stats.outOfStock}
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {t("status_low_stock")}: {stats.lowStock}
              </span>
            </div>
            <div className="text-sm font-extrabold text-white tracking-tight mt-0.5">
              {t("counted_progress_summary")} {stats.checked} / {stats.total} {t("items_unit")}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="min-h-[44px] px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all shrink-0 touch-manipulation"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t("view_orders")}</span>
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
