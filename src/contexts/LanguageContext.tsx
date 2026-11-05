"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "th" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  th: {
    // Nav
    nav_stock: "ตรวจนับสต็อก",
    nav_order: "สรุปสั่งซื้อ",
    nav_master: "ข้อมูลหลัก",
    nav_history: "ประวัติ",

    // Header
    app_title: "Dino Stock",
    app_subtitle: "ตรวจนับสต็อก",
    change_pin: "เปลี่ยนรหัส PIN",
    logout: "ออกจากระบบ",
    logout_confirm: "คุณต้องการออกจากระบบหรือไม่?",

    // Statuses
    status_none: "ยังไม่นับ",
    status_in_stock: "มีพอ",
    status_low_stock: "ใกล้หมด",
    status_out_of_stock: "สินค้าหมด",
    status_ordered: "สั่งแล้ว",
    status_pending_order: "รอสั่ง",

    // Stock check view
    counting_progress: "ความคืบหน้าการตรวจนับ",
    reset_button: "รีเซ็ต",
    search_placeholder: "ค้นหาชื่อสินค้า หรือ หมายเหตุ...",
    filter_all: "ทั้งหมด",
    items_to_count: "รอนับอีก",
    items_counted: "นับแล้ว",
    items_unit: "รายการ",
    all_counted_title: "ตรวจนับสต็อกครบถ้วนทุกรายการแล้ว! 🎉",
    all_counted_desc: "บันทึกสต็อกครบทั้งหมดแล้ว หากต้องการตรวจสอบ แก้ไขจำนวน หรือส่งออกรายการสั่งซื้อ ให้ไปที่หน้าสรุปสั่งซื้อ",
    go_to_order_summary: "ไปที่หน้าสรุปรายการสั่งซื้อ",
    empty_uncounted_title: "ไม่มีรายการสินค้ารอนับในหมวดนี้",
    empty_uncounted_desc: "รายการสินค้าทุกตัวในหมวดนี้ถูกบันทึกแล้ว",
    reset_filter: "รีเซ็ตตัวกรอง",
    unit_label: "หน่วย",
    price_label: "ราคา",
    remain_label: "จำนวนคงเหลือ (Remain)",
    order_qty_label: "จำนวนที่ต้องการสั่ง (Order Qty)",
    estimated_subtotal: "ยอดสั่งประมาณการ:",
    quick_buttons: "ปุ่มด่วน:",
    confirm_button: "ยืนยัน",
    saved_badge: "บันทึกแล้ว",
    syncing_badge: "กำลังซิงค์...",
    tap_to_count_hint: "แตะเลือกสถานะเพื่อเริ่มบันทึกการตรวจนับ",

    // Order dashboard
    dashboard_title: "สรุปรายการสั่งซื้อและสต็อก",
    dashboard_subtitle: "รายการสินค้าที่ต้องสั่งซื้อ ราคาประมาณการ และสถานะการสั่ง (แก้ไขสต็อกได้ที่นี่)",
    realtime_badge: "Real-time",
    out_of_stock_must_order: "สินค้าหมด (ต้องสั่ง)",
    low_stock_prep_order: "สินค้าใกล้หมด",
    prep_order_desc: "เตรียมสั่งเพิ่ม",
    estimated_grand_total: "ยอดสั่งประมาณการ",
    price_calc_desc: "คำนวณจากราคาต่อหน่วย",
    order_status_title: "สถานะการสั่ง",
    order_status_desc: "รายการที่สั่งแล้ว",
    copy_all_by_supplier: "คัดลอกสรุปทั้งหมด (แยกตามบริษัท)",
    copy_all_success: "คัดลอกสรุปทุกบริษัทแล้ว!",
    preview_all: "ดูตัวอย่างรวม",
    search_supplier_item: "ค้นหาชื่อคู่ค้า หรือชื่อสินค้าที่ต้องสั่ง...",
    tab_must_order: "ต้องสั่ง",
    tab_out_of_stock: "หมด",
    tab_low_stock: "ใกล้หมด",
    tab_all: "ทั้งหมด",
    supplier_order_total: "ยอดสั่งซื้อ",
    min_order_label: "ยอดสั่งขั้นต่ำ:",
    min_order_met: "✓ ครบยอดสั่งขั้นต่ำแล้ว",
    min_order_shortfall: "ขาดอีก",
    copy_to_line: "คัดลอกไป LINE",
    copy_line_success: "คัดลอกข้อความแล้ว!",
    open_in_line: "เปิดใน LINE",
    mark_all_ordered: "ติ๊กสั่งแล้วทั้งหมด",
    unmark_all_ordered: "ยกเลิกสั่งแล้ว",
    preview_line_message: "ดูตัวอย่างข้อความ",
    edit_button: "แก้ไข",
    in_stock_section: "สินค้ามีพอในสต็อก",
    uncounted_section: "ยังไม่ได้นับในรอบนี้",
    hide_items: "ซ่อน",
    view_edit_items: "ดู/แก้ไข",
    cancel: "ยกเลิก",
    save_changes: "บันทึกการแก้ไข",
    saving: "กำลังบันทึก...",

    // Modal Edit
    edit_stock_title: "แก้ไขสถานะสต็อก",
    select_stock_status: "เลือกสถานะสต็อก:",
    recount_status: "ยังไม่นับ (นับใหม่)",
    recount_desc: "ย้ายกลับไปหน้านับ",
    in_stock_desc: "ไม่ต้องสั่งเพิ่ม",
    low_stock_desc: "ระบุจำนวนคงเหลือ",
    out_of_stock_desc: "ระบุจำนวนสั่ง",

    // LINE message headers
    line_order_summary: "สรุปรายการสั่งซื้อ",
    line_date: "วันที่",
    line_out_of_stock_section: "🔴 สินค้าหมด (ต้องสั่ง):",
    line_low_stock_section: "🟡 สินค้าใกล้หมด:",
    line_no_items: "(ไม่มีรายการสินค้าหมดหรือใกล้หมด)",
    line_estimated_total: "💰 ยอดสั่งซื้อประมาณการ:",
    line_grand_total: "💵 ยอดสั่งซื้อประมาณการรวมทุกบริษัท:",
    line_note: "📝 หมายเหตุ:",

    // Master
    master_title: "จัดการข้อมูลหลัก",
    add_item: "เพิ่มสินค้า",
    add_supplier: "เพิ่มคู่ค้า",
    rank_label: "ลำดับ",

    // History
    history_title: "ประวัติการตรวจนับ",
    archive_and_reset: "รีเซ็ตประจำสัปดาห์",

    // Auth
    pin_login_title: "Dino Stock Checker",
    pin_login_desc: "ระบบตรวจนับสต็อกสินค้า",
    enter_pin: "กรุณากดรหัส PIN 4 หลัก",
    pin_error: "รหัส PIN ไม่ถูกต้อง",
  },
  en: {
    // Nav
    nav_stock: "Stock Count",
    nav_order: "Orders",
    nav_master: "Master Data",
    nav_history: "History",

    // Header
    app_title: "Dino Stock",
    app_subtitle: "Inventory",
    change_pin: "Change PIN",
    logout: "Logout",
    logout_confirm: "Do you want to logout?",

    // Statuses
    status_none: "Uncounted",
    status_in_stock: "In Stock",
    status_low_stock: "Low Stock",
    status_out_of_stock: "Out of Stock",
    status_ordered: "Ordered",
    status_pending_order: "Pending",

    // Stock check view
    counting_progress: "Counting Progress",
    reset_button: "Reset",
    search_placeholder: "Search item name or notes...",
    filter_all: "All",
    items_to_count: "Remaining",
    items_counted: "Counted",
    items_unit: "items",
    all_counted_title: "All Stock Items Counted! 🎉",
    all_counted_desc: "All inventory items have been recorded. To review, edit quantities, or export order messages, visit the Orders page.",
    go_to_order_summary: "Go to Order Summary",
    empty_uncounted_title: "No uncounted items in this filter",
    empty_uncounted_desc: "All items in this category have been checked.",
    reset_filter: "Reset Filters",
    unit_label: "Unit",
    price_label: "Price",
    remain_label: "Remaining Qty (Remain)",
    order_qty_label: "Order Qty (To Order)",
    estimated_subtotal: "Estimated Subtotal:",
    quick_buttons: "Quick:",
    confirm_button: "Confirm",
    saved_badge: "Saved",
    syncing_badge: "Syncing...",
    tap_to_count_hint: "Tap a status to begin counting",

    // Order dashboard
    dashboard_title: "Order Summary & Stock",
    dashboard_subtitle: "Items to order, estimated costs, and order status (edit stock here)",
    realtime_badge: "Real-time",
    out_of_stock_must_order: "Out of Stock (Order)",
    low_stock_prep_order: "Low Stock",
    prep_order_desc: "Prepare to order",
    estimated_grand_total: "Estimated Order Total",
    price_calc_desc: "Based on unit price",
    order_status_title: "Order Status",
    order_status_desc: "Items ordered",
    copy_all_by_supplier: "Copy All Summary (By Supplier)",
    copy_all_success: "Copied all suppliers summary!",
    preview_all: "Preview All",
    search_supplier_item: "Search supplier or item name...",
    tab_must_order: "Need Order",
    tab_out_of_stock: "Out of Stock",
    tab_low_stock: "Low Stock",
    tab_all: "All",
    supplier_order_total: "Order Total",
    min_order_label: "Min Order:",
    min_order_met: "✓ Min Order Met",
    min_order_shortfall: "Shortfall",
    copy_to_line: "Copy to LINE",
    copy_line_success: "Copied to clipboard!",
    open_in_line: "Open LINE",
    mark_all_ordered: "Mark All Ordered",
    unmark_all_ordered: "Unmark All",
    preview_line_message: "Preview Message",
    edit_button: "Edit",
    in_stock_section: "In-Stock Items",
    uncounted_section: "Uncounted This Cycle",
    hide_items: "Hide",
    view_edit_items: "View/Edit",
    cancel: "Cancel",
    save_changes: "Save Changes",
    saving: "Saving...",

    // Modal Edit
    edit_stock_title: "Edit Stock Status",
    select_stock_status: "Select Stock Status:",
    recount_status: "Uncounted (Recount)",
    recount_desc: "Move back to count page",
    in_stock_desc: "Sufficient, no order needed",
    low_stock_desc: "Specify remaining quantity",
    out_of_stock_desc: "Specify order quantity",

    // LINE message headers
    line_order_summary: "Order Summary",
    line_date: "Date",
    line_out_of_stock_section: "🔴 Out of Stock (To Order):",
    line_low_stock_section: "🟡 Low Stock:",
    line_no_items: "(No out-of-stock or low-stock items)",
    line_estimated_total: "💰 Estimated Total:",
    line_grand_total: "💵 Grand Estimated Total Across Suppliers:",
    line_note: "📝 Note:",

    // Master
    master_title: "Master Data Management",
    add_item: "Add Item",
    add_supplier: "Add Supplier",
    rank_label: "Rank",

    // History
    history_title: "Stock Count History",
    archive_and_reset: "Weekly Reset",

    // Auth
    pin_login_title: "Dino Stock Checker",
    pin_login_desc: "Inventory & Order System",
    enter_pin: "Enter 4-digit PIN",
    pin_error: "Invalid PIN, please try again",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "th",
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = "dino_stock_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");

  // Load initial language from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "th" || saved === "en") {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // LocalStorage not available or SSR
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "th" ? "en" : "th";
      try {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[lang]?.[key] || translations["th"]?.[key] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
