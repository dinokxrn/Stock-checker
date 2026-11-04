"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { deleteSnapshotAction } from "@/actions/snapshot";
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

  // Format date to Thai Buddhist Era
  const formatThaiDate = (dateVal: Date | string) => {
    try {
      const date = new Date(dateVal);
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return String(dateVal);
    }
  };

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
  }, [snapshots, searchQuery]);

  // Export Snapshot to UTF-8 BOM CSV
  const handleExportCsv = (snapshot: SnapshotArchiveData) => {
    try {
      const bom = "\uFEFF";
      const headers = [
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
        let statusText = "ยังไม่นับ";
        if (item.status === "IN_STOCK") statusText = "มีพอ";
        else if (item.status === "LOW_STOCK") statusText = "ใกล้หมด";
        else if (item.status === "OUT_OF_STOCK") statusText = "สินค้าหมด";

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

      showToast("ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว (รองรับ Excel ภาษาไทย)");
    } catch (err) {
      console.error("Export CSV failed:", err);
      showToast("เกิดข้อผิดพลาดในการดาวน์โหลด CSV");
    }
  };

  // Copy LINE summary of snapshot
  const handleCopyLineSummary = async (snapshot: SnapshotArchiveData) => {
    const thaiDate = formatThaiDate(snapshot.snapshotDate);
    const outOfStockItems = snapshot.items.filter(
      (i) => i.status === "OUT_OF_STOCK"
    );
    const lowStockItems = snapshot.items.filter(
      (i) => i.status === "LOW_STOCK"
    );

    // Group items by supplier
    const suppliers = Array.from(new Set(snapshot.items.map((i) => i.supplierName)));

    const lines: string[] = [
      `📦 สรุปสต็อกย้อนหลัง (Snapshot)`,
      `📅 วันที่: ${thaiDate}`,
    ];

    if (snapshot.note) {
      lines.push(`📝 บันทึก: ${snapshot.note}`);
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
        lines.push(`🔴 สินค้าที่หมดแล้ว:`);
        sOut.forEach((it, idx) => {
          const qty = it.ordered && it.ordered > 0 ? it.ordered : 1;
          lines.push(`  ${idx + 1}. ${it.itemName} (สั่ง ${qty} ${it.unit})`);
        });
      }
      if (sLow.length > 0) {
        lines.push(`🟡 สินค้าที่ใกล้หมด:`);
        sLow.forEach((it, idx) => {
          const remain = it.remain !== null && it.remain !== undefined ? it.remain : 0;
          lines.push(`  ${idx + 1}. ${it.itemName} (เหลือ ${remain} ${it.unit})`);
        });
      }
      lines.push("");
    }

    if (!hasAlerts) {
      lines.push(`(ไม่มีสินค้าหมดหรือใกล้หมดในรอบนี้)`);
    }

    lines.push(`================================`);
    lines.push(
      `💰 ยอดสั่งซื้อรวมทั้งหมด: ฿${snapshot.totalOrderAmount.toLocaleString(
        "th-TH",
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
      showToast("คัดลอกสรุปสั่งซื้อลงคลิปบอร์ดแล้ว");
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("ไม่สามารถคัดลอกได้");
    }
  };

  // Delete snapshot handler
  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการนับรอบนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    setDeletingId(snapshotId);
    try {
      const res = await deleteSnapshotAction(snapshotId);
      if (!res.success) {
        showToast(res.error || "ไม่สามารถลบประวัติได้");
        setDeletingId(null);
        return;
      }

      // Optimistically remove from list
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      showToast("ลบประวัติการนับเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("เกิดข้อผิดพลาดในการลบประวัติ");
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
                ประวัติการนับสต็อก (History)
              </h2>
              <p className="text-[11px] text-slate-500">
                บันทึก Snapshot ประจำสัปดาห์ทั้งหมด {snapshots.length} ครั้ง
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 touch-manipulation min-h-[36px]"
          >
            <span>นับสต็อก</span>
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
            placeholder="ค้นหาวันที่, บันทึกช่วยจำ หรือชื่อสินค้า..."
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
                ? "ยังไม่มีประวัติการนับสต็อก"
                : "ไม่พบประวัติที่ตรงกับคำค้นหา"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {snapshots.length === 0
                ? "เมื่อกดปุ่ม 'รีเซ็ต' ในหน้าตรวจนับสต็อก ข้อมูลสรุปประจำสัปดาห์จะถูกจัดเก็บไว้ที่นี่โดยอัตโนมัติ"
                : "ลองเปลี่ยนคำค้นหา หรือกดล้างคำค้นหา"}
            </p>
          </div>
          {snapshots.length === 0 ? (
            <Link
              href="/"
              className="mt-2 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 touch-manipulation"
            >
              <span>ไปที่หน้าตรวจนับสต็อก</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              ล้างคำค้นหา
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
                      title="ลบประวัตินี้"
                      aria-label="ลบประวัตินี้"
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
                      <div className="text-[10px] text-slate-500">นับแล้ว</div>
                      <div className="text-xs font-bold text-slate-800">
                        {snapshot.totalItemsChecked} รายการ
                      </div>
                    </div>
                    <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-xl">
                      <div className="text-[10px] text-rose-600">สินค้าหมด</div>
                      <div className="text-xs font-extrabold text-rose-700">
                        {snapshot.totalOutOfStock} รายการ
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                      <div className="text-[10px] text-indigo-600">ยอดสั่งซื้อรวม</div>
                      <div className="text-xs font-extrabold text-indigo-700 truncate">
                        ฿{snapshot.totalOrderAmount.toLocaleString("th-TH", {
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
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-emerald-600" />
                          <span>คัดลอกสรุป (LINE)</span>
                        </>
                      )}
                    </button>

                    {/* CSV Export Button */}
                    <button
                      type="button"
                      onClick={() => handleExportCsv(snapshot)}
                      className="min-h-[44px] px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation transition-colors"
                      title="ดาวน์โหลดไฟล์ CSV สำหรับ Excel"
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
                      <span>{isExpanded ? "ย่อ" : "ดูรายการ"}</span>
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
                        คู่ค้าทั้งหมด ({snapshot.items.length})
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
                            ยังไม่นับ
                          </span>
                        );

                        if (item.status === "IN_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                              มีพอ ({item.remain} {item.unit})
                            </span>
                          );
                        } else if (item.status === "LOW_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold border border-amber-200">
                              ใกล้หมด ({item.remain} {item.unit})
                            </span>
                          );
                        } else if (item.status === "OUT_OF_STOCK") {
                          statusBadge = (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200">
                              สั่ง: {item.ordered} {item.unit}
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
                                  ฿{item.lineTotal.toLocaleString("th-TH", {
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
