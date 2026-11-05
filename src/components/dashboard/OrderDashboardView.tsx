"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  Search,
  Store,
  MessageCircle,
  Eye,
  X,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { OrderScheduleAlert } from "@/components/OrderScheduleAlert";
import { getSupplierScheduleStatus } from "@/lib/order-schedule";

export interface DashboardItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  note?: string | null;
  status: string;
  remain?: number | null;
  ordered?: number | null;
  supplierId: string;
}

export interface DashboardSupplier {
  id: string;
  name: string;
  contactPhone?: string | null;
  note?: string | null;
  minOrderAmount: number;
  orderDays?: string | null;
  items: DashboardItem[];
}

interface OrderDashboardViewProps {
  initialSuppliers: DashboardSupplier[];
}

type FilterTab = "active" | "out_of_stock" | "low_stock" | "all";

export default function OrderDashboardView({ initialSuppliers }: OrderDashboardViewProps) {
  const [suppliers] = useState<DashboardSupplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("active");
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [previewSupplier, setPreviewSupplier] = useState<DashboardSupplier | null>(null);
  const [previewAllOpen, setPreviewAllOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle accordion expand/collapse
  const toggleExpand = (supplierId: string) => {
    setExpandedSuppliers((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }));
  };

  // Helper to format date for LINE message
  const getFormattedThaiDate = () => {
    const now = new Date();
    return now.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate LINE export formatted string for a single supplier (บอกเหลือ 0 ไม่ต้องสั่ง 1)
  const generateLineMessage = (supplier: DashboardSupplier) => {
    const dateStr = getFormattedThaiDate();
    const outOfStockItems = supplier.items.filter((item) => item.status === "OUT_OF_STOCK");
    const lowStockItems = supplier.items.filter((item) => item.status === "LOW_STOCK");

    const lines: string[] = [
      `📦 สรุปสต็อก - ${supplier.name}`,
      `📅 วันที่: ${dateStr}`,
      `---------------------------------`,
    ];

    if (outOfStockItems.length > 0) {
      lines.push(`🔴 สินค้าหมด (เหลือ 0):`);
      outOfStockItems.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name} (เหลือ 0 ${item.unit})`);
      });
    }

    if (lowStockItems.length > 0) {
      if (outOfStockItems.length > 0) {
        lines.push(``);
      }
      lines.push(`🟡 สินค้าใกล้หมด:`);
      lowStockItems.forEach((item, index) => {
        const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
        lines.push(`${index + 1}. ${item.name} (เหลือ ${remain} ${item.unit})`);
      });
    }

    if (outOfStockItems.length === 0 && lowStockItems.length === 0) {
      lines.push(`(ไม่มีรายการสินค้าหมดหรือใกล้หมด)`);
    }

    if (supplier.note?.trim()) {
      lines.push(`---------------------------------`);
      lines.push(`📝 หมายเหตุ: ${supplier.note.trim()}`);
    }

    return lines.join("\n");
  };

  // Generate combined LINE export formatted string separated by company
  const generateAllSuppliersLineMessage = () => {
    const dateStr = getFormattedThaiDate();
    const suppliersWithAlerts = suppliers.filter((s) =>
      s.items.some((i) => i.status === "OUT_OF_STOCK" || i.status === "LOW_STOCK")
    );

    const lines: string[] = [
      `📦 สรุปรายการสต็อกร้าน (แยกตามบริษัท)`,
      `📅 วันที่: ${dateStr}`,
      `=================================`,
    ];

    if (suppliersWithAlerts.length === 0) {
      lines.push(`(สต็อกมีครบทุกรายการ ไม่มีสินค้าหมดหรือใกล้หมด)`);
      return lines.join("\n");
    }

    suppliersWithAlerts.forEach((supplier, sIndex) => {
      const outOfStock = supplier.items.filter((i) => i.status === "OUT_OF_STOCK");
      const lowStock = supplier.items.filter((i) => i.status === "LOW_STOCK");

      lines.push(``);
      lines.push(`🏢 บริษัท: ${supplier.name}`);
      lines.push(`---------------------------------`);

      if (outOfStock.length > 0) {
        lines.push(`🔴 สินค้าหมด:`);
        outOfStock.forEach((item, idx) => {
          lines.push(`  ${idx + 1}. ${item.name} (เหลือ 0 ${item.unit})`);
        });
      }

      if (lowStock.length > 0) {
        if (outOfStock.length > 0) lines.push(``);
        lines.push(`🟡 สินค้าใกล้หมด:`);
        lowStock.forEach((item, idx) => {
          const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
          lines.push(`  ${idx + 1}. ${item.name} (เหลือ ${remain} ${item.unit})`);
        });
      }

      if (sIndex < suppliersWithAlerts.length - 1) {
        lines.push(`=================================`);
      }
    });

    return lines.join("\n");
  };

  // Copy All Suppliers to clipboard
  const handleCopyAllToClipboard = async () => {
    const text = generateAllSuppliersLineMessage();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedAll(true);
      showToast("คัดลอกสรุปสต็อกทุกบริษัทแล้ว!");
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showToast("ไม่สามารถคัดลอกได้ กรุณากดดูตัวอย่างเพื่อคัดลอก");
    }
  };

  // Copy LINE text to clipboard
  const handleCopyToClipboard = async (supplier: DashboardSupplier) => {
    const text = generateLineMessage(supplier);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedSupplierId(supplier.id);
      showToast(`คัดลอกรายการสต็อก "${supplier.name}" ไปยังคลิปบอร์ดแล้ว`);
      setTimeout(() => {
        setCopiedSupplierId(null);
      }, 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showToast("ไม่สามารถคัดลอกอัตโนมัติได้ กรุณากดดูตัวอย่างเพื่อคัดลอก");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Calculate high-level metrics
  const supplierMetrics = useMemo(() => {
    return suppliers.map((supplier) => {
      const outOfStockItems = supplier.items.filter((item) => item.status === "OUT_OF_STOCK");
      const lowStockItems = supplier.items.filter((item) => item.status === "LOW_STOCK");
      const hasAlerts = outOfStockItems.length > 0 || lowStockItems.length > 0;

      return {
        supplier,
        outOfStockItems,
        lowStockItems,
        hasAlerts,
      };
    });
  }, [suppliers]);

  // Overall store summary
  const grandSummary = useMemo(() => {
    let totalOutOfStock = 0;
    let totalLowStock = 0;
    let suppliersWithOrdersCount = 0;
    let suppliersWithAlertsCount = 0;

    supplierMetrics.forEach((m) => {
      totalOutOfStock += m.outOfStockItems.length;
      totalLowStock += m.lowStockItems.length;
      if (m.outOfStockItems.length > 0) {
        suppliersWithOrdersCount += 1;
      }
      if (m.hasAlerts) {
        suppliersWithAlertsCount += 1;
      }
    });

    return {
      totalOutOfStock,
      totalLowStock,
      suppliersWithOrdersCount,
      suppliersWithAlertsCount,
      totalSuppliers: suppliers.length,
    };
  }, [supplierMetrics, suppliers.length]);

  // Filtered suppliers based on tab and search
  const filteredMetrics = useMemo(() => {
    return supplierMetrics.filter((m) => {
      // Tab filter
      if (activeTab === "active" && !m.hasAlerts) {
        return false;
      }
      if (activeTab === "out_of_stock" && m.outOfStockItems.length === 0) {
        return false;
      }
      if (activeTab === "low_stock" && m.lowStockItems.length === 0) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSupplier = m.supplier.name.toLowerCase().includes(query);
        const matchesItem = m.supplier.items.some(
          (item) =>
            (item.status === "OUT_OF_STOCK" || item.status === "LOW_STOCK") &&
            item.name.toLowerCase().includes(query)
        );
        if (!matchesSupplier && !matchesItem) return false;
      }

      return true;
    });
  }, [supplierMetrics, activeTab, searchQuery]);

  return (
    <div className="flex-1 flex flex-col space-y-4 py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Approaching Order Day Alert Banner */}
      <OrderScheduleAlert
        suppliers={suppliers}
        onSelectSupplier={(supplierId) => {
          const s = suppliers.find((item) => item.id === supplierId);
          if (s) {
            setActiveTab("all");
            setSearchQuery(s.name);
          }
        }}
      />

      {/* Top Banner: Grand Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                สรุปรายการสั่งซื้อและสต็อก
              </h1>
              <p className="text-[11px] text-slate-400">
                รายการสินค้าที่ต้องสั่งซื้อและใกล้หมด แยกตามรายบริษัทคู่ค้า
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Real-time
          </span>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-rose-300 font-semibold block mb-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              สินค้าหมด (ต้องสั่ง)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              {grandSummary.totalOutOfStock} <span className="text-xs font-normal text-slate-300">รายการ</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              จาก {grandSummary.suppliersWithOrdersCount} บริษัทคู่ค้า
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-amber-300 font-semibold block mb-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              สินค้าใกล้หมด
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
              {grandSummary.totalLowStock} <span className="text-xs font-normal text-slate-300">รายการ</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              สต็อกเหลือน้อย ควรเตรียมสั่งเพิ่ม
            </div>
          </div>
        </div>

        {/* Actions for All Suppliers (Separated by Company) */}
        {grandSummary.suppliersWithAlertsCount > 0 && (
          <div className="pt-3.5 mt-3 border-t border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAllToClipboard}
              className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-all touch-manipulation"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>คัดลอกสรุปทุกบริษัทแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกสรุปทั้งหมด (แยกตามบริษัท)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPreviewAllOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-sm active:scale-[0.98] transition-all touch-manipulation border border-white/15"
            >
              <Eye className="w-4 h-4" />
              <span>ดูตัวอย่างรวม</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อคู่ค้า หรือชื่อสินค้าที่ต้องสั่ง..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[44px] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab("active")}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all touch-manipulation ${
              activeTab === "active"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            มีสินค้าต้องสั่ง/ใกล้หมด ({grandSummary.suppliersWithAlertsCount})
          </button>

          <button
            onClick={() => setActiveTab("out_of_stock")}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all touch-manipulation ${
              activeTab === "out_of_stock"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            เฉพาะสินค้าหมด ({grandSummary.suppliersWithOrdersCount})
          </button>

          <button
            onClick={() => setActiveTab("low_stock")}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all touch-manipulation ${
              activeTab === "low_stock"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            เฉพาะใกล้หมด ({supplierMetrics.filter((m) => m.lowStockItems.length > 0).length})
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all touch-manipulation ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            คู่ค้าทั้งหมด ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Supplier Order Cards List */}
      <div className="space-y-3.5">
        {filteredMetrics.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {grandSummary.suppliersWithOrdersCount === 0
                  ? "ยังไม่มีสินค้าหมดสต็อกที่ต้องสั่งซื้อ"
                  : "ไม่พบคู่ค้าตามเงื่อนไขที่เลือก"}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {grandSummary.suppliersWithOrdersCount === 0
                  ? "เมื่อเดินตรวจสต็อกและแตะเลือกสถานะ 'สินค้าหมด (Out of Stock)' รายการสั่งซื้อจะปรากฏที่นี่ทันที"
                  : "ลองเปลี่ยนตัวเลือกการกรอง หรือล้างคำค้นหาเพื่อดูรายการคู่ค้าอื่น"}
              </p>
            </div>
            {grandSummary.suppliersWithOrdersCount === 0 ? (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm active:scale-[0.98] transition-all touch-manipulation"
              >
                <ClipboardList className="w-4 h-4" />
                ไปหน้าตรวจนับสต็อก
              </Link>
            ) : (
              <button
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-[0.98] transition-all touch-manipulation"
              >
                ดูคู่ค้าทั้งหมด
              </button>
            )}
          </div>
        ) : (
          filteredMetrics.map((item) => {
            const { supplier, outOfStockItems, lowStockItems, hasAlerts } = item;
            const isExpanded = !!expandedSuppliers[supplier.id];
            const schedule = getSupplierScheduleStatus(supplier.orderDays);
            const lineMessage = generateLineMessage(supplier);
            const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(lineMessage)}`;

            const cardBorderClass =
              outOfStockItems.length > 0
                ? "border-rose-200/90 shadow-rose-500/5"
                : lowStockItems.length > 0
                ? "border-amber-200/90 shadow-amber-500/5"
                : "border-slate-200/80";

            return (
              <div
                key={supplier.id}
                className={`bg-white rounded-2xl border ${cardBorderClass} shadow-sm overflow-hidden transition-all duration-200`}
              >
                {/* Supplier Header Card */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <h2 className="text-base font-bold text-slate-900 truncate">
                          {supplier.name}
                        </h2>
                        {supplier.contactPhone && (
                          <a
                            href={`tel:${supplier.contactPhone}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium hover:bg-slate-200 transition-colors"
                          >
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {supplier.contactPhone}
                          </a>
                        )}
                      </div>

                      {supplier.note && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {supplier.note}
                        </p>
                      )}

                      {schedule && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${schedule.badgeClass}`}
                          >
                            {schedule.badgeText}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {outOfStockItems.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-700">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          ต้องสั่ง {outOfStockItems.length} รายการ
                        </span>
                      ) : lowStockItems.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          ใกล้หมด {lowStockItems.length} รายการ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          สต็อกมีครบ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Item Counts Breakdown Pills */}
                  <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      สินค้าหมด: {outOfStockItems.length} รายการ
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      ใกล้หมด: {lowStockItems.length} รายการ
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                      รวมทั้งหมด: {supplier.items.length} รายการ
                    </span>
                  </div>

                  {/* Action Buttons: Copy to LINE, Open LINE */}
                  {hasAlerts ? (
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      {/* Button 1: Copy to LINE */}
                      <button
                        onClick={() => handleCopyToClipboard(supplier)}
                        className={`min-h-[48px] px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm ${
                          copiedSupplierId === supplier.id
                            ? "bg-emerald-600 text-white"
                            : "bg-[#06C755] hover:bg-[#05b34c] text-white"
                        }`}
                      >
                        {copiedSupplierId === supplier.id ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>คัดลอกข้อความแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>คัดลอกไป LINE</span>
                          </>
                        )}
                      </button>

                      {/* Button 2: Direct Open in LINE (URL scheme) */}
                      <a
                        href={lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 text-[#06C755]" />
                        <span>เปิดใน LINE</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <Link
                        href="/"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                        ไปตรวจนับสต็อกสินค้ารายการนี้
                      </Link>
                    </div>
                  )}

                  {/* Toggle Accordion Breakdown */}
                  {hasAlerts && (
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => toggleExpand(supplier.id)}
                        className="min-h-[40px] text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5 py-1 touch-manipulation transition-colors"
                      >
                        <span>
                          {isExpanded
                            ? "ซ่อนรายการสินค้า"
                            : `ดูรายการสินค้า (${[
                                outOfStockItems.length > 0 ? `หมด ${outOfStockItems.length}` : "",
                                lowStockItems.length > 0 ? `ใกล้หมด ${lowStockItems.length}` : "",
                              ]
                                .filter(Boolean)
                                .join(", ")} รายการ)`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      <button
                        onClick={() => setPreviewSupplier(supplier)}
                        className="min-h-[40px] text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 touch-manipulation transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูตัวอย่างข้อความ</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Item Breakdown Table / List */}
                {hasAlerts && isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-4 space-y-3">
                    {/* Out of Stock Section */}
                    {outOfStockItems.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>สินค้าที่หมดแล้ว ({outOfStockItems.length} รายการ)</span>
                        </div>

                        <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                          {outOfStockItems.map((item, idx) => {
                            return (
                              <div
                                key={item.id}
                                className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-400 w-4">
                                      {idx + 1}.
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                </div>

                                {/* Out of Stock status: เหลือ 0 ไม่ต้องสั่ง 1 */}
                                <div className="shrink-0 text-right">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    เหลือ 0 {item.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Low Stock Section */}
                    {lowStockItems.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>สินค้าที่ใกล้หมด ({lowStockItems.length} รายการ)</span>
                        </div>

                        <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                          {lowStockItems.map((item, idx) => {
                            const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
                            return (
                              <div
                                key={item.id}
                                className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-400 w-4">
                                      {idx + 1}.
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                </div>

                                <div className="shrink-0 text-right">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    เหลือ {remain} {item.unit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal for Formatted LINE Message */}
      {previewSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  ตัวอย่างข้อความสั่งซื้อ (LINE Message Preview)
                </h3>
              </div>
              <button
                onClick={() => setPreviewSupplier(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formatted Text Box */}
            <div className="flex-1 overflow-y-auto">
              <pre className="w-full p-4 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed select-all">
                {generateLineMessage(previewSupplier)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleCopyToClipboard(previewSupplier);
                }}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
              >
                <Copy className="w-4 h-4" />
                คัดลอกข้อความ
              </button>

              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(
                  generateLineMessage(previewSupplier)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-[#06C755]" />
                เปิดแอป LINE
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for All Suppliers Message Separated by Company */}
      {previewAllOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    สรุปสต็อกทุกบริษัท (แยกตามบริษัท)
                  </h3>
                  <p className="text-[11px] text-slate-400">ตัวอย่างข้อความสำหรับส่ง LINE</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAllOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formatted Text Box */}
            <div className="flex-1 overflow-y-auto">
              <pre className="w-full p-4 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed select-all">
                {generateAllSuppliersLineMessage()}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyAllToClipboard}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความ</span>
              </button>

              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(
                  generateAllSuppliersLineMessage()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-[#06C755]" />
                <span>เปิดแอป LINE</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
