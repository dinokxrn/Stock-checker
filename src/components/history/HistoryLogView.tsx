"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { deleteSnapshotAction } from "@/actions/snapshot";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  History,
  Calendar,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  FileText,
  Loader2,
} from "lucide-react";

export interface SnapshotItemData {
  id: string;
  snapshotId: string;
  supplierName: string;
  itemName: string;
  unit: string;
  unitPrice: number;
  status: string;
  remain: number | null;
  ordered: number | null;
  isOrdered?: boolean;
  lineTotal: number;
}

export interface SnapshotArchiveData {
  id: string;
  snapshotDate: Date | string;
  note: string | null;
  totalItemsChecked: number;
  totalOutOfStock: number;
  totalOrderAmount: number;
  createdAt: Date | string;
  items: SnapshotItemData[];
}

interface HistoryLogViewProps {
  initialSnapshots: SnapshotArchiveData[];
}

export default function HistoryLogView({ initialSnapshots }: HistoryLogViewProps) {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [snapshots, setSnapshots] = useState<SnapshotArchiveData[]>(initialSnapshots);
  const [expandedSnapshots, setExpandedSnapshots] = useState<Record<string, boolean>>({});
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format date to locale
  const formatThaiDate = useCallback(
    (dateVal: Date | string) => {
      try {
        const date = new Date(dateVal);
        return new Intl.DateTimeFormat(isEn ? "en-US" : "th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
      } catch {
        return String(dateVal);
      }
    },
    [isEn]
  );

  // Toggle snapshot expansion
  const toggleSnapshot = (id: string) => {
    setExpandedSnapshots((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter snapshots based on query
  const filteredSnapshots = useMemo(() => {
    if (!searchQuery.trim()) return snapshots;
    const q = searchQuery.toLowerCase().trim();
    return snapshots.filter((snap) => {
      const matchNote = snap.note ? snap.note.toLowerCase().includes(q) : false;
      const dateStr = formatThaiDate(snap.snapshotDate).toLowerCase();
      const matchDate = dateStr.includes(q);
      const matchItem = snap.items.some(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.supplierName.toLowerCase().includes(q)
      );
      return matchNote || matchDate || matchItem;
    });
  }, [snapshots, searchQuery, formatThaiDate]);

  // Export Snapshot to UTF-8 BOM CSV
  const handleExportCsv = (snapshot: SnapshotArchiveData) => {
    try {
      const bom = "\uFEFF";
      const headers = isEn
        ? [
            t("csv_header_no"),
            t("csv_header_supplier"),
            t("csv_header_item_name"),
            t("csv_header_unit"),
            t("csv_header_unit_price"),
            t("csv_header_status"),
            t("csv_header_remain"),
            t("csv_header_order_qty"),
            t("csv_header_line_total"),
          ]
        : [
            "ลำดับ",
            "คู่ค้า",
            "ชื่อสินค้า",
            "หน่วย",
            "ราคาต่อหน่วย(บาท)",
            "สถานะ",
            "คงเหลือ",
            "จำนวนที่สั่ง",
            "ยอดรวม(บาท)",
          ];

      const rows = snapshot.items.map((item, index) => {
        let statusText = isEn ? "Uncounted" : "ยังไม่นับ";
        if (item.status === "IN_STOCK") statusText = isEn ? "In Stock" : "มีพอ";
        else if (item.status === "LOW_STOCK") statusText = isEn ? "Low Stock" : "ใกล้หมด";
        else if (item.status === "OUT_OF_STOCK") statusText = isEn ? "Out of Stock" : "สินค้าหมด";

        const escape = (val: string | number | null | undefined) => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        return [
          index + 1,
          escape(item.supplierName),
          escape(item.itemName),
          escape(item.unit),
          item.unitPrice,
          escape(statusText),
          item.remain !== null ? item.remain : "",
          item.ordered !== null ? item.ordered : "",
          item.lineTotal,
        ].join(",");
      });

      const csvContent = bom + headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateSlug = new Date(snapshot.snapshotDate)
        .toISOString()
        .slice(0, 10);
      link.href = url;
      link.setAttribute("download", `stock-snapshot-${dateSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(t("toast_csv_exported"));
    } catch (err) {
      console.error("Export CSV failed:", err);
      showToast(t("error_export_csv"));
    }
  };

  // Copy LINE summary of snapshot
  const handleCopyLineSummary = async (snapshot: SnapshotArchiveData) => {
    const formattedDate = formatThaiDate(snapshot.snapshotDate);
    const outOfStockItems = snapshot.items.filter(
      (i) => i.status === "OUT_OF_STOCK"
    );
    const lowStockItems = snapshot.items.filter(
      (i) => i.status === "LOW_STOCK"
    );

    // Group items by supplier
    const suppliers = Array.from(new Set(snapshot.items.map((i) => i.supplierName)));

    const lines: string[] = [
      t("snapshot_line_header"),
      `${t("snapshot_line_date")} ${formattedDate}`,
    ];

    if (snapshot.note) {
      lines.push(`${t("snapshot_line_note")} ${snapshot.note}`);
    }

    lines.push(`--------------------------------`);

    let hasAlerts = false;
    for (const supplierName of suppliers) {
      const sOut = outOfStockItems.filter((i) => i.supplierName === supplierName);
      const sLow = lowStockItems.filter((i) => i.supplierName === supplierName);

      if (sOut.length === 0 && sLow.length === 0) continue;
      hasAlerts = true;

      lines.push(`🏢 ${supplierName}`);
      if (sOut.length > 0) {
        lines.push(t("snapshot_line_out_of_stock"));
        sOut.forEach((it, idx) => {
          const qty = it.ordered && it.ordered > 0 ? it.ordered : 1;
          lines.push(`  ${idx + 1}. ${it.itemName} (${t("snapshot_line_order_qty")} ${qty} ${it.unit})`);
        });
      }
      if (sLow.length > 0) {
        lines.push(t("snapshot_line_low_stock"));
        sLow.forEach((it, idx) => {
          const remain = it.remain !== null && it.remain !== undefined ? it.remain : 0;
          lines.push(`  ${idx + 1}. ${it.itemName} (${t("snapshot_line_remain_qty")} ${remain} ${it.unit})`);
        });
      }
      lines.push("");
    }

    if (!hasAlerts) {
      lines.push(t("snapshot_line_no_items"));
    }

    lines.push(`================================`);
    lines.push(
      `${t("snapshot_line_grand_total")} ฿${snapshot.totalOrderAmount.toLocaleString(
        isEn ? "en-US" : "th-TH",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`
    );

    const message = lines.join("\n");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedId(snapshot.id);
      showToast(t("toast_copied_line_summary"));
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
      showToast(t("error_copy_failed"));
    }
  };

  // Delete snapshot handler
  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!confirm(t("confirm_delete_snapshot"))) {
      return;
    }

    setDeletingId(snapshotId);
    try {
      const res = await deleteSnapshotAction(snapshotId);
      if (!res.success) {
        showToast(res.error || t("error_delete_snapshot"));
        setDeletingId(null);
        return;
      }

      // Optimistically remove from list
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      showToast(t("toast_snapshot_deleted"));
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(t("error_delete_snapshot"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 py-2 pb-24 max-w-md mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-2 animate-fade-in pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {t("history_page_title")}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t("history_subtitle_count").replace("{count}", String(snapshots.length))}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 touch-manipulation min-h-[36px]"
          >
            <span>{t("nav_stock_check")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("history_search_placeholder")}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] touch-manipulation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredSnapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3 mt-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
            <History className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">
              {snapshots.length === 0
                ? t("history_empty_title")
                : t("history_search_empty_title")}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {snapshots.length === 0
                ? t("history_empty_desc")
                : (isEn ? "Try changing search terms or clear search" : "ลองเปลี่ยนคำค้นหา หรือกดล้างคำค้นหา")}
            </p>
          </div>
          {snapshots.length === 0 ? (
            <Link
              href="/"
              className="mt-2 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 touch-manipulation"
            >
              <span>{t("go_to_stock_count")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              {t("clear_filter")}
            </button>
          )}
        </div>
      ) : (
        /* Snapshot Cards List */
        <div className="space-y-3">
          {filteredSnapshots.map((snapshot) => {
            const isExpanded = !!expandedSnapshots[snapshot.id];
            const isDeleting = deletingId === snapshot.id;
            const isCopied = copiedId === snapshot.id;

            // Group items by supplier for this snapshot
            const supplierGroups = snapshot.items.reduce<
              Record<string, SnapshotItemData[]>
            >((acc, item) => {
              if (!acc[item.supplierName]) acc[item.supplierName] = [];
              acc[item.supplierName].push(item);
              return acc;
            }, {});

            const supplierNames = Object.keys(supplierGroups).sort();
            const currentFilter =
              selectedSupplierFilter[snapshot.id] || "ALL";

            const displayedItems =
              currentFilter === "ALL"
                ? snapshot.items
                : supplierGroups[currentFilter] || [];

            return (
              <div
                key={snapshot.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Snapshot Card Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{formatThaiDate(snapshot.snapshotDate)}</span>
                      </div>
                      {snapshot.note && (
                        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg flex items-center gap-1 max-w-xs">
                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{snapshot.note}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      disabled={isDeleting}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors touch-manipulation"
                      title={t("delete_snapshot_tooltip")}
                      aria-label={t("delete_snapshot_tooltip")}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="text-[10px] text-slate-500">{t("items_counted")}</div>
                      <div className="text-xs font-bold text-slate-800">
                        {snapshot.totalItemsChecked} {t("items_unit")}
                      </div>
                    </div>
                    <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-xl">
                      <div className="text-[10px] text-rose-600">{t("status_out_of_stock")}</div>
                      <div className="text-xs font-extrabold text-rose-700">
                        {snapshot.totalOutOfStock} {t("items_unit")}
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                      <div className="text-[10px] text-indigo-600">{isEn ? "Total Order" : "ยอดสั่งซื้อรวม"}</div>
                      <div className="text-xs font-extrabold text-indigo-700 truncate">
                        ฿{snapshot.totalOrderAmount.toLocaleString(isEn ? "en-US" : "th-TH", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row - 48px touch targets */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Copy to LINE button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLineSummary(snapshot)}
                      className="flex-1 min-h-[44px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{t("copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-emerald-600" />
                          <span>{isEn ? "Copy (LINE)" : "คัดลอกสรุป (LINE)"}</span>
                        </>
                      )}
                    </button>

                    {/* CSV Export Button */}
                    <button
                      type="button"
                      onClick={() => handleExportCsv(snapshot)}
                      className="min-h-[44px] px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors"
                      title={t("download_csv_tooltip")}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Excel (CSV)</span>
                    </button>

                    {/* Expand/Collapse Accordion */}
                    <button
                      type="button"
                      onClick={() => toggleSnapshot(snapshot.id)}
                      className="min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 touch-manipulation transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? t("collapse_items_btn") : t("view_items_btn")}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Item Detail Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-3 space-y-3">
                    {/* Supplier Sub-filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSupplierFilter((prev) => ({
                            ...prev,
                            [snapshot.id]: "ALL",
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors min-h-[32px] border ${
                          currentFilter === "ALL"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {t("all_suppliers_tab").replace("{count}", String(snapshot.items.length))}
                      </button>
                      {supplierNames.map((sName) => {
                        const count = supplierGroups[sName]?.length || 0;
                        const isSel = currentFilter === sName;
                        return (
                          <button
                            key={sName}
                            type="button"
                            onClick={() =>
                              setSelectedSupplierFilter((prev) => ({
                                ...prev,
                                [snapshot.id]: sName,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors min-h-[32px] border ${
                              isSel
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span>{sName}</span>
                            <span className="ml-1 opacity-70">({count})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Items Table/List */}
                    <div className="space-y-1.5">
                      {displayedItems.map((item) => {
                        let statusBadge = (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {isEn ? "Uncounted" : "ยังไม่นับ"}
                          </span>
                        );

                        if (item.status === "IN_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                              {t("status_in_stock")} ({item.remain} {item.unit})
                            </span>
                          );
                        } else if (item.status === "LOW_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                              {t("status_low_stock")} ({item.remain} {item.unit})
                            </span>
                          );
                        } else if (item.status === "OUT_OF_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200">
                              {isEn ? "Order" : "สั่ง"}: {item.ordered} {item.unit}
                            </span>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 truncate">
                                {item.itemName}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span>{item.supplierName}</span>
                                <span>•</span>
                                <span>฿{item.unitPrice} / {item.unit}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div>{statusBadge}</div>
                              {item.status === "OUT_OF_STOCK" && (
                                <div className="text-[11px] font-extrabold text-slate-800 mt-0.5">
                                  ฿{item.lineTotal.toLocaleString(isEn ? "en-US" : "th-TH", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
