"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  Search,
  MessageCircle,
  Eye,
  X,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Banknote,
  CheckCircle2,
  Pencil,
  RotateCcw,
  Package,
} from "lucide-react";
import {
  updateItemStockStatus,
  toggleItemOrderedStatus,
  toggleSupplierItemsOrdered,
  StockStatus,
} from "@/actions/stock";
import { OrderScheduleAlert } from "@/components/OrderScheduleAlert";
import { getSupplierScheduleStatus } from "@/lib/order-schedule";
import { useLanguage } from "@/contexts/LanguageContext";

export interface DashboardItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  note?: string | null;
  status: string;
  remain?: number | null;
  ordered?: number | null;
  isOrdered?: boolean;
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

interface EditingStockItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  supplierName: string;
  supplierId: string;
  status: StockStatus;
  remain: number;
  ordered: number;
}

type FilterTab = "active" | "out_of_stock" | "low_stock" | "all";

export default function OrderDashboardView({ initialSuppliers }: OrderDashboardViewProps) {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [suppliers, setSuppliers] = useState<DashboardSupplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("active");
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [expandedInStock, setExpandedInStock] = useState<Record<string, boolean>>({});
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [previewSupplier, setPreviewSupplier] = useState<DashboardSupplier | null>(null);
  const [previewAllOpen, setPreviewAllOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Quick Edit Modal State
  const [editingItem, setEditingItem] = useState<EditingStockItem | null>(null);
  const [editStatus, setEditStatus] = useState<StockStatus>("NONE");
  const [editRemain, setEditRemain] = useState<number | string>(0);
  const [editOrdered, setEditOrdered] = useState<number | string>(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Helper to format currency
  const formatBaht = (amount: number) => {
    return `฿${amount.toLocaleString(lang === "en" ? "en-US" : "th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Toggle accordion expand/collapse
  const toggleExpand = (supplierId: string) => {
    setExpandedSuppliers((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }));
  };

  const toggleInStockExpand = (supplierId: string) => {
    setExpandedInStock((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Open Quick Edit Modal for an item
  const handleOpenEdit = (item: DashboardItem, supplierName: string) => {
    const status = (item.status as StockStatus) || "NONE";
    const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
    const ordered = item.ordered !== null && item.ordered !== undefined && item.ordered > 0 ? item.ordered : 1;

    setEditingItem({
      id: item.id,
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice,
      supplierName,
      supplierId: item.supplierId,
      status,
      remain,
      ordered,
    });
    setEditStatus(status);
    setEditRemain(remain);
    setEditOrdered(ordered);
  };

  // Save the edited stock status
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);

    const targetStatus = editStatus;
    const parsedRemain = parseFloat(String(editRemain));
    const parsedOrdered = parseFloat(String(editOrdered));

    const targetRemain =
      targetStatus === "LOW_STOCK" || targetStatus === "IN_STOCK" || targetStatus === "OUT_OF_STOCK"
        ? !isNaN(parsedRemain) && parsedRemain >= 0 ? parsedRemain : 0
        : null;

    const targetOrdered =
      targetStatus === "OUT_OF_STOCK"
        ? !isNaN(parsedOrdered) && parsedOrdered > 0 ? parsedOrdered : 1
        : null;

    // Optimistically update local suppliers state
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== editingItem.supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== editingItem.id) return i;
            return {
              ...i,
              status: targetStatus,
              remain: targetRemain,
              ordered: targetOrdered,
            };
          }),
        };
      })
    );

    // Call server action
    const res = await updateItemStockStatus(
      editingItem.id,
      targetStatus,
      targetRemain,
      targetOrdered
    );

    setIsSavingEdit(false);
    setEditingItem(null);

    if (res.success) {
      if (targetStatus === "NONE") {
        showToast(lang === "en" ? `Moved "${editingItem.name}" back to stock check` : `ย้าย "${editingItem.name}" กลับไปที่หน้าตรวจนับสต็อกแล้ว`);
      } else {
        showToast(lang === "en" ? `Saved changes for "${editingItem.name}"` : `บันทึกการแก้ไข "${editingItem.name}" เรียบร้อยแล้ว`);
      }
    } else {
      showToast(res.error || (lang === "en" ? "Failed to save changes" : "เกิดข้อผิดพลาดในการแก้ไข"));
    }
  };

  // Update ordered quantity on out-of-stock items directly in dashboard
  const handleQuantityChange = (supplierId: string, itemId: string, delta: number) => {
    let targetQty = 1;
    let targetRemain = 0;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const current = i.ordered && i.ordered > 0 ? i.ordered : 1;
            const next = Math.max(delta < 0 && current <= 1 ? (current > 0.5 ? 0.5 : 0.1) : 0.1, Math.round((current + delta) * 100) / 100);
            targetQty = next;
            targetRemain = i.remain !== null && i.remain !== undefined ? i.remain : 0;
            return { ...i, ordered: next };
          }),
        };
      })
    );

    startTransition(async () => {
      await updateItemStockStatus(itemId, "OUT_OF_STOCK", targetRemain, targetQty);
    });
  };

  // Direct input change for ordered quantity on out-of-stock items
  const handleDirectQuantityChange = (supplierId: string, itemId: string, val: string) => {
    const parsed = parseFloat(val);
    const targetQty = !isNaN(parsed) && parsed > 0 ? parsed : 1;
    let targetRemain = 0;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            targetRemain = i.remain !== null && i.remain !== undefined ? i.remain : 0;
            return { ...i, ordered: targetQty };
          }),
        };
      })
    );

    startTransition(async () => {
      await updateItemStockStatus(itemId, "OUT_OF_STOCK", targetRemain, targetQty);
    });
  };

  // Update remain quantity on out-of-stock items directly in dashboard
  const handleItemRemainChange = (supplierId: string, itemId: string, delta: number) => {
    let targetRemain = 0;
    let targetQty = 1;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const current = i.remain !== null && i.remain !== undefined ? i.remain : 0;
            const next = Math.max(0, Math.round((current + delta) * 100) / 100);
            targetRemain = next;
            targetQty = i.ordered && i.ordered > 0 ? i.ordered : 1;
            return { ...i, remain: next };
          }),
        };
      })
    );

    startTransition(async () => {
      await updateItemStockStatus(itemId, "OUT_OF_STOCK", targetRemain, targetQty);
    });
  };

  // Direct input change for remain on out-of-stock items
  const handleDirectRemainChange = (supplierId: string, itemId: string, val: string) => {
    const parsed = parseFloat(val);
    const targetRemain = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    let targetQty = 1;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            targetQty = i.ordered && i.ordered > 0 ? i.ordered : 1;
            return { ...i, remain: targetRemain };
          }),
        };
      })
    );

    startTransition(async () => {
      await updateItemStockStatus(itemId, "OUT_OF_STOCK", targetRemain, targetQty);
    });
  };

  // Update remain quantity on low-stock items directly in dashboard
  const handleRemainChange = (supplierId: string, itemId: string, delta: number) => {
    let targetRemain = 0;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            const current = i.remain !== null && i.remain !== undefined ? i.remain : 0;
            const next = Math.max(0, Math.round((current + delta) * 100) / 100);
            targetRemain = next;
            return { ...i, remain: next };
          }),
        };
      })
    );

    startTransition(async () => {
      await updateItemStockStatus(itemId, "LOW_STOCK", targetRemain, null);
    });
  };

  // Toggle ordered checkbox for a single item
  const handleToggleItemOrdered = (supplierId: string, itemId: string) => {
    let nextState = false;

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.id !== itemId) return i;
            nextState = !i.isOrdered;
            return { ...i, isOrdered: nextState };
          }),
        };
      })
    );

    startTransition(async () => {
      await toggleItemOrderedStatus(itemId, nextState);
    });

    showToast(nextState ? (lang === "en" ? "Marked as ordered ✓" : "ทำเครื่องหมายว่าสั่งแล้ว ✓") : (lang === "en" ? "Marked as pending order" : "เปลี่ยนสถานะเป็นยังไม่สั่ง"));
  };

  // Bulk toggle ordered for all alert items of a supplier
  const handleToggleSupplierAllOrdered = (supplierId: string, targetState: boolean) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return {
          ...s,
          items: s.items.map((i) => {
            if (i.status === "OUT_OF_STOCK" || i.status === "LOW_STOCK") {
              return { ...i, isOrdered: targetState };
            }
            return i;
          }),
        };
      })
    );

    startTransition(async () => {
      await toggleSupplierItemsOrdered(supplierId, targetState);
    });

    showToast(targetState ? (lang === "en" ? "Marked all items as ordered ✓" : "ติ๊กสั่งแล้วทุกรายการ ✓") : (lang === "en" ? "Unmarked all ordered items" : "ยกเลิกสถานะสั่งแล้วทั้งหมด"));
  };

  // Helper to format date for LINE message
  const getFormattedThaiDate = () => {
    const now = new Date();
    return now.toLocaleDateString(lang === "en" ? "en-US" : "th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate LINE export formatted string for a single supplier
  const generateLineMessage = (supplier: DashboardSupplier) => {
    const isEn = lang === "en";
    const dateStr = getFormattedThaiDate();
    const outOfStockItems = supplier.items.filter((item) => item.status === "OUT_OF_STOCK");
    const lowStockItems = supplier.items.filter((item) => item.status === "LOW_STOCK");

    let totalAmount = 0;
    outOfStockItems.forEach((i) => {
      const qty = i.ordered && i.ordered > 0 ? i.ordered : 1;
      totalAmount += i.unitPrice * qty;
    });

    const lines: string[] = [
      isEn ? `📦 Order Summary - ${supplier.name}` : `📦 สรุปรายการสั่งซื้อ - ${supplier.name}`,
      isEn ? `📅 Date: ${dateStr}` : `📅 วันที่: ${dateStr}`,
      `---------------------------------`,
    ];

      if (outOfStockItems.length > 0) {
        lines.push(isEn ? `🔴 Out of Stock (Must Order):` : `🔴 สินค้าหมด (ต้องสั่ง):`);
        outOfStockItems.forEach((item, index) => {
          const qty = item.ordered && item.ordered > 0 ? item.ordered : 1;
          const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
          const lineTotal = item.unitPrice * qty;
          const orderTag = item.isOrdered ? (isEn ? "[✓ Ordered]" : "[✓ สั่งแล้ว]") : (isEn ? "[Pending]" : "[รอสั่ง]");
          const remainTag = remain > 0 ? ` (${isEn ? "Remain" : "เหลือ"} ${remain} ${item.unit})` : "";
          const priceTag = item.unitPrice > 0 ? ` (@ ${formatBaht(item.unitPrice)} = ${formatBaht(lineTotal)})` : "";
          lines.push(`${index + 1}. ${orderTag} ${item.name} - ${isEn ? "Order" : "สั่ง"} ${qty} ${item.unit}${remainTag}${priceTag}`);
        });
      }

    if (lowStockItems.length > 0) {
      if (outOfStockItems.length > 0) {
        lines.push(``);
      }
      lines.push(isEn ? `🟡 Low Stock:` : `🟡 สินค้าใกล้หมด:`);
      lowStockItems.forEach((item, index) => {
        const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
        const orderTag = item.isOrdered ? (isEn ? "[✓ Ordered]" : "[✓ สั่งแล้ว]") : (isEn ? "[Pending]" : "[รอสั่ง]");
        const priceTag = item.unitPrice > 0 ? ` (${formatBaht(item.unitPrice)}/${item.unit})` : "";
        lines.push(`${index + 1}. ${orderTag} ${item.name} - ${isEn ? "Remain" : "เหลือ"} ${remain} ${item.unit}${priceTag}`);
      });
    }

    if (outOfStockItems.length === 0 && lowStockItems.length === 0) {
      lines.push(isEn ? `(No out of stock or low stock items)` : `(ไม่มีรายการสินค้าหมดหรือใกล้หมด)`);
    }

    if (totalAmount > 0) {
      lines.push(`---------------------------------`);
      lines.push(isEn ? `💰 Estimated Order Total: ${formatBaht(totalAmount)}` : `💰 ยอดสั่งซื้อประมาณการ: ${formatBaht(totalAmount)}`);
      if (supplier.minOrderAmount > 0) {
        const diff = supplier.minOrderAmount - totalAmount;
        if (diff > 0) {
          lines.push(isEn ? `🎯 Min Order: ${formatBaht(supplier.minOrderAmount)} (Need ${formatBaht(diff)} more)` : `🎯 ยอดสั่งขั้นต่ำ: ${formatBaht(supplier.minOrderAmount)} (ขาดอีก ${formatBaht(diff)})`);
        } else {
          lines.push(isEn ? `🎯 Min Order: ${formatBaht(supplier.minOrderAmount)} (✓ Met minimum)` : `🎯 ยอดสั่งขั้นต่ำ: ${formatBaht(supplier.minOrderAmount)} (✓ ครบยอดแล้ว)`);
        }
      }
    }

    if (supplier.note?.trim()) {
      lines.push(`---------------------------------`);
      lines.push(isEn ? `📝 Note: ${supplier.note.trim()}` : `📝 หมายเหตุ: ${supplier.note.trim()}`);
    }

    return lines.join("\n");
  };

  // Generate combined LINE export formatted string separated by company
  const generateAllSuppliersLineMessage = () => {
    const isEn = lang === "en";
    const dateStr = getFormattedThaiDate();
    const suppliersWithAlerts = suppliers.filter((s) =>
      s.items.some((i) => i.status === "OUT_OF_STOCK" || i.status === "LOW_STOCK")
    );

    let grandTotal = 0;

    const lines: string[] = [
      isEn ? `📦 Order & Stock Summary (By Supplier)` : `📦 สรุปรายการสั่งซื้อและสต็อก (แยกตามบริษัท)`,
      isEn ? `📅 Date: ${dateStr}` : `📅 วันที่: ${dateStr}`,
      `=================================`,
    ];

    if (suppliersWithAlerts.length === 0) {
      lines.push(isEn ? `(All items well-stocked, no alerts)` : `(สต็อกมีครบทุกรายการ ไม่มีสินค้าหมดหรือใกล้หมด)`);
      return lines.join("\n");
    }

    suppliersWithAlerts.forEach((supplier, sIndex) => {
      const outOfStock = supplier.items.filter((i) => i.status === "OUT_OF_STOCK");
      const lowStock = supplier.items.filter((i) => i.status === "LOW_STOCK");

      let supplierTotal = 0;
      outOfStock.forEach((i) => {
        const qty = i.ordered && i.ordered > 0 ? i.ordered : 1;
        supplierTotal += i.unitPrice * qty;
      });
      grandTotal += supplierTotal;

      lines.push(``);
      lines.push(isEn ? `🏢 Supplier: ${supplier.name}` : `🏢 บริษัท: ${supplier.name}`);
      lines.push(`---------------------------------`);

      if (outOfStock.length > 0) {
        lines.push(isEn ? `🔴 Out of Stock (Must Order):` : `🔴 สินค้าหมด (ต้องสั่ง):`);
        outOfStock.forEach((item, idx) => {
          const qty = item.ordered && item.ordered > 0 ? item.ordered : 1;
          const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
          const lineTotal = item.unitPrice * qty;
          const orderTag = item.isOrdered ? (isEn ? "[✓ Ordered]" : "[✓ สั่งแล้ว]") : (isEn ? "[Pending]" : "[รอสั่ง]");
          const remainTag = remain > 0 ? ` (${isEn ? "Remain" : "เหลือ"} ${remain} ${item.unit})` : "";
          const priceTag = item.unitPrice > 0 ? ` (@ ${formatBaht(item.unitPrice)} = ${formatBaht(lineTotal)})` : "";
          lines.push(`  ${idx + 1}. ${orderTag} ${item.name} - ${isEn ? "Order" : "สั่ง"} ${qty} ${item.unit}${remainTag}${priceTag}`);
        });
      }

      if (lowStock.length > 0) {
        if (outOfStock.length > 0) lines.push(``);
        lines.push(isEn ? `🟡 Low Stock:` : `🟡 สินค้าใกล้หมด:`);
        lowStock.forEach((item, idx) => {
          const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
          const orderTag = item.isOrdered ? (isEn ? "[✓ Ordered]" : "[✓ สั่งแล้ว]") : (isEn ? "[Pending]" : "[รอสั่ง]");
          const priceTag = item.unitPrice > 0 ? ` (${formatBaht(item.unitPrice)}/${item.unit})` : "";
          lines.push(`  ${idx + 1}. ${orderTag} ${item.name} - ${isEn ? "Remain" : "เหลือ"} ${remain} ${item.unit}${priceTag}`);
        });
      }

      if (supplierTotal > 0) {
        lines.push(isEn ? `💰 Supplier Order Total: ${formatBaht(supplierTotal)}` : `💰 ยอดสั่งบริษัทนี้: ${formatBaht(supplierTotal)}`);
        if (supplier.minOrderAmount > 0) {
          const diff = supplier.minOrderAmount - supplierTotal;
          if (diff > 0) {
            lines.push(isEn ? `🎯 Min Order: ${formatBaht(supplier.minOrderAmount)} (Need ${formatBaht(diff)} more)` : `🎯 ยอดขั้นต่ำ: ${formatBaht(supplier.minOrderAmount)} (ขาดอีก ${formatBaht(diff)})`);
          } else {
            lines.push(isEn ? `🎯 Min Order: ${formatBaht(supplier.minOrderAmount)} (✓ Met minimum)` : `🎯 ยอดขั้นต่ำ: ${formatBaht(supplier.minOrderAmount)} (✓ ครบยอดแล้ว)`);
          }
        }
      }

      if (sIndex < suppliersWithAlerts.length - 1) {
        lines.push(`=================================`);
      }
    });

    if (grandTotal > 0) {
      lines.push(``);
      lines.push(`=================================`);
      lines.push(isEn ? `💵 Grand Total Order Across All Suppliers: ${formatBaht(grandTotal)}` : `💵 ยอดสั่งซื้อประมาณการรวมทุกบริษัท: ${formatBaht(grandTotal)}`);
      lines.push(`=================================`);
    }

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
      showToast(t("copy_all_success"));
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showToast(t("toast_copy_error"));
    }
  };

  // Copy LINE text to clipboard
  const handleCopyToClipboard = async (supplier: DashboardSupplier) => {
    const text = generateLineMessage(supplier);
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

      setCopiedSupplierId(supplier.id);
      showToast(lang === "en" ? `Copied order list for "${supplier.name}" to clipboard` : `คัดลอกรายการสต็อก "${supplier.name}" ไปยังคลิปบอร์ดแล้ว`);
      setTimeout(() => {
        setCopiedSupplierId(null);
      }, 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showToast(t("toast_copy_error"));
    }
  };

  // Calculate high-level metrics including pricing, inStock, and ordered counts
  const supplierMetrics = useMemo(() => {
    return suppliers.map((supplier) => {
      const outOfStockItems = supplier.items.filter((item) => item.status === "OUT_OF_STOCK");
      const lowStockItems = supplier.items.filter((item) => item.status === "LOW_STOCK");
      const inStockItems = supplier.items.filter((item) => item.status === "IN_STOCK");
      const uncountedItems = supplier.items.filter((item) => item.status === "NONE");

      const alertItems = [...outOfStockItems, ...lowStockItems];
      const hasAlerts = alertItems.length > 0;

      // Pricing
      let estimatedOrderAmount = 0;
      outOfStockItems.forEach((i) => {
        const qty = i.ordered && i.ordered > 0 ? i.ordered : 1;
        estimatedOrderAmount += i.unitPrice * qty;
      });

      // Ordered status count
      const orderedCount = alertItems.filter((i) => Boolean(i.isOrdered)).length;
      const allOrdered = alertItems.length > 0 && orderedCount === alertItems.length;

      // Min order progress
      const minOrder = supplier.minOrderAmount || 0;
      const isMinMet = minOrder > 0 ? estimatedOrderAmount >= minOrder : true;
      const progressPercent = minOrder > 0 ? Math.min(100, Math.round((estimatedOrderAmount / minOrder) * 100)) : 100;
      const shortfall = Math.max(0, minOrder - estimatedOrderAmount);

      return {
        supplier,
        outOfStockItems,
        lowStockItems,
        inStockItems,
        uncountedItems,
        alertItems,
        hasAlerts,
        estimatedOrderAmount,
        orderedCount,
        allOrdered,
        minOrder,
        isMinMet,
        progressPercent,
        shortfall,
      };
    });
  }, [suppliers]);

  // Overall store summary
  const grandSummary = useMemo(() => {
    let totalOutOfStock = 0;
    let totalLowStock = 0;
    let totalInStock = 0;
    let totalUncounted = 0;
    let grandTotalOrderAmount = 0;
    let totalAlertItemsCount = 0;
    let totalOrderedItemsCount = 0;
    let suppliersWithOrdersCount = 0;
    let suppliersWithAlertsCount = 0;

    supplierMetrics.forEach((m) => {
      totalOutOfStock += m.outOfStockItems.length;
      totalLowStock += m.lowStockItems.length;
      totalInStock += m.inStockItems.length;
      totalUncounted += m.uncountedItems.length;
      grandTotalOrderAmount += m.estimatedOrderAmount;
      totalAlertItemsCount += m.alertItems.length;
      totalOrderedItemsCount += m.orderedCount;

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
      totalInStock,
      totalUncounted,
      grandTotalOrderAmount,
      totalAlertItemsCount,
      totalOrderedItemsCount,
      suppliersWithOrdersCount,
      suppliersWithAlertsCount,
      totalSuppliers: suppliers.length,
    };
  }, [supplierMetrics, suppliers.length]);

  // Filtered suppliers based on tab and search
  const filteredMetrics = useMemo(() => {
    return supplierMetrics.filter((m) => {
      if (activeTab === "active" && !m.hasAlerts) {
        return false;
      }
      if (activeTab === "out_of_stock" && m.outOfStockItems.length === 0) {
        return false;
      }
      if (activeTab === "low_stock" && m.lowStockItems.length === 0) {
        return false;
      }

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

      {/* Top Banner: Grand Summary with Price & Ordered Tracking */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                {t("dashboard_title")}
              </h1>
              <p className="text-[11px] text-slate-400">
                {t("dashboard_subtitle")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {t("realtime_badge")}
          </span>
        </div>

        {/* 4-Grid Big Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* Out of stock */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-rose-300 font-semibold mb-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              {t("status_out_of_stock")}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-400 tracking-tight">
              {grandSummary.totalOutOfStock} <span className="text-xs font-normal text-slate-300">{t("items_unit")}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {t("from_suppliers_count").replace("{count}", String(grandSummary.suppliersWithOrdersCount))}
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-amber-300 font-semibold mb-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {t("status_low_stock")}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight">
              {grandSummary.totalLowStock} <span className="text-xs font-normal text-slate-300">{t("items_unit")}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {t("prep_order_desc")}
            </div>
          </div>

          {/* Grand Estimated Amount */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-emerald-300 font-semibold mb-0.5 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              {t("estimated_grand_total")}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight">
              {formatBaht(grandSummary.grandTotalOrderAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {t("price_calc_desc")}
            </div>
          </div>

          {/* Ordered Progress */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-[11px] text-blue-300 font-semibold mb-0.5 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              {t("order_status_title")}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-400 tracking-tight">
              {grandSummary.totalOrderedItemsCount} / {grandSummary.totalAlertItemsCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {t("order_status_desc")}
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
                  <span>{t("copy_all_success")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t("copy_all_by_supplier")}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPreviewAllOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-sm active:scale-[0.98] transition-all touch-manipulation border border-white/15"
            >
              <Eye className="w-4 h-4" />
              <span>{t("preview_all")}</span>
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
            placeholder={t("search_supplier_item")}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="w-6 h-6 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("active")}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all touch-manipulation ${
              activeTab === "active"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab_must_order")} ({grandSummary.suppliersWithAlertsCount})
          </button>

          <button
            onClick={() => setActiveTab("out_of_stock")}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all touch-manipulation ${
              activeTab === "out_of_stock"
                ? "bg-white text-rose-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab_out_of_stock")} ({grandSummary.totalOutOfStock})
          </button>

          <button
            onClick={() => setActiveTab("low_stock")}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all touch-manipulation ${
              activeTab === "low_stock"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab_low_stock")} ({grandSummary.totalLowStock})
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all touch-manipulation ${
              activeTab === "all"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab_all")} ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Supplier Order Cards List */}
      <div className="space-y-3.5">
        {filteredMetrics.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{t("no_suppliers_found")}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery ? t("empty_search_hint") : t("empty_normal_hint")}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {t("clear_filter")}
              </button>
            )}
          </div>
        ) : (
          filteredMetrics.map((m) => {
            const {
              supplier,
              outOfStockItems,
              lowStockItems,
              inStockItems,
              uncountedItems,
              alertItems,
              hasAlerts,
              estimatedOrderAmount,
              orderedCount,
              allOrdered,
              minOrder,
              progressPercent,
              shortfall,
            } = m;

            const isExpanded = Boolean(expandedSuppliers[supplier.id]);
            const isInStockExpanded = Boolean(expandedInStock[supplier.id]);
            const schedule = getSupplierScheduleStatus(supplier.orderDays, lang);
            const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(
              generateLineMessage(supplier)
            )}`;

            return (
              <div
                key={supplier.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  hasAlerts
                    ? "border-slate-300/80 hover:border-slate-400"
                    : "border-slate-200/80 opacity-80"
                }`}
              >
                {/* Header Information Card */}
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Top line: Name & Order Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-800 leading-tight">
                          {supplier.name}
                        </h2>
                        {schedule && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              schedule.isToday
                                ? "bg-rose-100 text-rose-800 animate-pulse"
                                : schedule.isTomorrow
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {schedule.badgeText}
                          </span>
                        )}
                      </div>

                      {supplier.contactPhone && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a
                            href={`tel:${supplier.contactPhone}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {supplier.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Total Estimated Order Price Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-medium text-slate-400">{t("supplier_order_total")}</div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {formatBaht(estimatedOrderAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Min Order Progress Bar (if minOrderAmount > 0) */}
                  {minOrder > 0 && (
                    <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          {t("min_order_label")} <strong className="text-slate-800">{formatBaht(minOrder)}</strong>
                        </span>
                        <span
                          className={`font-bold ${
                            shortfall === 0 ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {shortfall === 0
                            ? t("min_order_met")
                            : `${t("min_order_shortfall")} ${formatBaht(shortfall)}`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            shortfall === 0 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stock Item Counts & Ordered Status Breakdown */}
                  <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {t("status_out_of_stock")}: {outOfStockItems.length} {t("items_unit")}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {t("status_low_stock")}: {lowStockItems.length} {t("items_unit")}
                    </span>
                    {alertItems.length > 0 && (
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                          allOrdered
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-blue-50 border-blue-200 text-blue-800"
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {t("ordered")}: {orderedCount} / {alertItems.length}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Copy to LINE, Open LINE */}
                  {hasAlerts ? (
                    <div className="pt-2 grid grid-cols-2 gap-2">
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
                            <span>{t("copy_line_success")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{t("copy_to_line")}</span>
                          </>
                        )}
                      </button>

                      <a
                        href={lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all touch-manipulation shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 text-[#06C755]" />
                        <span>{t("open_in_line")}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{t("no_items_to_order")}</span>
                      <button
                        onClick={() => toggleExpand(supplier.id)}
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? t("hide_items") : `${t("view_items")} (${supplier.items.length})`}
                      </button>
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
                            ? t("hide_items")
                            : `${t("view_items")} (${[
                                outOfStockItems.length > 0 ? `${t("status_out_of_stock")} ${outOfStockItems.length}` : "",
                                lowStockItems.length > 0 ? `${t("status_low_stock")} ${lowStockItems.length}` : "",
                              ]
                                .filter(Boolean)
                                .join(", ")} ${t("items_unit")})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Quick toggle all ordered for this supplier */}
                        <button
                          type="button"
                          onClick={() => handleToggleSupplierAllOrdered(supplier.id, !allOrdered)}
                          className="min-h-[36px] text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition-colors"
                        >
                          {allOrdered ? (
                            <>
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                              <span>{t("unmark_all_ordered")}</span>
                            </>
                          ) : (
                            <>
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{t("mark_all_ordered")}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setPreviewSupplier(supplier)}
                          className="min-h-[36px] text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 touch-manipulation transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t("preview")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Item Breakdown Table / List */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200/80 p-4 space-y-4">
                    {/* Out of Stock Section */}
                    {outOfStockItems.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t("out_of_stock_section")} ({outOfStockItems.length} {t("items_unit")})</span>
                          </span>
                          <span className="text-slate-400 font-normal">{t("tap_pencil_to_edit")}</span>
                        </div>

                        <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                          {outOfStockItems.map((item, idx) => {
                            const qty = item.ordered && item.ordered > 0 ? item.ordered : 1;
                            const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
                            const lineTotal = item.unitPrice * qty;
                            const isOrdered = Boolean(item.isOrdered);

                            return (
                              <div
                                key={item.id}
                                className={`p-3 flex items-center justify-between gap-2.5 transition-colors ${
                                  isOrdered ? "bg-emerald-50/30" : "hover:bg-slate-50/50"
                                }`}
                              >
                                {/* Checkbox "สั่งแล้ว" */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemOrdered(supplier.id, item.id)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all touch-manipulation shrink-0 ${
                                    isOrdered
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-200"
                                      : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 border border-slate-200"
                                  }`}
                                  title={isOrdered ? t("unmark_all_ordered") : t("mark_all_ordered")}
                                  aria-label={isOrdered ? t("unmark_all_ordered") : t("mark_all_ordered")}
                                >
                                  {isOrdered ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                  )}
                                </button>

                                {/* Name & Price Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-400 w-4">
                                      {idx + 1}.
                                    </span>
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isOrdered ? "text-slate-500 line-through" : "text-slate-800"
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 ml-5 text-[11px] text-slate-500 flex-wrap">
                                    <span>
                                      {t("price_colon_label")}{" "}
                                      <strong className="text-slate-700">
                                        {item.unitPrice > 0 ? formatBaht(item.unitPrice) : "0"}
                                      </strong>{" "}
                                      / {item.unit}
                                    </span>
                                    {item.unitPrice > 0 && (
                                      <span className="text-rose-600 font-bold">
                                        = {formatBaht(lineTotal)}
                                      </span>
                                    )}
                                  </div>
                                  {item.note && (
                                    <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                </div>

                                {/* Controls: Steppers for Remain & Order, plus Edit Button */}
                                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                                  {/* Remain Input & Stepper */}
                                  <div className="flex items-center gap-1 bg-amber-50/90 px-1.5 py-1 rounded-xl border border-amber-200">
                                    <span className="text-[11px] font-bold text-amber-800 whitespace-nowrap">
                                      {isEn ? "Remain:" : "เหลือ:"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleItemRemainChange(supplier.id, item.id, -1)}
                                      disabled={remain <= 0}
                                      className="w-6 h-6 flex items-center justify-center text-amber-800 hover:bg-amber-100 disabled:opacity-30 rounded transition-all touch-manipulation"
                                      title={t("decrease_remain")}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      inputMode="decimal"
                                      value={remain}
                                      onChange={(e) => handleDirectRemainChange(supplier.id, item.id, e.target.value)}
                                      className="w-10 text-center text-xs font-extrabold text-amber-900 bg-white border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleItemRemainChange(supplier.id, item.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-amber-800 hover:bg-amber-100 rounded transition-all touch-manipulation"
                                      title={t("increase_remain")}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Order Qty Input & Stepper */}
                                  <div className="flex items-center gap-1 bg-rose-50/90 px-1.5 py-1 rounded-xl border border-rose-200">
                                    <span className="text-[11px] font-bold text-rose-700 whitespace-nowrap">
                                      {isEn ? "Order:" : "สั่ง:"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(supplier.id, item.id, -1)}
                                      disabled={qty <= 0.1}
                                      className="w-6 h-6 flex items-center justify-center text-rose-700 hover:bg-rose-100 disabled:opacity-30 rounded transition-all touch-manipulation"
                                      title={t("decrease_qty")}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="any"
                                      inputMode="decimal"
                                      value={qty}
                                      onChange={(e) => handleDirectQuantityChange(supplier.id, item.id, e.target.value)}
                                      className="w-10 text-center text-xs font-extrabold text-rose-900 bg-white border border-rose-200 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(supplier.id, item.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-rose-700 hover:bg-rose-100 rounded transition-all touch-manipulation"
                                      title={t("increase_qty")}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[11px] font-bold text-rose-800 ml-0.5">
                                      {item.unit}
                                    </span>
                                  </div>

                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item, supplier.name)}
                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition-colors ml-0.5"
                                    title={t("edit_stock_title")}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
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
                        <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t("low_stock_section")} ({lowStockItems.length} {t("items_unit")})</span>
                          </span>
                          <span className="text-slate-400 font-normal">{t("adjust_remain_or_edit")}</span>
                        </div>

                        <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                          {lowStockItems.map((item, idx) => {
                            const remain = item.remain !== null && item.remain !== undefined ? item.remain : 0;
                            const isOrdered = Boolean(item.isOrdered);

                            return (
                              <div
                                key={item.id}
                                className={`p-3 flex items-center justify-between gap-2.5 transition-colors ${
                                  isOrdered ? "bg-emerald-50/30" : "hover:bg-slate-50/50"
                                }`}
                              >
                                {/* Checkbox "สั่งแล้ว" */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemOrdered(supplier.id, item.id)}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all touch-manipulation shrink-0 ${
                                    isOrdered
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-200"
                                      : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 border border-slate-200"
                                  }`}
                                  title={isOrdered ? t("unmark_all_ordered") : t("mark_all_ordered")}
                                  aria-label={isOrdered ? t("unmark_all_ordered") : t("mark_all_ordered")}
                                >
                                  {isOrdered ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-400 w-4">
                                      {idx + 1}.
                                    </span>
                                    <span
                                      className={`text-xs font-bold truncate ${
                                        isOrdered ? "text-slate-500 line-through" : "text-slate-800"
                                      }`}
                                    >
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 ml-5 text-[11px] text-slate-500">
                                    <span>
                                      {t("price_colon_label")} {item.unitPrice > 0 ? formatBaht(item.unitPrice) : "0"} / {item.unit}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                </div>

                                {/* Controls: Steppers for Remain and Edit Button */}
                                <div className="shrink-0 flex items-center gap-1.5">
                                  <div className="flex items-center gap-1 bg-amber-50/90 px-1.5 py-1 rounded-xl border border-amber-200">
                                    <span className="text-[11px] font-bold text-amber-800 whitespace-nowrap">
                                      {isEn ? "Remain:" : "เหลือ:"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemainChange(supplier.id, item.id, -1)}
                                      disabled={remain <= 0}
                                      className="w-6 h-6 flex items-center justify-center text-amber-800 hover:bg-amber-100 disabled:opacity-30 rounded transition-all touch-manipulation"
                                      title={t("decrease_remain")}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      inputMode="decimal"
                                      value={remain}
                                      onChange={(e) => {
                                        const p = parseFloat(e.target.value);
                                        const nextRemain = !isNaN(p) && p >= 0 ? p : 0;
                                        setSuppliers((prev) =>
                                          prev.map((s) => {
                                            if (s.id !== supplier.id) return s;
                                            return {
                                              ...s,
                                              items: s.items.map((i) => (i.id === item.id ? { ...i, remain: nextRemain } : i)),
                                            };
                                          })
                                        );
                                        startTransition(async () => {
                                          await updateItemStockStatus(item.id, "LOW_STOCK", nextRemain, null);
                                        });
                                      }}
                                      className="w-10 text-center text-xs font-extrabold text-amber-900 bg-white border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemainChange(supplier.id, item.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center text-amber-800 hover:bg-amber-100 rounded transition-all touch-manipulation"
                                      title={t("increase_remain")}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[11px] font-bold text-amber-800 ml-0.5">
                                      {item.unit}
                                    </span>
                                  </div>

                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item, supplier.name)}
                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition-colors ml-1"
                                    title={t("edit_stock_title")}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* In Stock Items (Collapsible Section) */}
                    {inStockItems.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => toggleInStockExpand(supplier.id)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-colors touch-manipulation"
                        >
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{t("in_stock_section")} ({inStockItems.length} {t("items_unit")})</span>
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 underline">
                            {isInStockExpanded ? t("hide_items") : t("view_edit_items")}
                          </span>
                        </button>

                        {isInStockExpanded && (
                          <div className="divide-y divide-slate-200/60 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs animate-in fade-in duration-150">
                            {inStockItems.map((item, idx) => (
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
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                      {t("status_in_stock")}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                                    {t("price_colon_label")} {item.unitPrice > 0 ? formatBaht(item.unitPrice) : "0"} / {item.unit}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item, supplier.name)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>{t("edit")}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Uncounted Items for this supplier (if any) */}
                    {uncountedItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-600 text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t("uncounted_section")}: {uncountedItems.length} {t("items_unit")}</span>
                          </span>
                          <Link
                            href="/"
                            className="text-indigo-600 hover:underline font-bold text-[11px]"
                          >
                            {t("go_to_stock_count")}
                          </Link>
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

      {/* Quick Edit Stock Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {t("edit_stock_title")}: {editingItem.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === "en" ? "Supplier" : "บริษัท"} {editingItem.supplierName} • {t("counting_unit_label")} {editingItem.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Selection Grid (4 States) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t("select_stock_status")}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditStatus("IN_STOCK")}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition-all touch-manipulation ${
                    editStatus === "IN_STOCK"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300"
                      : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{t("status_in_stock")}</div>
                    <div className="text-[10px] font-normal opacity-90">{t("in_stock_desc")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus("LOW_STOCK")}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition-all touch-manipulation ${
                    editStatus === "LOW_STOCK"
                      ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300"
                      : "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{t("status_low_stock")}</div>
                    <div className="text-[10px] font-normal opacity-90">{t("low_stock_desc")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus("OUT_OF_STOCK")}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition-all touch-manipulation ${
                    editStatus === "OUT_OF_STOCK"
                      ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300"
                      : "bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{t("status_out_of_stock")}</div>
                    <div className="text-[10px] font-normal opacity-90">{t("out_of_stock_desc")}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditStatus("NONE")}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 transition-all touch-manipulation ${
                    editStatus === "NONE"
                      ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <div>
                    <div>{t("recount_status")}</div>
                    <div className="text-[10px] font-normal opacity-90">{t("recount_desc")}</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Quantity Input based on status */}
            {editStatus === "LOW_STOCK" && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>{t("remain_qty_label")}</span>
                  <span className="text-[11px] text-amber-700 font-semibold">{editingItem.unit}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(String(editRemain)) || 0;
                      setEditRemain(Math.max(0, Math.round((cur - 1) * 100) / 100));
                    }}
                    disabled={(parseFloat(String(editRemain)) || 0) <= 0}
                    className="w-10 h-10 bg-white border border-amber-200 text-amber-800 font-bold rounded-lg flex items-center justify-center hover:bg-amber-100 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={editRemain}
                    onChange={(e) => setEditRemain(e.target.value)}
                    onBlur={() => {
                      const p = parseFloat(String(editRemain));
                      setEditRemain(!isNaN(p) && p >= 0 ? p : 0);
                    }}
                    className="flex-1 h-10 text-center font-bold text-base text-slate-800 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(String(editRemain)) || 0;
                      setEditRemain(Math.round((cur + 1) * 100) / 100);
                    }}
                    className="w-10 h-10 bg-white border border-amber-200 text-amber-800 font-bold rounded-lg flex items-center justify-center hover:bg-amber-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {editStatus === "OUT_OF_STOCK" && (
              <div className="space-y-3">
                {/* Remain Input */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>{t("remain_qty_label")}</span>
                    <span className="text-[11px] text-amber-700 font-semibold">{editingItem.unit}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(editRemain)) || 0;
                        setEditRemain(Math.max(0, Math.round((cur - 1) * 100) / 100));
                      }}
                      disabled={(parseFloat(String(editRemain)) || 0) <= 0}
                      className="w-10 h-10 bg-white border border-amber-200 text-amber-800 font-bold rounded-lg flex items-center justify-center hover:bg-amber-100 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={editRemain}
                      onChange={(e) => setEditRemain(e.target.value)}
                      onBlur={() => {
                        const p = parseFloat(String(editRemain));
                        setEditRemain(!isNaN(p) && p >= 0 ? p : 0);
                      }}
                      className="flex-1 h-10 text-center font-bold text-base text-slate-800 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(editRemain)) || 0;
                        setEditRemain(Math.round((cur + 1) * 100) / 100);
                      }}
                      className="w-10 h-10 bg-white border border-amber-200 text-amber-800 font-bold rounded-lg flex items-center justify-center hover:bg-amber-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Order Quantity Input */}
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-rose-900 flex items-center justify-between">
                    <span>{t("order_qty_label")}</span>
                    <span className="text-[11px] text-rose-700 font-semibold">{editingItem.unit}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(editOrdered)) || 0;
                        const next = cur <= 1 ? (cur > 0.5 ? 0.5 : 0.1) : Math.round((cur - 1) * 100) / 100;
                        setEditOrdered(Math.max(0.1, next));
                      }}
                      disabled={(parseFloat(String(editOrdered)) || 0) <= 0.1}
                      className="w-10 h-10 bg-white border border-rose-200 text-rose-800 font-bold rounded-lg flex items-center justify-center hover:bg-rose-100 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      inputMode="decimal"
                      value={editOrdered}
                      onChange={(e) => setEditOrdered(e.target.value)}
                      onBlur={() => {
                        const p = parseFloat(String(editOrdered));
                        setEditOrdered(!isNaN(p) && p > 0 ? p : 1);
                      }}
                      className="flex-1 h-10 text-center font-bold text-base text-slate-800 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(String(editOrdered)) || 0;
                        setEditOrdered(Math.round((cur + 1) * 100) / 100);
                      }}
                      className="w-10 h-10 bg-white border border-rose-200 text-rose-800 font-bold rounded-lg flex items-center justify-center hover:bg-rose-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {editingItem.unitPrice > 0 && (
                    <div className="text-xs text-rose-700 text-right font-medium">
                      {t("estimated_grand_total")}: <strong>{formatBaht((parseFloat(String(editOrdered)) || 1) * editingItem.unitPrice)}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all touch-manipulation"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingEdit ? t("loading") : t("save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {t("line_preview_title")} - {previewSupplier.name}
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
                {t("copy_message")}
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
                {t("open_line_app")}
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
                    {t("all_suppliers_summary_title")}
                  </h3>
                  <p className="text-[11px] text-slate-400">{t("line_preview_subtitle")}</p>
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
                <span>{t("copy_message")}</span>
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
                <span>{t("open_line_app")}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
